import {
  DOC_ID_PATTERN,
  normalizeRsvpPayload,
  type AttendanceStatus,
  type GuestSide,
  type RsvpFormInput,
} from './wedding';

export interface PublicWishDoc {
  id: string;
  fullName: string;
  side: GuestSide;
  status: AttendanceStatus;
  guestCount: number;
  sessionTime: string;
  wishes: string;
  feedbackRating: number;
  createdAt: unknown;
}

export interface PrivateRsvpDoc extends PublicWishDoc {
  phone: string;
  email: string;
  dietaryNotes: string;
  feedbackComment: string;
  checkedIn: boolean;
  organizerNotes: string;
  updatedAt: unknown;
}

export function generateFirestoreRsvpId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `rsvp-${Date.now()}-${rand}`;
}

export function buildFirestoreRsvpBatchPayloads<TTime>(
  id: string,
  input: RsvpFormInput,
  timestampValue: TTime
): { publicWishDoc: PublicWishDoc; privateRsvpDoc: PrivateRsvpDoc } {
  if (!DOC_ID_PATTERN.test(id) || id.length < 4 || id.length > 128) {
    throw new Error('ID rekod RSVP tidak sah.');
  }

  const normalized = normalizeRsvpPayload(input);

  const publicWishDoc: PublicWishDoc = {
    id,
    fullName: normalized.fullName,
    side: normalized.side,
    status: normalized.status,
    guestCount: normalized.guestCount,
    sessionTime: normalized.sessionTime,
    wishes: normalized.wishes,
    feedbackRating: normalized.feedbackRating,
    createdAt: timestampValue,
  };

  const privateRsvpDoc: PrivateRsvpDoc = {
    ...publicWishDoc,
    phone: normalized.phone,
    email: normalized.email,
    dietaryNotes: normalized.dietaryNotes,
    feedbackComment: normalized.feedbackComment,
    checkedIn: false,
    organizerNotes: '',
    updatedAt: timestampValue,
  };

  return { publicWishDoc, privateRsvpDoc };
}
