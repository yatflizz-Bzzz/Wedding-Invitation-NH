import { createClient, type Client } from '@libsql/client/web';

export interface RsvpResponse {
  id: string;
  submitted_at: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  guest_side?: string | null;
  attendance_status: 'Hadir' | 'Tidak Dapat Hadir' | string;
  pax: number;
  arrival_time?: string | null;
  dietary_notes?: string | null;
  wishes?: string | null;
  rating?: number | null;
  feedback?: string | null;
  checkin_status?: string | null;
  organizer_notes?: string | null;
}

const LOCAL_BACKUP_KEY = 'wedding_rsvp_emergency_cache_v1';

let tursoClient: Client | null = null;

function getTursoClient(): Client {
  if (tursoClient) return tursoClient;

  const rawUrl = (import.meta.env.VITE_TURSO_DATABASE_URL || '').trim();
  const authToken = (import.meta.env.VITE_TURSO_AUTH_TOKEN || '').trim();

  if (!rawUrl) {
    throw new Error('VITE_TURSO_DATABASE_URL tiada atau kosong.');
  }
  if (!authToken) {
    throw new Error('VITE_TURSO_AUTH_TOKEN tiada atau kosong.');
  }

  tursoClient = createClient({
    url: rawUrl.replace(/^libsql:\/\//i, 'https://'),
    authToken,
  });

  return tursoClient;
}

function saveLocalBackup(rows: RsvpResponse[]): void {
  try {
    localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(rows));
  } catch {
    // Abaikan jika storan pelayar penuh atau disekat
  }
}

export async function initRsvpTable(): Promise<void> {
  const db = getTursoClient();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS rsvp_responses (
      id TEXT PRIMARY KEY,
      submitted_at TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      guest_side TEXT,
      attendance_status TEXT NOT NULL,
      pax INTEGER NOT NULL DEFAULT 0,
      arrival_time TEXT,
      dietary_notes TEXT,
      wishes TEXT,
      rating INTEGER,
      feedback TEXT,
      checkin_status TEXT DEFAULT 'Belum Tiba',
      organizer_notes TEXT
    );
  `);
}

export async function getAllRsvps(): Promise<RsvpResponse[]> {
  try {
    const db = getTursoClient();
    const result = await db.execute(
      'SELECT * FROM rsvp_responses ORDER BY submitted_at DESC;'
    );

    const rows: RsvpResponse[] = result.rows.map((row) => ({
      id: String(row.id),
      submitted_at: String(row.submitted_at),
      full_name: String(row.full_name),
      phone: row.phone ? String(row.phone) : null,
      email: row.email ? String(row.email) : null,
      guest_side: row.guest_side ? String(row.guest_side) : null,
      attendance_status: String(row.attendance_status),
      pax: Number(row.pax ?? 0),
      arrival_time: row.arrival_time ? String(row.arrival_time) : null,
      dietary_notes: row.dietary_notes ? String(row.dietary_notes) : null,
      wishes: row.wishes ? String(row.wishes) : null,
      rating: row.rating !== null && row.rating !== undefined ? Number(row.rating) : null,
      feedback: row.feedback ? String(row.feedback) : null,
      checkin_status: row.checkin_status ? String(row.checkin_status) : 'Belum Tiba',
      organizer_notes: row.organizer_notes ? String(row.organizer_notes) : null,
    }));

    saveLocalBackup(rows);
    return rows;
  } catch (error) {
    console.error('Gagal membaca dari Turso, memuatkan cache tempatan:', error);
    const cached = localStorage.getItem(LOCAL_BACKUP_KEY);
    if (cached) {
      return JSON.parse(cached) as RsvpResponse[];
    }
    throw error;
  }
}

export async function submitNewRsvp(
  data: Omit<RsvpResponse, 'id' | 'submitted_at'> & {
    id?: string;
    submitted_at?: string;
  }
): Promise<RsvpResponse> {
  const db = getTursoClient();

  const isAttending = data.attendance_status === 'Hadir';
  const normalizedPax = isAttending ? Math.max(1, Number(data.pax || 1)) : 0;

  const newRecord: RsvpResponse = {
    id:
      data.id ||
      `rsvp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    submitted_at: data.submitted_at || new Date().toISOString(),
    full_name: data.full_name.trim(),
    phone: data.phone?.trim() || null,
    email: data.email?.trim() || null,
    guest_side: data.guest_side?.trim() || 'Rakan',
    attendance_status: data.attendance_status,
    pax: normalizedPax,
    arrival_time: data.arrival_time?.trim() || null,
    dietary_notes: data.dietary_notes?.trim() || null,
    wishes: data.wishes?.trim() || null,
    rating:
      data.rating !== null && data.rating !== undefined
        ? Number(data.rating)
        : null,
    feedback: data.feedback?.trim() || null,
    checkin_status: data.checkin_status?.trim() || 'Belum Tiba',
    organizer_notes: data.organizer_notes?.trim() || null,
  };

  await db.execute({
    sql: `
      INSERT INTO rsvp_responses (
        id, submitted_at, full_name, phone, email, guest_side,
        attendance_status, pax, arrival_time, dietary_notes,
        wishes, rating, feedback, checkin_status, organizer_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    args: [
      newRecord.id,
      newRecord.submitted_at,
      newRecord.full_name,
      newRecord.phone,
      newRecord.email,
      newRecord.guest_side,
      newRecord.attendance_status,
      newRecord.pax,
      newRecord.arrival_time,
      newRecord.dietary_notes,
      newRecord.wishes,
      newRecord.rating,
      newRecord.feedback,
      newRecord.checkin_status,
      newRecord.organizer_notes,
    ],
  });

  try {
    const existingRaw = localStorage.getItem(LOCAL_BACKUP_KEY);
    const existingList = existingRaw
      ? (JSON.parse(existingRaw) as RsvpResponse[])
      : [];
    saveLocalBackup([
      newRecord,
      ...existingList.filter((item) => item.id !== newRecord.id),
    ]);
  } catch {
    // Abaikan ralat cache tempatan
  }

  return newRecord;
}

export async function updateRsvpCheckin(
  id: string,
  checkinStatus: string,
  organizerNotes?: string | null
): Promise<void> {
  const db = getTursoClient();
  await db.execute({
    sql: `
      UPDATE rsvp_responses
      SET checkin_status = ?, organizer_notes = COALESCE(?, organizer_notes)
      WHERE id = ?;
    `,
    args: [checkinStatus, organizerNotes ?? null, id],
  });
}

export async function deleteRsvpById(id: string): Promise<void> {
  const db = getTursoClient();
  await db.execute({
    sql: 'DELETE FROM rsvp_responses WHERE id = ?;',
    args: [id],
  });
}

export async function restoreRsvpsFromBackup(
  records: RsvpResponse[]
): Promise<number> {
  const db = getTursoClient();
  await initRsvpTable();
  let restoredCount = 0;

  for (const item of records) {
    if (!item.id || !item.full_name) continue;
    await db.execute({
      sql: `
        INSERT OR REPLACE INTO rsvp_responses (
          id, submitted_at, full_name, phone, email, guest_side,
          attendance_status, pax, arrival_time, dietary_notes,
          wishes, rating, feedback, checkin_status, organizer_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      args: [
        item.id,
        item.submitted_at || new Date().toISOString(),
        item.full_name,
        item.phone ?? null,
        item.email ?? null,
        item.guest_side ?? null,
        item.attendance_status || 'Hadir',
        Number(item.pax ?? 0),
        item.arrival_time ?? null,
        item.dietary_notes ?? null,
        item.wishes ?? null,
        item.rating !== null && item.rating !== undefined
          ? Number(item.rating)
          : null,
        item.feedback ?? null,
        item.checkin_status || 'Belum Tiba',
        item.organizer_notes ?? null,
      ],
    });
    restoredCount++;
  }

  return restoredCount;
}
