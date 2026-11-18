export type AttendanceStatus = 'attending' | 'declining';
export type GuestSide = 'bride' | 'groom' | 'friend' | 'colleague';

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
  createdAt: string;
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
}

export interface RsvpValidationErrors {
  fullName?: string;
  phone?: string;
  email?: string;
  guestCount?: string;
  wishes?: string;
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
  if (trimmedName.length < 2) {
    errors.fullName = 'Sila masukkan nama penuh anda (sekurang-kurangnya 2 aksara).';
  } else if (trimmedName.length > 80) {
    errors.fullName = 'Nama hendaklah tidak melebihi 80 aksara.';
  }

  const digitsOnly = input.phone.replace(/[^\d]/g, '');
  if (digitsOnly.length < 8 || digitsOnly.length > 15) {
    errors.phone = 'Sila masukkan nombor telefon atau WhatsApp yang sah (8–15 digit).';
  }

  const trimmedEmail = input.email.trim();
  if (trimmedEmail.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = 'Sila masukkan alamat e-mel yang sah atau biarkan kosong.';
  }

  if (input.status === 'attending') {
    if (!Number.isInteger(input.guestCount) || input.guestCount < 1 || input.guestCount > 6) {
      errors.guestCount = 'Sila pilih antara 1 hingga 6 orang tetamu.';
    }
  }

  if (input.wishes.trim().length > 400) {
    errors.wishes = 'Ucapan hendaklah tidak melebihi 400 aksara.';
  }

  return errors;
}

export function normalizeRsvpPayload(input: RsvpFormInput): RsvpFormInput {
  return {
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    side: input.side,
    status: input.status,
    guestCount: input.status === 'attending' ? Math.min(6, Math.max(1, Math.round(input.guestCount))) : 0,
    sessionTime: input.status === 'attending' ? input.sessionTime : 'Tidak Hadir',
    dietaryNotes: input.dietaryNotes.trim(),
    wishes: input.wishes.trim(),
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
