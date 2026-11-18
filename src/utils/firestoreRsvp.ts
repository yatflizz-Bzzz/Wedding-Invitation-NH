import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebaseAuth';
import {
  buildFirestoreRsvpBatchPayloads,
  generateFirestoreRsvpId,
  type PrivateRsvpDoc,
  type PublicWishDoc,
} from './firestorePayloads';
import {
  RSVP_LIMITS,
  type GuestSide,
  type RsvpFormInput,
  type RsvpRecord,
} from './wedding';

export { buildFirestoreRsvpBatchPayloads, generateFirestoreRsvpId };
export type { PrivateRsvpDoc, PublicWishDoc };

export const PUBLIC_WISHES_COLLECTION = 'public_wishes';
export const PRIVATE_RSVPS_COLLECTION = 'rsvp_submissions';

function toIsoTimestamp(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string' && value) {
    return value;
  }
  return new Date().toISOString();
}

function mapPublicDocToRsvpRecord(docId: string, data: Record<string, unknown>): RsvpRecord {
  return {
    id: typeof data.id === 'string' ? data.id : docId,
    fullName: typeof data.fullName === 'string' ? data.fullName : '',
    phone: '',
    email: '',
    side: (['bride', 'groom', 'friend', 'colleague'].includes(String(data.side))
      ? data.side
      : 'friend') as GuestSide,
    status: data.status === 'declining' ? 'declining' : 'attending',
    guestCount: typeof data.guestCount === 'number' ? data.guestCount : 0,
    sessionTime: typeof data.sessionTime === 'string' ? data.sessionTime : '',
    dietaryNotes: '',
    wishes: typeof data.wishes === 'string' ? data.wishes : '',
    feedbackRating: typeof data.feedbackRating === 'number' ? data.feedbackRating : 0,
    createdAt: toIsoTimestamp(data.createdAt),
  };
}

function mapPrivateDocToRsvpRecord(docId: string, data: Record<string, unknown>): RsvpRecord {
  return {
    ...mapPublicDocToRsvpRecord(docId, data),
    phone: typeof data.phone === 'string' ? data.phone : '',
    email: typeof data.email === 'string' ? data.email : '',
    dietaryNotes: typeof data.dietaryNotes === 'string' ? data.dietaryNotes : '',
    feedbackComment: typeof data.feedbackComment === 'string' ? data.feedbackComment : '',
    checkedIn: Boolean(data.checkedIn),
    organizerNotes: typeof data.organizerNotes === 'string' ? data.organizerNotes : '',
    updatedAt: toIsoTimestamp(data.updatedAt),
  };
}

export async function submitRsvpToFirestore(input: RsvpFormInput): Promise<RsvpRecord> {
  const id = generateFirestoreRsvpId();
  const { publicWishDoc, privateRsvpDoc } = buildFirestoreRsvpBatchPayloads(
    id,
    input,
    serverTimestamp()
  );

  const batch = writeBatch(db);
  batch.set(doc(db, PUBLIC_WISHES_COLLECTION, id), publicWishDoc);
  batch.set(doc(db, PRIVATE_RSVPS_COLLECTION, id), privateRsvpDoc);

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${PRIVATE_RSVPS_COLLECTION}/${id}`);
  }

  const nowIso = new Date().toISOString();
  return {
    ...privateRsvpDoc,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function subscribePublicWishes(
  onData: (records: RsvpRecord[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  const q = query(
    collection(db, PUBLIC_WISHES_COLLECTION),
    where('status', 'in', ['attending', 'declining']),
    limit(500)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const records = snapshot.docs
        .map((snap) =>
          export function subscribePrivateRsvps(
  onData: (records: RsvpRecord[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  const q = query(
    collection(db, PRIVATE_RSVPS_COLLECTION),
    limit(500)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const records = snapshot.docs
        .map((snap) =>
          mapPrivateDocToRsvpRecord(snap.id, snap.data() as Record<string, unknown>)
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(records);
    },
    (error) => {
      onError?.('Akses ke rekod penuh tetamu ditolak atau sesi pengesahan tamat.');
      handleFirestoreError(error, OperationType.LIST, PRIVATE_RSVPS_COLLECTION);
    }
  );
}

  return onSnapshot(
    q,
    (snapshot) => {
      const records = snapshot.docs.map((snap) =>
        mapPrivateDocToRsvpRecord(snap.id, snap.data() as Record<string, unknown>)
      );
      onData(records);
    },
    (error) => {
      onError?.('Akses ke rekod penuh tetamu ditolak atau sesi pengesahan tamat.');
      handleFirestoreError(error, OperationType.LIST, PRIVATE_RSVPS_COLLECTION);
    }
  );
}

export async function updateOrganizerRsvpTracking(
  id: string,
  updates: { checkedIn: boolean; organizerNotes: string }
): Promise<void> {
  const safeNotes = updates.organizerNotes.trim().slice(0, RSVP_LIMITS.organizerNotesMax);
  try {
    await updateDoc(doc(db, PRIVATE_RSVPS_COLLECTION, id), {
      checkedIn: Boolean(updates.checkedIn),
      organizerNotes: safeNotes,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PRIVATE_RSVPS_COLLECTION}/${id}`);
  }
}

export async function deleteRsvpSubmission(id: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, PRIVATE_RSVPS_COLLECTION, id));
  batch.delete(doc(db, PUBLIC_WISHES_COLLECTION, id));
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PRIVATE_RSVPS_COLLECTION}/${id}`);
  }
}
