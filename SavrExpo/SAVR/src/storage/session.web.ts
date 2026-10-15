import type { Session } from '@/models/domain';
// Browser preview uses an in-memory session; bearer tokens never enter localStorage.
let session: Session | null = null;
export async function readSession() {
  return session;
}
export async function writeSession(value: Session) {
  session = value;
}
export async function clearSession() {
  session = null;
}
