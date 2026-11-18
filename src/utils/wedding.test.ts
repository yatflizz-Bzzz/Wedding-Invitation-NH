import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIcsContent,
  calculateCountdown,
  formatMalaysiaWhatsApp,
  normalizeRsvpPayload,
  padTwoDigits,
  summarizeRsvps,
  validateRsvpForm,
  type RsvpRecord,
} from './wedding';

test('calculateCountdown returns exact days, hours, minutes, seconds before event', () => {
  const target = '2026-12-27T11:00:00+08:00';
  const targetMs = new Date(target).getTime();
  // 41 days, 15 hours, 10 minutes, 12 seconds before event
  const offsetMs = ((41 * 86400) + (15 * 3600) + (10 * 60) + 12) * 1000;
  const result = calculateCountdown(targetMs - offsetMs, target);
  assert.equal(result.days, 41);
  assert.equal(result.hours, 15);
  assert.equal(result.minutes, 10);
  assert.equal(result.seconds, 12);
  assert.equal(result.isComplete, false);
});

test('calculateCountdown clamps to zero when event time has passed', () => {
  const target = '2026-12-27T11:00:00+08:00';
  const targetMs = new Date(target).getTime();
  const result = calculateCountdown(targetMs + 60000, target);
  assert.deepEqual(result, {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isComplete: true,
  });
});

test('padTwoDigits formats single digits with leading zero', () => {
  assert.equal(padTwoDigits(4), '04');
  assert.equal(padTwoDigits(41), '41');
});

test('validateRsvpForm rejects missing name, invalid phone, invalid email, and out-of-range guest counts', () => {
  const errors = validateRsvpForm({
    fullName: 'A',
    phone: '123',
    email: 'bad-email',
    side: 'friend',
    status: 'attending',
    guestCount: 9,
    sessionTime: '11:00 AM',
    dietaryNotes: '',
    wishes: 'Congrats!',
  });

  assert.ok(errors.fullName);
  assert.ok(errors.phone);
  assert.ok(errors.email);
  assert.ok(errors.guestCount);
  assert.equal(errors.wishes, undefined);
});

test('validateRsvpForm allows declining with 0 guests and empty optional email', () => {
  const errors = validateRsvpForm({
    fullName: 'Nurul Ain',
    phone: '012-3456789',
    email: '',
    side: 'bride',
    status: 'declining',
    guestCount: 0,
    sessionTime: '11:00 AM',
    dietaryNotes: '',
    wishes: 'Semoga bahagia hingga ke Jannah!',
  });

  assert.deepEqual(errors, {});
});

test('normalizeRsvpPayload resets guestCount to 0 when declining and trims whitespace', () => {
  const normalized = normalizeRsvpPayload({
    fullName: '  Amirul Hakim  ',
    phone: ' 019-2700882 ',
    email: ' amirul@example.com ',
    side: 'groom',
    status: 'declining',
    guestCount: 3,
    sessionTime: '12:45 PM',
    dietaryNotes: '  None ',
    wishes: '  Tahniah! ',
  });

  assert.equal(normalized.fullName, 'Amirul Hakim');
  assert.equal(normalized.guestCount, 0);
  assert.equal(normalized.sessionTime, 'Tidak Hadir');
  assert.equal(normalized.wishes, 'Tahniah!');
});

test('summarizeRsvps aggregates confirmed guests and party counts accurately', () => {
  const sample: RsvpRecord[] = [
    {
      id: '1',
      fullName: 'Aisyah',
      phone: '0191112222',
      email: '',
      side: 'bride',
      status: 'attending',
      guestCount: 3,
      sessionTime: '11:00 AM',
      dietaryNotes: '',
      wishes: 'Selamat pengantin baru!',
      createdAt: '2026-11-16T08:00:00Z',
    },
    {
      id: '2',
      fullName: 'Farhan',
      phone: '0133334444',
      email: '',
      side: 'groom',
      status: 'declining',
      guestCount: 0,
      sessionTime: 'Not Attending',
      dietaryNotes: '',
      wishes: 'Doa terbaik untuk kalian berdua.',
      createdAt: '2026-11-16T09:00:00Z',
    },
    {
      id: '3',
      fullName: 'Zulaikha',
      phone: '0175556666',
      email: '',
      side: 'friend',
      status: 'attending',
      guestCount: 2,
      sessionTime: '12:45 PM',
      dietaryNotes: 'Vegetarian',
      wishes: 'Barakallahu lakuma!',
      createdAt: '2026-11-16T10:00:00Z',
    },
  ];

  assert.deepEqual(summarizeRsvps(sample), {
    totalResponses: 3,
    attendingParties: 2,
    decliningParties: 1,
    totalGuestsConfirmed: 5,
  });
});

test('formatMalaysiaWhatsApp formats local Malaysian numbers to wa.me links', () => {
  assert.equal(formatMalaysiaWhatsApp('019-2700882'), 'https://wa.me/60192700882');
  assert.equal(formatMalaysiaWhatsApp('+60 13-249 7603'), 'https://wa.me/60132497603');
});

test('buildIcsContent includes event summary, date, and venue address', () => {
  const ics = buildIcsContent();
  assert.ok(ics.includes('SUMMARY:Majlis Perkahwinan Nabilah & Hidayat'));
  assert.ok(ics.includes('DTSTART:20261227T030000Z'));
  assert.ok(ics.includes('Royale Palace, Level 10, Skytech Tower'));
});
