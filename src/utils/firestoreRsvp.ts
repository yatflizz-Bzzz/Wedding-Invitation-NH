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

type DbRow = Record<string, unknown>;

const LOCAL_CACHE_KEY = 'wedding_rsvp_turso_cache_v1';

const tursoUrl = (import.meta.env.VITE_TURSO_DATABASE_URL || '').trim();
const tursoToken = (import.meta.env.VITE_TURSO_AUTH_TOKEN || '').trim();

const turso = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

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

function mapRowToPublicRecord(row: DbRow): RsvpRecord {
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

function mapRowToPrivateRecord(row: DbRow): RsvpRecord {
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

async function fetchAllRowsFromTurso(): Promise<DbRow[]> {
  if (!tursoUrl) {
    throw new Error('VITE_TURSO_DATABASE_URL belum ditetapkan di Vercel.');
  }

  const result = await turso.execute(
    'SELECT * FROM rsvp_responses ORDER BY submitted_at DESC;'
  );

  const plainRows: DbRow[] = result.rows.map((r) => ({ ...r }));

  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(plainRows));
  } catch {
    // Abaikan jika storan pelayar penuh
  }

  return plainRows;
}

export async function submitRsvpToFirestore(input: RsvpFormInput): Promise<RsvpRecord> {
  const id = generateFirestoreRsvpId();
  const nowIso = new Date().toISOString();
  const { privateRsvpDoc } = buildFirestoreRsvpBatchPayloads(id, input, nowIso);

  const attendanceDb =
    privateRsvpDoc.status === 'declining' ? 'Tidak Dapat Hadir' : 'Hadir';
  const paxDb = privateRsvpDoc.status === 'attending' ? privateRsvpDoc.guestCount : 0;

  await turso.execute({
    sql: `
      INSERT INTO rsvp_responses (
        id, submitted_at, full_name, phone, email, guest_side,
        attendance_status, pax, arrival_time, dietary_notes,
        wishes, rating, feedback, checkin_status, organizer_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    args: [
      id,
      nowIso,
      privateRsvpDoc.fullName,
      privateRsvpDoc.phone || null,
      privateRsvpDoc.email || null,
      mapGuestSideToDb(privateRsvpDoc.side),
      attendanceDb,
      paxDb,
      privateRsvpDoc.sessionTime || null,
      privateRsvpDoc.dietaryNotes || null,
      privateRsvpDoc.wishes || null,
      privateRsvpDoc.feedbackRating > 0 ? privateRsvpDoc.feedbackRating : null,
      privateRsvpDoc.feedbackComment || null,
      privateRsvpDoc.checkedIn ? 'Sudah Tiba' : 'Belum Tiba',
      privateRsvpDoc.organizerNotes || null,
    ],
  });

  notifyListeners();

  return {
    ...privateRsvpDoc,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function subscribePublicWishes(
  onData: (records: RsvpRecord[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  let isMounted = true;

  const load = async () => {
    try {
      const rows = await fetchAllRowsFromTurso();
      if (!isMounted) return;
      const records = rows
        .map(mapRowToPublicRecord)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(records);
    } catch (error) {
      if (!isMounted) return;
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as DbRow[];
        onData(parsed.map(mapRowToPublicRecord));
        return;
      }
      console.error('Turso subscribePublicWishes error:', error);
      onError?.('Tidak dapat memuatkan ucapan tetamu daripada pangkalan data buat masa ini.');
    }
  };

  void load();
  activeListeners.add(load);
  const timer = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      void load();
    }
  }, 15000);

  return () => {
    isMounted = false;
    activeListeners.delete(load);
    window.clearInterval(timer);
  };
}

export
