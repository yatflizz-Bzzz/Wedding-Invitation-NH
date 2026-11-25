import { createClient } from '@libsql/client/web';
import {
  buildFirestoreRsvpBatchPayloads,
  generateFirestoreRsvpId,
  type PrivateRsvpDoc,
  type PublicWishDoc,
} from './firestorePayloads';
import {
  RSVP_LIMITS,
  type GuestSide,
  type RsvpFormInput,
  type RsvpRecord,
} from './wedding';

export { buildFirestoreRsvpBatchPayloads, generateFirestoreRsvpId };
export type { PrivateRsvpDoc, PublicWishDoc };
export type Unsubscribe = () => void;

export const PUBLIC_WISHES_COLLECTION = 'public_wishes';
export const PRIVATE_RSVPS_COLLECTION = 'rsvp_submissions';

const LOCAL_CACHE_KEY = 'wedding_rsvp_turso_cache_v1';

const tursoUrl = (import.meta.env.VITE_TURSO_DATABASE_URL || '').trim();
const tursoToken = (import.meta.env.VITE_TURSO_AUTH_TOKEN || '').trim();

const turso = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

// Pendengar dalaman supaya UI dikemas kini serta-merta selepas hantar/ubah/padam
const activeListeners = new Set<() => void>();

function notifyListeners(): void {
  activeListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Abaikan ralat listener individu
    }
  });
}

function mapGuestSideFromDb(rawSide: unknown): GuestSide {
  const val = String(rawSide ?? '').trim();
  if (val === 'bride' || val === 'Keluarga Pengantin Perempuan') return 'bride';
  if (val === 'groom' || val === 'Keluarga Pengantin Lelaki') return 'groom';
  if (val === 'colleague' || val === 'Rakan Sekerja') return 'colleague';
  return 'friend';
}

function mapGuestSideToDb(side: GuestSide): string {
  switch (side) {
    case 'bride':
      return 'Keluarga Pengantin Perempuan';
    case 'groom':
      return 'Keluarga Pengantin Lelaki';
    case 'colleague':
      return 'Rakan Sekerja';
    default:
      return 'Rakan';
  }
}

function mapRowToPublicRecord(row: Record<string, unknown>): RsvpRecord {
  const rawStatus = String(row.attendance_status ?? '').trim();
  const isDeclining = rawStatus === 'Tidak Dapat Hadir' || rawStatus === 'declining';
  const createdAt =
    typeof row.submitted_at === 'string' && row.submitted_at
      ? row.submitted_at
      : new Date().toISOString();

  return {
    id: String(row.id ?? ''),
    fullName: String(row.full_name ?? ''),
    phone: '',
    email: '',
    side: mapGuestSideFromDb(row.guest_side),
    status: isDeclining ? 'declining' : 'attending',
    guestCount: typeof row.pax === 'number' ? row.pax : Number(row.pax ?? 0),
    sessionTime: typeof row.arrival_time === 'string' ? row.arrival_time : '',
    dietaryNotes: '',
    wishes: typeof row.wishes === 'string' ? row.wishes : '',
    feedbackRating:
      row.rating !== null && row.rating !== undefined ? Number(row.rating) : 0,
    createdAt,
  };
}

function mapRowToPrivateRecord(row: Record<string, unknown>): RsvpRecord {
  const base = mapRowToPublicRecord(row);
  const checkinRaw = String(row.checkin_status ?? '').trim();
  const checkedIn =
    checkinRaw === 'Sudah Tiba' ||
    checkinRaw === 'checked_in' ||
    checkinRaw === 'true' ||
    checkinRaw === '1';

  return {
    ...base,
    phone: typeof row.phone === 'string' ? row.phone : '',
    email: typeof row.email === 'string' ? row.email : '',
    dietaryNotes: typeof row.dietary_notes === 'string' ? row.dietary_notes : '',
    feedbackComment: typeof row.feedback === 'string' ? row.feedback : '',
    checkedIn,
    organizerNotes:
      typeof row.organizer_notes === 'string' ? row.organizer_notes : '',
    updatedAt: base.createdAt,
  };
}

async function fetchAllRowsFromTurso(): Promise<Record<string, unknown>[]> {
  if (!tursoUrl) {
    throw new Error('VITE_TURSO_DATABASE_URL belum ditetapkan di Vercel.');
  }

  const result = await turso.execute(
    'SELECT * FROM rsvp_responses ORDER BY submitted_at DESC;'
  );

  const plainRows = result.rows.map((r) => ({ ...r })) as Record<string
