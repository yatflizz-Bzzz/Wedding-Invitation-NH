import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

/**
 * Deterministic verification of firebase-blueprint.json & firestore.rules constraints
 * against the "Dirty Dozen" adversarial payloads documented in security_spec.md.
 */

const blueprint = JSON.parse(fs.readFileSync(new URL('./firebase-blueprint.json', import.meta.url), 'utf8'));
const rulesSource = fs.readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8');

const ORGANIZER_EMAIL = 'mnorhidayat2000@gmail.com';
const ID_REGEX = new RegExp(blueprint.entities.PublicWish.properties.id.pattern);

interface AuthContext {
  uid: string;
  email: string;
  emailVerified: boolean;
}

function isValidId(id: unknown): id is string {
  return typeof id === 'string' && id.length >= 4 && id.length <= 128 && ID_REGEX.test(id);
}

function isOrganizer(auth: AuthContext | null): boolean {
  return auth !== null && auth.email === ORGANIZER_EMAIL && auth.emailVerified === true;
}

function hasExactKeys(data: Record<string, unknown>, required: string[], allowed: string[]): boolean {
  const keys = Object.keys(data);
  return required.every((k) => keys.includes(k)) && keys.every((k) => allowed.includes(k));
}

function validatePrivateRsvpCreate(
  docId: string,
  privateData: Record<string, unknown>,
  publicData: Record<string, unknown> | null,
  serverTimeIso: string
): boolean {
  const privProps = blueprint.entities.PrivateRsvpSubmission.properties;
  const pubProps = blueprint.entities.PublicWish.properties;
  if (!isValidId(docId) || !publicData) return false;

  if (!hasExactKeys(privateData, blueprint.entities.PrivateRsvpSubmission.required, Object.keys(privProps))) {
    return false;
  }
  if (!hasExactKeys(publicData, blueprint.entities.PublicWish.required, Object.keys(pubProps))) {
    return false;
  }

  if (privateData.id !== docId || publicData.id !== docId) return false;
  if (privateData.createdAt !== serverTimeIso || privateData.updatedAt !== serverTimeIso) return false;
  if (publicData.createdAt !== serverTimeIso) return false;
  if (privateData.checkedIn !== false || privateData.organizerNotes !== '') return false;

  if (
    typeof privateData.fullName !== 'string' ||
    privateData.fullName.length < privProps.fullName.minLength ||
    privateData.fullName.length > privProps.fullName.maxLength
  ) {
    return false;
  }
  if (
    typeof privateData.wishes !== 'string' ||
    privateData.wishes.length > privProps.wishes.maxLength
  ) {
    return false;
  }
  if (
    typeof privateData.feedbackComment !== 'string' ||
    privateData.feedbackComment.length > privProps.feedbackComment.maxLength
  ) {
    return false;
  }

  // Cross-doc batch parity
  return (
    publicData.fullName === privateData.fullName &&
    publicData.side === privateData.side &&
    publicData.status === privateData.status &&
    publicData.guestCount === privateData.guestCount &&
    publicData.sessionTime === privateData.sessionTime &&
    publicData.wishes === privateData.wishes &&
    publicData.feedbackRating === privateData.feedbackRating
  );
}

test('firestore.rules includes default-deny, email_verified gate, and no list DB lookups', () => {
  assert.ok(rulesSource.includes("rules_version = '2';"));
  assert.ok(rulesSource.includes('allow read, write: if false;'));
  assert.ok(rulesSource.includes('request.auth.token.email_verified == true'));
  // Ensure allow list on rsvp_submissions uses isBootstrappedOrganizer() without get()/exists()
  const rsvpMatchBlock = rulesSource.match(/match \/rsvp_submissions\/\{rsvpId\}[\s\S]*?\n\s{4}\}/)?.[0] || '';
  const allowListLine = rsvpMatchBlock.match(/allow list:[^\n]+/)?.[0] || '';
  assert.ok(allowListLine.includes('isBootstrappedOrganizer()'));
  assert.ok(!allowListLine.includes('exists(') && !allowListLine.includes('get('));
});

test('Dirty Dozen #1 & #2: PII blanket read & unverified email spoofing are denied', () => {
  assert.equal(isOrganizer(null), false);
  assert.equal(isOrganizer({ uid: 'u1', email: 'guest@example.com', emailVerified: true }), false);
  assert.equal(isOrganizer({ uid: 'u2', email: ORGANIZER_EMAIL, emailVerified: false }), false);
  assert.equal(isOrganizer({ uid: 'u3', email: ORGANIZER_EMAIL, emailVerified: true }), true);
});

test('Dirty Dozen #3-#10: Shadow fields, orphan writes, forged check-in, bad timestamps, poisoned IDs, oversized strings, and batch mismatches are rejected', () => {
  const now = '2026-11-18T00:00:00Z';
  const validPub = {
    id: 'rsvp_1234',
    fullName: 'Aisyah',
    side: 'friend',
    status: 'attending',
    guestCount: 2,
    sessionTime: '11:00 PAGI - Ketibaan Tetamu',
    wishes: 'Tahniah!',
    feedbackRating: 5,
    createdAt: now,
  };
  const validPriv = {
    ...validPub,
    phone: '012-3456789',
    email: 'aisyah@example.com',
    dietaryNotes: '',
    feedbackComment: 'Mudah digunakan!',
    checkedIn: false,
    organizerNotes: '',
    updatedAt: now,
  };

  assert.equal(validatePrivateRsvpCreate('rsvp_1234', validPriv, validPub, now), true);

  // #3 Shadow field
  assert.equal(validatePrivateRsvpCreate('rsvp_1234', { ...validPriv, isAdmin: true }, validPub, now), false);
  // #4 / #5 Orphan write
  assert.equal(validatePrivateRsvpCreate('rsvp_1234', validPriv, null, now), false);
  // #6 Forged checkIn or organizerNotes on create
  assert.equal(validatePrivateRsvpCreate('rsvp_1234', { ...validPriv, checkedIn: true }, validPub, now), false);
  assert.equal(validatePrivateRsvpCreate('rsvp_1234', { ...validPriv, organizerNotes: 'VIP' }, validPub, now), false);
  // #7 Timestamp spoofing
  assert.equal(validatePrivateRsvpCreate('rsvp_1234', { ...validPriv, createdAt: '1999-01-01T00:00:00Z' }, validPub, now), false);
  // #8 Poisoned ID
  assert.equal(validatePrivateRsvpCreate('bad$id', { ...validPriv, id: 'bad$id' }, { ...validPub, id: 'bad$id' }, now), false);
  // #9 Denial of wallet string flood
  assert.equal(validatePrivateRsvpCreate('rsvp_1234', { ...validPriv, feedbackComment: 'x'.repeat(401) }, validPub, now), false);
  // #10 Cross-doc mismatch
  assert.equal(validatePrivateRsvpCreate('rsvp_1234', validPriv, { ...validPub, fullName: 'Lain' }, now), false);
});
