import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const RSVP_FILE = path.join(DATA_DIR, 'rsvps.json');
const PORT = 3000;

interface RsvpEntry {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  side: 'bride' | 'groom' | 'friend' | 'colleague';
  status: 'attending' | 'declining';
  guestCount: number;
  sessionTime: string;
  dietaryNotes: string;
  wishes: string;
  createdAt: string;
}

const SEED_RSVPS: RsvpEntry[] = [
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
    wishes: 'Semoga ikatan perkahwinan Nabilah & Hidayat diberkati Allah SWT hingga ke Jannah. Selamat pengantin baru!',
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
    wishes: 'Teruja untuk meraikan hari bahagia kalian dalam tema pastel! Semoga bahagia kekal abadi.',
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
    wishes: 'Barakallahu lakuma wa baraka alaikuma. Semoga rumah tangga sentiasa dilimpahi sakinah, mawaddah dan rahmah.',
    createdAt: '2026-11-16T04:10:00.000Z',
  },
];

function ensureRsvpStore(): RsvpEntry[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(RSVP_FILE)) {
    fs.writeFileSync(RSVP_FILE, JSON.stringify(SEED_RSVPS, null, 2), 'utf8');
    return SEED_RSVPS;
  }
  try {
    const raw = fs.readFileSync(RSVP_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Re-seed if corrupted
  }
  fs.writeFileSync(RSVP_FILE, JSON.stringify(SEED_RSVPS, null, 2), 'utf8');
  return SEED_RSVPS;
}

function saveRsvpStore(entries: RsvpEntry[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(RSVP_FILE, JSON.stringify(entries, null, 2), 'utf8');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/rsvps', (_req, res) => {
    const entries = ensureRsvpStore();
    res.json({ rsvps: entries });
  });

  app.post('/api/rsvps', (req, res) => {
    const body = req.body ?? {};
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const side = ['bride', 'groom', 'friend', 'colleague'].includes(body.side)
      ? body.side
      : 'friend';
    const status = body.status === 'declining' ? 'declining' : 'attending';
    const rawCount = Number(body.guestCount);
    const guestCount =
      status === 'attending'
        ? Math.min(6, Math.max(1, Number.isFinite(rawCount) ? Math.round(rawCount) : 1))
        : 0;
    const sessionTime =
      status === 'attending' && typeof body.sessionTime === 'string' && body.sessionTime.trim()
        ? body.sessionTime.trim().slice(0, 64)
        : status === 'declining'
          ? 'Tidak Hadir'
          : '11:00 PAGI - Ketibaan Tetamu';
    const dietaryNotes =
      typeof body.dietaryNotes === 'string' ? body.dietaryNotes.trim().slice(0, 160) : '';
    const wishes = typeof body.wishes === 'string' ? body.wishes.trim().slice(0, 400) : '';

    if (fullName.length < 2 || fullName.length > 80) {
      res.status(400).json({ error: 'Sila masukkan nama penuh yang sah (2–80 aksara).' });
      return;
    }

    const digits = phone.replace(/[^\d]/g, '');
    if (digits.length < 8 || digits.length > 15) {
      res.status(400).json({ error: 'Sila masukkan nombor telefon yang sah (8–15 digit).' });
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Sila masukkan alamat e-mel yang sah.' });
      return;
    }

    const newEntry: RsvpEntry = {
      id: `rsvp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fullName,
      phone,
      email,
      side,
      status,
      guestCount,
      sessionTime,
      dietaryNotes,
      wishes,
      createdAt: new Date().toISOString(),
    };

    const current = ensureRsvpStore();
    const updated = [newEntry, ...current];
    saveRsvpStore(updated);

    res.status(201).json({ rsvp: newEntry, rsvps: updated });
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wedding server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
