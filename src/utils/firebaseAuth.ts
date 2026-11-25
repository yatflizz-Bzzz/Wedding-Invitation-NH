import { createClient } from '@libsql/client/web';
import { ORGANIZER_EMAIL } from './wedding';

export type Unsubscribe = () => void;

export interface User {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName?: string | null;
  photoURL?: string | null;
  isAnonymous?: boolean;
  tenantId?: string | null;
  providerData?: {
    providerId?: string | null;
    email?: string | null;
  }[];
}

const SESSION_STORAGE_KEY = 'wedding_organizer_session_v1';
const DEFAULT_ADMIN_PIN = 'admin2026';

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (parsed && parsed.email) return parsed;
    return null;
  } catch {
    return null;
  }
}

let currentUser: User | null = loadStoredUser();
const authListeners = new Set<(user: User | null, authReady: boolean) => void>();

function notifyAuthListeners(): void {
  authListeners.forEach((listener) => {
    try {
      listener(currentUser, true);
    } catch {
      // Abaikan ralat listener individu
    }
  });
}

export const auth = {
  get currentUser(): User | null {
    return currentUser;
  },
  async signOut(): Promise<void> {
    await logout();
  },
};

export const db = null;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? false,
      isAnonymous: false,
      tenantId: null,
      providerInfo: currentUser?.providerData || [],
    },
    operationType,
    path,
  };
  console.error('Database Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let connectionTested = false;
export async function testFirestoreConnection(): Promise<void> {
  if (connectionTested) return;
  connectionTested = true;

  const tursoUrl = (import.meta.env.VITE_TURSO_DATABASE_URL || '').trim();
  const tursoToken = (import.meta.env.VITE_TURSO_AUTH_TOKEN || '').trim();
  if (!tursoUrl) return;

  try {
    const client = createClient({ url: tursoUrl, authToken: tursoToken });
    await client.execute('SELECT 1;');
  } catch (error) {
    console.error('Sila semak tetapan VITE_TURSO_DATABASE_URL dan VITE_TURSO_AUTH_TOKEN.', error);
  }
}

export function isVerifiedOrganizerUser(user: User | null): boolean {
  return Boolean(
    user &&
      user.email?.toLowerCase() === ORGANIZER_EMAIL.toLowerCase() &&
      user.emailVerified === true
  );
}

export function initOrganizerAuth(
  onAuthChange: (user: User | null, authReady: boolean) => void
): Unsubscribe {
  onAuthChange(currentUser, true);
  authListeners.add(onAuthChange);

  return () => {
    authListeners.delete(onAuthChange);
  };
}

export async function signInWithGoogle(): Promise<User> {
  const expectedPin = (import.meta.env.VITE_ADMIN_PIN || DEFAULT_ADMIN_PIN).trim();
  const entered = window.prompt('Masukkan PIN Admin Penganjur:');

  if (entered === null) {
    throw new Error('Log masuk dibatalkan.');
  }

  if (entered.trim() !== expectedPin) {
    window.alert('PIN Admin tidak sah.');
    throw new Error('PIN Admin tidak sah.');
  }

  const verifiedOrganizer: User = {
    uid: 'organizer-admin',
    email: ORGANIZER_EMAIL,
    emailVerified: true,
    displayName: 'Admin Penganjur',
    isAnonymous: false,
    tenantId: null,
    providerData: [{ providerId: 'admin-pin', email: ORGANIZER_EMAIL }],
  };

  currentUser = verifiedOrganizer;
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(verifiedOrganizer));
  } catch {
    // Abaikan jika localStorage disekat
  }

  notifyAuthListeners();
  return verifiedOrganizer;
}

export async function logout(): Promise<void> {
  currentUser = null;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);} catch {
    // Abaikan ralat storan
  }
  notifyAuthListeners();
}
