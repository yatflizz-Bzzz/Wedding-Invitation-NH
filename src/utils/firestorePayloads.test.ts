import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFirestoreRsvpBatchPayloads,
  generateFirestoreRsvpId,
} from './firestorePayloads';
import { DOC_ID_PATTERN, RSVP_LIMITS } from './wedding';

test('generateFirestoreRsvpId creates valid document IDs matching blueprint regex', () => {
  const id = generateFirestoreRsvpId();
  assert.ok(id.length >= 4 && id.length <= 128);
  assert.match(id, DOC_ID_PATTERN);
});

test('buildFirestoreRsvpBatchPayloads enforces PII isolation on publicWishDoc and truncates to blueprint bounds', () => {
  const sentinelTime = { _type: 'serverTimestamp' };
  const { publicWishDoc, privateRsvpDoc } = buildFirestoreRsvpBatchPayloads(
    'rsvp-test-001',
    {
      fullName: '  ' + 'A'.repeat(100) + '  ',
      phone: '012-3456789',
      email: 'guest@example.com',
      side: 'bride',
      status: 'attending',
      guestCount: 9,
      sessionTime: '11:00 PAGI - Ketibaan Tetamu',
      dietaryNotes: 'B'.repeat(200),
      wishes: 'C'.repeat(450),
      feedbackRating: 5,
      feedbackComment: 'D'.repeat(450),
    },
    sentinelTime
  );

  // Public doc must never expose PII
  assert.equal('phone' in publicWishDoc, false);
  assert.equal('email' in publicWishDoc, false);
  assert.equal('dietaryNotes' in publicWishDoc, false);
  assert.equal('feedbackComment' in publicWishDoc, false);
  assert.equal('organizerNotes' in publicWishDoc, false);

  // Blueprint bounds
  assert.equal(publicWishDoc.fullName.length, RSVP_LIMITS.fullNameMax);
  assert.equal(publicWishDoc.guestCount, 6);
  assert.equal(publicWishDoc.wishes.length, RSVP_LIMITS.wishesMax);
  assert.equal(privateRsvpDoc.dietaryNotes.length, RSVP_LIMITS.dietaryNotesMax);
  assert.equal(privateRsvpDoc.feedbackComment.length, RSVP_LIMITS.feedbackCommentMax);
  assert.equal(privateRsvpDoc.checkedIn, false);
  assert.equal(privateRsvpDoc.organizerNotes, '');
  assert.equal(publicWishDoc.createdAt, sentinelTime);
  assert.equal(privateRsvpDoc.createdAt, sentinelTime);
  assert.equal(privateRsvpDoc.updatedAt, sentinelTime);
});

test('buildFirestoreRsvpBatchPayloads rejects poisoned document IDs', () => {
  assert.throws(() =>
    buildFirestoreRsvpBatchPayloads(
      'bad/id$here',
      {
        fullName: 'Nurul',
        phone: '012-3456789',
        email: '',
        side: 'friend',
        status: 'attending',
        guestCount: 1,
        sessionTime: '11:00 PAGI',
        dietaryNotes: '',
        wishes: '',
      },
      'now'
    )
  );
});
