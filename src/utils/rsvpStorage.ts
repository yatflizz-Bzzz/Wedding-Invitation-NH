import type { RsvpFormInput, RsvpRecord } from './wedding';

const LOCAL_STORAGE_KEY = 'nh_wedding_rsvps_v1';

export const SEED_RSVPS: RsvpRecord[] = [
  {
    id: 'seed-1',
    fullName: 'Puan Mariam & Keluarga',
    phone: '012-3849201',
    email: '',
    side: 'bride',
    status: 'attending',
    guestCount: 4,
    sessionTime: '11:00 PAGI - Ketibaan Tetamu',
    dietaryNotes: '',
    wishes:
      'Semoga ikatan perkahwinan Nabilah & Hidayat diberkati Allah SWT hingga ke Jannah. Selamat pengantin baru!',
    createdAt: '2026-11-14T09:30:00.000Z',
  },
  {
    id: 'seed-2',
    fullName: 'Farhana Azmi',
    phone: '019-7412890',
    email: 'farhana@example.com',
    side: 'friend',
    status: 'attending',
    guestCount: 2,
    sessionTime: '12:45 TENGAH HARI - Perarakan Pengantin',
    dietaryNotes: '',
    wishes:
      'Teruja untuk meraikan hari bahagia kalian dalam tema pastel! Semoga bahagia kekal abadi.',
    createdAt: '2026-11-15T14:15:00.000Z',
  },
  {
    id: 'seed-3',
    fullName: 'Encik Razak & Puan Salma',
    phone: '013-9024418',
    email: '',
    side: 'groom',
    status: 'attending',
    guestCount: 2,
    sessionTime: '11:00 PAGI - Ketibaan Tetamu',
    dietaryNotes: 'Tiada makanan laut',
    wishes:
      'Barakallahu lakuma wa baraka alaikuma. Semoga rumah tangga sentiasa dilimpahi sakinah, mawaddah dan rahmah.',
    createdAt: '2026-11-16T04:10:00.000Z',
  },
];

function readLocalRsvps(): RsvpRecord[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore localStorage access errors
  }
  return SEED_RSVPS;
}

function writeLocalRsvps(records: RsvpRecord[]): void {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore localStorage quota errors
  }
}

export async function loadRsvpsWithFallback(): Promise<RsvpRecord[]> {
  try {
    const response = await fetch('/api/rsvps', {
      headers: { Accept: 'application/json' },
    });
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      if (Array.isArray(data.rsvps)) {
        writeLocalRsvps(data.rsvps);
        return data.rsvps;
      }
    }
  } catch {
    // Fall back to local storage / seed data when hosted statically
  }
  return readLocalRsvps();
}

export async function submitRsvpWithFallback(
  payload: RsvpFormInput
): Promise<{ rsvp: RsvpRecord; rsvps: RsvpRecord[] }> {
  try {
    const response = await fetch('/api/rsvps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || 'Tidak dapat menyimpan RSVP anda. Sila cuba lagi.'
        );
      }
      if (data.rsvp && Array.isArray(data.rsvps)) {
        writeLocalRsvps(data.rsvps);
        return { rsvp: data.rsvp, rsvps: data.rsvps };
      }
    }
  } catch (err) {
    if (
      err instanceof Error &&
      err.message &&
      !err.message.toLowerCase().includes('fetch') &&
      !err.message.toLowerCase().includes('json')
    ) {
      throw err;
    }
  }

  // Static-only fallback if no Node/PHP API endpoint is active
  const newEntry: RsvpRecord = {
    id: `rsvp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...payload,
    createdAt: new Date().toISOString(),
  };
  const updated = [newEntry, ...readLocalRsvps()];
  writeLocalRsvps(updated);
  return { rsvp: newEntry, rsvps: updated };
}
