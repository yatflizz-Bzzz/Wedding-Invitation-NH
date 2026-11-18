import assert from 'node:assert/strict';
import test from 'node:test';
import { extractSpreadsheetId, rsvpToSheetRow } from './googleSheetsRsvp';

test('extractSpreadsheetId extracts ID from Google Sheets URLs and raw IDs', () => {
  assert.equal(
    extractSpreadsheetId(
      'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0'
    ),
    '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
  );
  assert.equal(
    extractSpreadsheetId('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'),
    '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
  );
  assert.equal(extractSpreadsheetId('invalid-short'), null);
});

test('rsvpToSheetRow formats attending and declining records cleanly in Bahasa Melayu', () => {
  const attendingRow = rsvpToSheetRow({
    id: 'rsvp-100',
    fullName: 'Aina Sofea',
    phone: '012-3456789',
    email: 'aina@example.com',
    side: 'bride',
    status: 'attending',
    guestCount: 3,
    sessionTime: '11:00 PAGI - Ketibaan Tetamu',
    dietaryNotes: 'Tiada kacang',
    wishes: 'Selamat pengantin baru!',
    createdAt: '2026-11-18T10:00:00.000Z',
  });

  assert.equal(attendingRow.length, 11);
  assert.equal(attendingRow[0], 'rsvp-100');
  assert.equal(attendingRow[2], 'Aina Sofea');
  assert.equal(attendingRow[5], 'Keluarga Pengantin Perempuan');
  assert.equal(attendingRow[6], 'Hadir');
  assert.equal(attendingRow[7], 3);
  assert.equal(attendingRow[10], 'Selamat pengantin baru!');

  const decliningRow = rsvpToSheetRow({
    id: 'rsvp-101',
    fullName: 'Farid Kamil',
    phone: '013-9998888',
    email: '',
    side: 'friend',
    status: 'declining',
    guestCount: 2,
    sessionTime: 'Tidak Hadir',
    dietaryNotes: '',
    wishes: 'Semoga berbahagia.',
    createdAt: '2026-11-18T10:05:00.000Z',
  });

  assert.equal(decliningRow[4], '-');
  assert.equal(decliningRow[6], 'Tidak Dapat Hadir');
  assert.equal(decliningRow[7], 0);
});
