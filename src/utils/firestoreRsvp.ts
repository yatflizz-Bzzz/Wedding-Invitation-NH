import { createClient, type Client } from '@libsql/client/web';
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
let cachedClient: Client | null = null;

function getTursoClient(): Client {
  if (cachedClient) return cachedClient;

  const rawUrl = (import.meta.env.VITE_TURSO_DATABASE_URL || '').trim();
  const authToken = (import.meta.env.VITE_TURSO_AUTH_TOKEN || '').trim();

  if (!rawUrl) {
    throw new Error('VITE_TURSO_DATABASE_URL belum ditetapkan di Vercel.');
  }

  const url = rawUrl.replace(/^libsql:\/\//i, 'https://');
  cachedClient = createClient({ url, authToken });
  return cachedClient;
}

const listeners = new Set<() => void>();
const notifyAll = () => listeners.forEach((fn) => fn());

function sideFromDb(raw: unknown): GuestSide {
  const s = String(raw ?? '').trim();
  if (s === 'bride' || s === 'Keluarga Pengantin Perempuan') return 'bride';
  if (s === 'groom' || s === 'Keluarga Pengantin Lelaki') return 'groom';
  if (s === 'colleague' || s === 'Rakan Sekerja') return 'colleague';
  return 'friend';
}

function sideToDb(side: GuestSide): string {
  if (side === 'bride') return 'Keluarga Pengantin Perempuan';
  if (side === 'groom') return 'Keluarga Pengantin Lelaki';
  if (side === 'colleague') return 'Rakan Sekerja';
  return 'Rakan';
}

function toPublicRecord(row: DbRow): RsvpRecord {
  const statusRaw = String(row.attendance_status ?? '').trim();
  const isDeclining = statusRaw === 'Tidak Dapat Hadir' || statusRaw === 'declining';
  return {
    id: String(row.id ?? ''),
    fullName: String(row.full_name ?? ''),
    phone: '',
    email: '',
    side: sideFromDb(row.guest_side),
    status: isDeclining ? 'declining' : 'attending',
    guestCount: Number(row.pax ?? 0),
    sessionTime: typeof row.arrival_time === 'string' ? row.arrival_time : '',
    dietaryNotes: '',
    wishes: typeof row.wishes === 'string' ? row.wishes : '',
    feedbackRating: row.rating != null ? Number(row.rating) : 0,
    createdAt:
      typeof row.submitted_at === 'string' && row.submitted_at
        ? row.submitted_at
        : new Date().toISOString(),
  };
}

function toPrivateRecord(row: DbRow): RsvpRecord {
  const base = toPublicRecord(row);
  const checkin = String(row.checkin_status ?? '').trim();
  return {
    ...base,
    phone: typeof row.phone === 'string' ? row.phone : '',
    email: typeof row.email === 'string' ? row.email : '',
    dietaryNotes: typeof row.dietary_notes === 'string' ? row.dietary_notes : '',
    feedbackComment: typeof row.feedback === 'string' ? row.feedback : '',
    checkedIn: ['Sudah Tiba', 'checked_in', 'true', '1'].includes(checkin),
    organizerNotes: typeof row.organizer_notes === 'string' ? row.organizer_notes : '',
    updatedAt: base.createdAt,
  };
}

async function fetchRows(): Promise<DbRow[]> {
  const turso = getTursoClient();
  const res = await turso.execute(
    'SELECT * FROM rsvp_responses ORDER BY submitted_at DESC;'
  );
  const rows: DbRow[] = res.rows.map((r) => ({ ...r }));
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(rows));
  } catch {
    // Abaikan jika storan pelayar penuh
  }
  return rows;
}

function subscribeRows(
  mapper: (row: DbRow) => RsvpRecord,
  onData: (records: RsvpRecord[]) => void,
  onError?: (message: string) => void,
  errMsg = 'Gagal memuatkan data daripada Turso.'
): Unsubscribe {
  let active = true;
  const load = async () => {
    try {
      const rows = await fetchRows();
      if (!active) return;
      onData(rows.map(mapper).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (err) {
      if (!active) return;
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) {
        onData((JSON.parse(cached) as DbRow[]).map(mapper));
        return;
      }
      console.error(err);
      onError?.(errMsg);
    }
  };

  void load();
  listeners.add(load);
  const timer = window.setInterval(() => {
    if (document.visibilityState === 'visible') void load();
  }, 15000);

  return () => {
    active = false;
    listeners.delete(load);
    window.clearInterval(timer);
  };
}

export async function submitRsvpToFirestore(input: RsvpFormInput): Promise<RsvpRecord> {
  const turso = getTursoClient();
  const id = generateFirestoreRsvpId();
  const nowIso = new Date().toISOString();
  const { privateRsvpDoc } = buildFirestoreRsvpBatchPayloads(id, input, nowIso);
  const isDeclining = privateRsvpDoc.status === 'declining';

  await turso.execute({
    sql: `INSERT INTO rsvp_responses (
      id, submitted_at, full_name, phone, email, guest_side,
      attendance_status, pax, arrival_time, dietary_notes,
      wishes, rating, feedback, checkin_status, organizer_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    args: [
      id,
      nowIso,
      privateRsvpDoc.fullName,
      privateRsvpDoc.phone || null,
      privateRsvpDoc.email || null,
      sideToDb(privateRsvpDoc.side),
      isDeclining ? 'Tidak Dapat Hadir' : 'Hadir',
      isDeclining ? 0 : privateRsvpDoc.guestCount,
      privateRsvpDoc.sessionTime || null,
      privateRsvpDoc.dietaryNotes || null,
      privateRsvpDoc.wishes || null,
      privateRsvpDoc.feedbackRating > 0 ? privateRsvpDoc.feedbackRating : null,
      privateRsvpDoc.feedbackComment || null,
      privateRsvpDoc.checkedIn ? 'Sudah Tiba' : 'Belum Tiba',
      privateRsvpDoc.organizerNotes || null,
    ],
  });

  notifyAll();
  return { ...privateRsvpDoc, createdAt: nowIso, updatedAt: nowIso };
}

export function subscribePublicWishes(
  onData: (records: RsvpRecord[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  return subscribeRows(
    toPublicRecord,
    onData,
    onError,
    'Tidak dapat memuatkan ucapan tetamu daripada pangkalan data buat masa ini.'
  );
}

export function subscribePrivateRsvps(
  onData: (records: RsvpRecord[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  return subscribeRows(
    toPrivateRecord,
    onData,
    onError,
    'Gagal memuatkan rekod penuh tetamu daripada Turso.'
  );
}

export async function updateOrganizerRsvpTracking(
  id: string,
  updates: { checkedIn: boolean; organizerNotes: string }
): Promise<void> {
  const turso = getTursoClient();
  const notes = updates.organizerNotes.trim().slice(0, RSVP_LIMITS.organizerNotesMax);
  await turso.execute({
    sql: 'UPDATE
