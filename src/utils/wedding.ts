export type AttendanceStatus = 'attending' | 'declining';
export type GuestSide = 'bride' | 'groom' | 'friend' | 'colleague';

export const ORGANIZER_EMAIL = 'mnorhidayat2000@gmail.com';
export const DOC_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

// Synchronized verbatim with firebase-blueprint.json schema bounds
export const RSVP_LIMITS = {
  fullNameMin: 2,
  fullNameMax: 80,
  phoneMin: 8,
  phoneMax: 24,
  emailMax: 120,
  sessionTimeMax: 64,
  dietaryNotesMax: 160,
  wishesMax: 400,
  feedbackCommentMax: 400,
  organizerNotesMax: 300,
} as const;

export interface RsvpRecord {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  side: GuestSide;
  status: AttendanceStatus;
  guestCount: number;
  sessionTime: string;
  dietaryNotes: string;
  wishes: string;
  feedbackRating?: number;
  feedbackComment?: string;
  checkedIn?: boolean;
  organizerNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RsvpFormInput {
  fullName: string;
  phone: string;
  email: string;
  side: GuestSide;
  status: AttendanceStatus;
  guestCount: number;
  sessionTime: string;
  dietaryNotes: string;
  wishes: string;
  feedbackRating?: number;
  feedbackComment?: string;
}

export interface RsvpValidationErrors {
  fullName?: string;
  phone?: string;
  email?: string;
  guestCount?: string;
  wishes?: string;
  feedbackRating?: string;
  feedbackComment?: string;
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
}

// Sunday, 27 December 2026, 11:00 AM Malaysia Time (UTC+8)
export const WEDDING_TARGET_ISO = '2026-12-27T11:00:00+08:00';

export function calculateCountdown(
  nowMs: number,
  targetIso: string = WEDDING_TARGET_ISO
): CountdownParts {
  const targetMs = new Date(targetIso).getTime();
  const diff = Math.max(0, targetMs - nowMs);
  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isComplete: true,
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    isComplete: false,
  };
}

export function padTwoDigits(value: number): string {
  return String(Math.max(0, Math.floor(value))).padStart(2, '0');
}

export function validateRsvpForm(input: RsvpFormInput): RsvpValidationErrors {
  const errors: RsvpValidationErrors = {};

  const trimmedName = input.fullName.trim();
  if (trimmedName.length < RSVP_LIMITS.fullNameMin) {
    errors.fullName = 'Sila masukkan nama penuh anda (sekurang-kurangnya 2 aksara).';
  } else if (trimmedName.length > RSVP_LIMITS.fullNameMax) {
    errors.fullName = `Nama hendaklah tidak melebihi ${RSVP_LIMITS.fullNameMax} aksara.`;
  }

  const trimmedPhone = input.phone.trim();
  const digitsOnly = trimmedPhone.replace(/[^\d]/g, '');
  if (
    digitsOnly.length < 8 ||
    digitsOnly.length > 15 ||
    trimmedPhone.length > RSVP_LIMITS.phoneMax
  ) {
    errors.phone = 'Sila masukkan nombor telefon atau WhatsApp yang sah (8–15 digit).';
  }

  const trimmedEmail = input.email.trim();
  if (
    trimmedEmail.length > 0 &&
    (trimmedEmail.length > RSVP_LIMITS.emailMax || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
  ) {
    errors.email = 'Sila masukkan alamat e-mel yang sah atau biarkan kosong.';
  }

  if (input.status === 'attending') {
    if (!Number.isInteger(input.guestCount) || input.guestCount < 1 || input.guestCount > 6) {
      errors.guestCount = 'Sila pilih antara 1 hingga 6 orang tetamu.';
    }
  }

  if (input.wishes.trim().length > RSVP_LIMITS.wishesMax) {
    errors.wishes = `Ucapan hendaklah tidak melebihi ${RSVP_LIMITS.wishesMax} aksara.`;
  }

  if (typeof input.feedbackRating === 'number') {
    if (!Number.isInteger(input.feedbackRating) || input.feedbackRating < 0 || input.feedbackRating > 5) {
      errors.feedbackRating = 'Penilaian pelawat mestilah antara 1 hingga 5 bintang.';
    }
  }

  if (
    typeof input.feedbackComment === 'string' &&
    input.feedbackComment.trim().length > RSVP_LIMITS.feedbackCommentMax
  ) {
    errors.feedbackComment = `Maklum balas hendaklah tidak melebihi ${RSVP_LIMITS.feedbackCommentMax} aksara.`;
  }

  return errors;
}

export function normalizeRsvpPayload(input: RsvpFormInput): Required<RsvpFormInput> {
  const rawRating = typeof input.feedbackRating === 'number' ? Math.round(input.feedbackRating) : 0;
  const feedbackRating = Math.min(5, Math.max(0, Number.isFinite(rawRating) ? rawRating : 0));

  return {
    fullName: input.fullName.trim().slice(0, RSVP_LIMITS.fullNameMax),
    phone: input.phone.trim().slice(0, RSVP_LIMITS.phoneMax),
    email: input.email.trim().slice(0, RSVP_LIMITS.emailMax),
    side: input.side,
    status: input.status,
    guestCount:
      input.status === 'attending'
        ? Math.min(6, Math.max(1, Math.round(input.guestCount)))
        : 0,
    sessionTime: (
      input.status === 'attending'
        ? input.sessionTime.trim() || '11:00 PAGI - Ketibaan Tetamu'
        : 'Tidak Hadir'
    ).slice(0, RSVP_LIMITS.sessionTimeMax),
    dietaryNotes: input.dietaryNotes.trim().slice(0, RSVP_LIMITS.dietaryNotesMax),
    wishes: input.wishes.trim().slice(0, RSVP_LIMITS.wishesMax),
    feedbackRating,
    feedbackComment: (input.feedbackComment ?? '').trim().slice(0, RSVP_LIMITS.feedbackCommentMax),
  };
}

export function summarizeRsvps(records: RsvpRecord[]): {
  totalResponses: number;
  attendingParties: number;
  decliningParties: number;
  totalGuestsConfirmed: number;
} {
  let attendingParties = 0;
  let decliningParties = 0;
  let totalGuestsConfirmed = 0;

  for (const r of records) {
    if (r.status === 'attending') {
      attendingParties += 1;
      totalGuestsConfirmed += Math.max(1, r.guestCount);
    } else {
      decliningParties += 1;
    }
  }

  return {
    totalResponses: records.length,
    attendingParties,
    decliningParties,
    totalGuestsConfirmed,
  };
}

export interface RsvpAnalyticsSummary {
  totalResponses: number;
  attendingParties: number;
  decliningParties: number;
  totalGuestsConfirmed: number;
  checkedInParties: number;
  checkedInGuests: number;
  bySide: Record<GuestSide, { parties: number; guests: number }>;
  bySession: Array<{ sessionTime: string; parties: number; guests: number }>;
  feedbackRatingCount: number;
  averageFeedbackRating: number;
  feedbackCommentsCount: number;
}

export function summarizeRsvpAnalytics(records: RsvpRecord[]): RsvpAnalyticsSummary {
  const base = summarizeRsvps(records);
  const bySide: Record<GuestSide, { parties: number; guests: number }> = {
    bride: { parties: 0, guests: 0 },
    groom: { parties: 0, guests: 0 },
    friend: { parties: 0, guests: 0 },
    colleague: { parties: 0, guests: 0 },
  };
  const sessionMap = new Map<string, { parties: number; guests: number }>();

  let checkedInParties = 0;
  let checkedInGuests = 0;
  let feedbackRatingSum = 0;
  let feedbackRatingCount = 0;
  let feedbackCommentsCount = 0;

  for (const r of records) {
    const pax = r.status === 'attending' ? Math.max(1, r.guestCount) : 0;
    const sideEntry = bySide[r.side] ?? bySide.friend;
    sideEntry.parties += 1;
    sideEntry.guests += pax;

    if (r.status === 'attending') {
      const slot = r.sessionTime || '11:00 PAGI - Ketibaan Tetamu';
      const current = sessionMap.get(slot) ?? { parties: 0, guests: 0 };
      current.parties += 1;
      current.guests += pax;
      sessionMap.set(slot, current);
    }

    if (r.checkedIn) {
      checkedInParties += 1;
      checkedInGuests += pax;
    }

    if (typeof r.feedbackRating === 'number' && r.feedbackRating >= 1 && r.feedbackRating <= 5) {
      feedbackRatingSum += r.feedbackRating;
      feedbackRatingCount += 1;
    }

    if (typeof r.feedbackComment === 'string' && r.feedbackComment.trim().length > 0) {
      feedbackCommentsCount += 1;
    }
  }

  const bySession = Array.from(sessionMap.entries())
    .map(([sessionTime, counts]) => ({ sessionTime, ...counts }))
    .sort((a, b) => a.sessionTime.localeCompare(b.sessionTime));

  const averageFeedbackRating =
    feedbackRatingCount > 0
      ? Math.round((feedbackRatingSum / feedbackRatingCount) * 10) / 10
      : 0;

  return {
    ...base,
    checkedInParties,
    checkedInGuests,
    bySide,
    bySession,
    feedbackRatingCount,
    averageFeedbackRating,
    feedbackCommentsCount,
  };
}

const SIDE_CSV_LABELS: Record<GuestSide, string> = {
  bride: 'Keluarga Pengantin Perempuan',
  groom: 'Keluarga Pengantin Lelaki',
  friend: 'Rakan',
  colleague: 'Rakan Sekerja',
};

export function escapeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value);
  // Neutralize spreadsheet formula injection (=, +, -, @, leading tab/CR)
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  const escaped = safe.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function exportRsvpsToCsv(records: RsvpRecord[]): string {
  const headers = [
    'ID Rekod',
    'Tarikh & Masa Hantar',
    'Nama Penuh',
    'No. Telefon / WhatsApp',
    'Alamat E-mel',
    'Pihak Tetamu',
    'Status Kehadiran',
    'Bilangan Tetamu (Pax)',
    'Waktu Ketibaan',
    'Catatan Pemakanan',
    'Ucapan & Doa',
    'Penilaian Pelawat (1-5)',
    'Maklum Balas Pelawat',
    'Status Daftar Masuk',
    'Catatan Penganjur',
  ];

  const rows = records.map((r) => [
    r.id,
    r.createdAt,
    r.fullName,
    r.phone,
    r.email || '',
    SIDE_CSV_LABELS[r.side] || r.side,
    r.status === 'attending' ? 'Hadir' : 'Tidak Dapat Hadir',
    r.guestCount,
    r.sessionTime,
    r.dietaryNotes || '',
    r.wishes || '',
    r.feedbackRating && r.feedbackRating > 0 ? r.feedbackRating : '',
    r.feedbackComment || '',
    r.checkedIn ? 'Sudah Hadir' : 'Belum Tiba',
    r.organizerNotes || '',
  ]);

  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ];

  // UTF-8 BOM ensures Excel opens Malay & special characters cleanly
  return `\uFEFF${lines.join('\r\n')}`;
}

export function formatMalaysiaWhatsApp(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.startsWith('60')) {
    return `https://wa.me/${digits}`;
  }
  if (digits.startsWith('0')) {
    return `https://wa.me/6${digits}`;
  }
  return `https://wa.me/${digits}`;
}

export function buildIcsContent(): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Majlis Perkahwinan Nabilah & Hidayat//MS',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:nabilah-hidayat-20261227@royalepalace.my',
    'DTSTAMP:20261116T000000Z',
    'DTSTART:20261227T030000Z',
    'DTEND:20261227T080000Z',
    'SUMMARY:Majlis Perkahwinan Nabilah & Hidayat',
    'DESCRIPTION:Walimatulurus meraikan penyatuan Nabilah & Hidayat. Ketibaan tetamu jam 11:00 pagi, perarakan pengantin jam 12:45 tengah hari.',
    'LOCATION:Royale Palace, Level 10, Skytech Tower, 2, Jalan Teknokrat 2, Cyber 4, 63000 Cyberjaya, Selangor',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
