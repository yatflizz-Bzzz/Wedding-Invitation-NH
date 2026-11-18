import type { GuestSide, RsvpRecord } from './wedding';

export const DEFAULT_RSVP_SPREADSHEET_TITLE = 'RSVP & Ucapan - Nabilah & Hidayat';
export const DEFAULT_RSVP_SHEET_TAB = 'RSVP Tetamu';
export const SPREADSHEET_META_STORAGE_KEY = 'nh_wedding_google_sheet_meta_v1';

export const RSVP_SHEET_HEADERS = [
  'ID Rekod',
  'Tarikh & Masa (MYT)',
  'Nama Penuh',
  'No. Telefon',
  'Alamat E-mel',
  'Pihak Tetamu',
  'Status Kehadiran',
  'Bilangan Tetamu (Pax)',
  'Waktu Ketibaan',
  'Catatan Pemakanan',
  'Ucapan & Doa',
] as const;

export interface LinkedSpreadsheetMeta {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  sheetName: string;
  ownerEmail?: string;
}

const SIDE_LABELS_MY: Record<GuestSide, string> = {
  bride: 'Keluarga Pengantin Perempuan',
  groom: 'Keluarga Pengantin Lelaki',
  friend: 'Rakan',
  colleague: 'Rakan Sekerja',
};

export function extractSpreadsheetId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch?.[1]) return urlMatch[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) return trimmed;
  return null;
}

export function formatMalaysianTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat('ms-MY', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kuala_Lumpur',
    }).format(date);
  } catch {
    return iso;
  }
}

export function rsvpToSheetRow(record: RsvpRecord): (string | number)[] {
  return [
    record.id,
    formatMalaysianTimestamp(record.createdAt),
    record.fullName,
    record.phone,
    record.email || '-',
    SIDE_LABELS_MY[record.side] || record.side,
    record.status === 'attending' ? 'Hadir' : 'Tidak Dapat Hadir',
    record.status === 'attending' ? record.guestCount : 0,
    record.sessionTime || '-',
    record.dietaryNotes || '-',
    record.wishes || '-',
  ];
}

export function readStoredSpreadsheetMeta(): LinkedSpreadsheetMeta | null {
  try {
    const raw = window.localStorage.getItem(SPREADSHEET_META_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.spreadsheetId === 'string' &&
      typeof parsed.spreadsheetUrl === 'string' &&
      typeof parsed.title === 'string' &&
      typeof parsed.sheetName === 'string'
    ) {
      return parsed as LinkedSpreadsheetMeta;
    }
  } catch {
    // Ignore storage read issues
  }
  return null;
}

export function writeStoredSpreadsheetMeta(meta: LinkedSpreadsheetMeta | null): void {
  try {
    if (!meta) {
      window.localStorage.removeItem(SPREADSHEET_META_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(SPREADSHEET_META_STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // Ignore storage write issues
  }
}

function escapeA1SheetName(sheetName: string): string {
  return `'${sheetName.replace(/'/g, "''")}'`;
}

export class GoogleAuthExpiredError extends Error {
  constructor(message = 'Sesi Google anda telah tamat. Sila log masuk semula.') {
    super(message);
    this.name = 'GoogleAuthExpiredError';
  }
}

async function parseGoogleError(res: Response, fallback: string): Promise<Error> {
  if (res.status === 401) {
    return new GoogleAuthExpiredError();
  }
  try {
    const json = await res.json();
    const message = json?.error?.message;
    if (typeof message === 'string' && message.trim()) {
      return new Error(message);
    }
  } catch {
    // Ignore JSON parse errors
  }
  return new Error(fallback);
}

export async function fetchSpreadsheetMetadata(
  accessToken: string,
  spreadsheetId: string,
  ownerEmail?: string
): Promise<LinkedSpreadsheetMeta> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}?fields=spreadsheetId,spreadsheetUrl,properties.title,sheets.properties`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    throw await parseGoogleError(res, 'Gagal membaca maklumat Google Sheets.');
  }
  const data = await res.json();
  const firstSheetTitle = data?.sheets?.[0]?.properties?.title;
  if (!firstSheetTitle) {
    throw new Error('Hamparan Google Sheets tidak mempunyai sebarang tab helaian.');
  }
  return {
    spreadsheetId: data.spreadsheetId || spreadsheetId,
    spreadsheetUrl:
      data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    title: data?.properties?.title || DEFAULT_RSVP_SPREADSHEET_TITLE,
    sheetName: firstSheetTitle,
    ownerEmail,
  };
}

export async function findExistingRsvpSpreadsheet(
  accessToken: string
): Promise<{ id: string; name: string; webViewLink?: string } | null> {
  const q = `name = '${DEFAULT_RSVP_SPREADSHEET_TITLE.replace(
    /'/g,
    "\\'"
  )}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
  const params = new URLSearchParams({
    q,
    fields: 'files(id,name,webViewLink)',
    orderBy: 'modifiedTime desc',
    pageSize: '5',
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw await parseGoogleError(res, 'Gagal menyemak fail Google Drive.');
  }
  const data = await res.json();
  const first = Array.isArray(data?.files) ? data.files[0] : null;
  return first ? { id: first.id, name: first.name, webViewLink: first.webViewLink } : null;
}

export async function createRsvpSpreadsheet(
  accessToken: string,
  ownerEmail?: string
): Promise<LinkedSpreadsheetMeta> {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: DEFAULT_RSVP_SPREADSHEET_TITLE,
        locale: 'ms_MY',
        timeZone: 'Asia/Kuala_Lumpur',
      },
      sheets: [
        {
          properties: {
            title: DEFAULT_RSVP_SHEET_TAB,
            gridProperties: { frozenRowCount: 1 },
          },
        },
      ],
    }),
  });
  if (!res.ok) {
    throw await parseGoogleError(res, 'Gagal mencipta Google Sheets baharu.');
  }
  const created = await res.json();
  const meta: LinkedSpreadsheetMeta = {
    spreadsheetId: created.spreadsheetId,
    spreadsheetUrl:
      created.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${created.spreadsheetId}/edit`,
    title: created?.properties?.title || DEFAULT_RSVP_SPREADSHEET_TITLE,
    sheetName: created?.sheets?.[0]?.properties?.title || DEFAULT_RSVP_SHEET_TAB,
    ownerEmail,
  };

  await writeHeaderRowIfEmpty(accessToken, meta.spreadsheetId, meta.sheetName);
  return meta;
}

export async function findOrCreateRsvpSpreadsheet(
  accessToken: string,
  ownerEmail?: string
): Promise<{ meta: LinkedSpreadsheetMeta; createdNew: boolean }> {
  const stored = readStoredSpreadsheetMeta();
  if (stored?.spreadsheetId) {
    try {
      const liveMeta = await fetchSpreadsheetMetadata(
        accessToken,
        stored.spreadsheetId,
        ownerEmail
      );
      await writeHeaderRowIfEmpty(accessToken, liveMeta.spreadsheetId, liveMeta.sheetName);
      writeStoredSpreadsheetMeta(liveMeta);
      return { meta: liveMeta, createdNew: false };
    } catch {
      // Stored sheet might be deleted or belong to another account; fall through to Drive search/create
    }
  }

  const found = await findExistingRsvpSpreadsheet(accessToken);
  if (found?.id) {
    const liveMeta = await fetchSpreadsheetMetadata(accessToken, found.id, ownerEmail);
    await writeHeaderRowIfEmpty(accessToken, liveMeta.spreadsheetId, liveMeta.sheetName);
    writeStoredSpreadsheetMeta(liveMeta);
    return { meta: liveMeta, createdNew: false };
  }

  const created = await createRsvpSpreadsheet(accessToken, ownerEmail);
  writeStoredSpreadsheetMeta(created);
  return { meta: created, createdNew: true };
}

export async function readExistingSheetIds(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<{ ids: Set<string>; hasHeaderRow: boolean }> {
  const range = encodeURIComponent(`${escapeA1SheetName(sheetName)}!A1:A`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${range}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    throw await parseGoogleError(res, 'Gagal membaca rekod sedia ada dari Google Sheets.');
  }
  const data = await res.json();
  const rows: unknown[][] = Array.isArray(data?.values) ? data.values : [];
  const ids = new Set<string>();
  for (let i = 0; i < rows.length; i += 1) {
    const cell = rows[i]?.[0];
    if (typeof cell === 'string' && cell.trim() && cell.trim() !== RSVP_SHEET_HEADERS[0]) {
      ids.add(cell.trim());
    }
  }
  return { ids, hasHeaderRow: rows.length > 0 };
}

export async function writeHeaderRowIfEmpty(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<void> {
  const { hasHeaderRow } = await readExistingSheetIds(accessToken, spreadsheetId, sheetName);
  if (hasHeaderRow) return;

  const range = encodeURIComponent(`${escapeA1SheetName(sheetName)}!A1:K1`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${range}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [Array.from(RSVP_SHEET_HEADERS)] }),
    }
  );
  if (!res.ok) {
    throw await parseGoogleError(res, 'Gagal menulis baris tajuk ke Google Sheets.');
  }
}

export async function appendRsvpToSheet(
  accessToken: string,
  meta: LinkedSpreadsheetMeta,
  record: RsvpRecord
): Promise<{ meta: LinkedSpreadsheetMeta; appended: boolean }> {
  const liveMeta = await fetchSpreadsheetMetadata(accessToken, meta.spreadsheetId, meta.ownerEmail);
  await writeHeaderRowIfEmpty(accessToken, liveMeta.spreadsheetId, liveMeta.sheetName);

  const { ids } = await readExistingSheetIds(
    accessToken,
    liveMeta.spreadsheetId,
    liveMeta.sheetName
  );
  if (ids.has(record.id)) {
    return { meta: liveMeta, appended: false };
  }

  const range = encodeURIComponent(`${escapeA1SheetName(liveMeta.sheetName)}!A:K`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      liveMeta.spreadsheetId
    )}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rsvpToSheetRow(record)],
      }),
    }
  );
  if (!res.ok) {
    throw await parseGoogleError(res, 'Gagal menyimpan data RSVP ke Google Sheets.');
  }
  return { meta: liveMeta, appended: true };
}

export async function syncMissingRsvpsToSheet(
  accessToken: string,
  meta: LinkedSpreadsheetMeta,
  records: RsvpRecord[]
): Promise<{ meta: LinkedSpreadsheetMeta; addedCount: number }> {
  const liveMeta = await fetchSpreadsheetMetadata(accessToken, meta.spreadsheetId, meta.ownerEmail);
  await writeHeaderRowIfEmpty(accessToken, liveMeta.spreadsheetId, liveMeta.sheetName);

  const { ids } = await readExistingSheetIds(
    accessToken,
    liveMeta.spreadsheetId,
    liveMeta.sheetName
  );
  const missing = records
    .filter((entry) => !ids.has(entry.id))
    .slice()
    .reverse();

  if (missing.length === 0) {
    return { meta: liveMeta, addedCount: 0 };
  }

  const range = encodeURIComponent(`${escapeA1SheetName(liveMeta.sheetName)}!A:K`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      liveMeta.spreadsheetId
    )}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: missing.map(rsvpToSheetRow),
      }),
    }
  );
  if (!res.ok) {
    throw await parseGoogleError(res, 'Gagal menyegerakkan rekod RSVP ke Google Sheets.');
  }
  return { meta: liveMeta, addedCount: missing.length };
}
