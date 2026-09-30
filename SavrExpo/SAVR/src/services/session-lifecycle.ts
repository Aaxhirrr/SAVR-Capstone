import type { Profile, Session } from '../models/domain.ts';
import { ApiError } from './api.ts';

export async function restoreAccount(
  read: () => Promise<Session | null>,
  fetchProfile: (session: Session) => Promise<Profile>,
  clear: () => Promise<void>,
): Promise<{
  session: Session | null;
  profile: Profile | null;
  notice: string;
}> {
  const session = await read();
  if (!session) return { session: null, profile: null, notice: '' };
  try {
    return { session, profile: await fetchProfile(session), notice: '' };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await clear();
      return { session: null, profile: null, notice: 'Please sign in again.' };
    }
    return {
      session,
      profile: null,
      notice:
        'Your account is saved, but SAVR could not connect. Try refreshing when you are online.',
    };
  }
}
