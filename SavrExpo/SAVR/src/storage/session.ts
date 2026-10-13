import * as SecureStore from 'expo-secure-store';
import type { Session } from '@/models/domain';
const key = 'savr.session.v1';
let writes = Promise.resolve();
function enqueue(write: () => Promise<void>) {
  const next = writes.then(write);
  writes = next.catch(() => {});
  return next;
}
export async function readSession(): Promise<Session | null> {
  await writes;
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (
      typeof value.accessToken === 'string' &&
      value.accessToken &&
      typeof value.userId === 'string' &&
      value.userId
    )
      return value;
  } catch {
    /* Discard an invalid saved session. */
  }
  await clearSession();
  return null;
}
export async function writeSession(session: Session) {
  await enqueue(() => SecureStore.setItemAsync(key, JSON.stringify(session)));
}
export async function clearSession() {
  await enqueue(() => SecureStore.deleteItemAsync(key));
}
