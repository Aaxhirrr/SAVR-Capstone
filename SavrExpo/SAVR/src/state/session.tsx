import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Profile, Session, Signup } from '@/models/domain';
import { ApiClient, ApiError, errorMessage } from '@/services/api';
import { SavrService } from '@/services/savr';
import { clearSession, readSession, writeSession } from '@/storage/session';
import { clearUserCache } from '@/storage/cache';
import { restoreAccount } from '@/services/session-lifecycle';

const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://savr.app/api';
const anonymous = new SavrService(new ApiClient(baseUrl));
type SessionContext = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  notice: string;
  service: SavrService;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (input: Signup) => Promise<void>;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<Profile>;
  setProfile: (profile: Profile) => void;
  dismissNotice: () => void;
};
const Context = createContext<SessionContext | null>(null);
export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const current = useRef<Session | null>(null);
  const invalidate = useCallback((token: string) => {
    if (current.current?.accessToken !== token) return;
    const previous = current.current;
    current.current = null;
    setSession(null);
    setProfile(null);
    setNotice('Your session has expired. Please sign in again.');
    void clearSession().catch(() =>
      setNotice(
        'Your session expired. Saved sign-in details could not be removed. Please sign in again.',
      ),
    );
    void clearUserCache(previous.userId).catch(() => {});
  }, []);
  const service = useMemo(
    () =>
      new SavrService(
        new ApiClient(
          baseUrl,
          session?.accessToken,
          // ApiClient stores this callback; it only invokes it after a network response.
          // eslint-disable-next-line react-hooks/refs
          () => {
            if (session) invalidate(session.accessToken);
          },
        ),
      ),
    [session, invalidate],
  );
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const restored = await restoreAccount(
          readSession,
          (saved) =>
            new SavrService(
              new ApiClient(baseUrl, saved.accessToken),
            ).profile(),
          clearSession,
        );
        if (active) {
          current.current = restored.session;
          setSession(restored.session);
          setProfile(restored.profile);
          setNotice(restored.notice);
        }
      } catch (error) {
        if (active) setNotice(errorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  const accept = async (next: Session) => {
    await writeSession(next);
    current.current = next;
    setSession(next);
    setProfile(null);
    setNotice('');
    try {
      const p = await new SavrService(
        new ApiClient(baseUrl, next.accessToken),
      ).profile();
      if (current.current?.accessToken === next.accessToken) setProfile(p);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401)
        invalidate(next.accessToken);
      else if (current.current?.accessToken === next.accessToken)
        setNotice('Signed in. Your profile could not be loaded yet.');
    }
  };
  const signOut = async () => {
    const previous = current.current;
    await clearSession();
    current.current = null;
    setSession(null);
    setProfile(null);
    setNotice('');
    if (previous) await clearUserCache(previous.userId).catch(() => {});
  };
  const reloadProfile = useCallback(async () => {
    const token = current.current?.accessToken;
    const p = await service.profile();
    if (current.current?.accessToken === token) setProfile(p);
    return p;
  }, [service]);
  return (
    <Context.Provider
      value={{
        session,
        profile,
        loading,
        notice,
        service,
        signIn: async (username, password) =>
          accept(await anonymous.login(username, password)),
        signUp: async (input) => accept(await anonymous.signup(input)),
        signOut,
        reloadProfile,
        setProfile: (next) => {
          if (session && current.current?.accessToken === session.accessToken)
            setProfile(next);
        },
        dismissNotice: () => setNotice(''),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error('SessionProvider is missing.');
  return value;
}
