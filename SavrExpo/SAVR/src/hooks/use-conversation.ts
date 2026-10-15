import { useEffect, useRef, useState } from 'react';
import type { Conversation, GroceryList, Message } from '@/models/domain';
import { useSession } from '@/state/session';
import { readConversation, writeCache } from '@/storage/cache';
import { ApiError, errorMessage } from '@/services/api';
import { sendConversation } from '@/services/conversation';

const message = (role: Message['role'], text: string): Message => ({
  id: Date.now().toString(36) + Math.random().toString(36).slice(2),
  role,
  text,
  timestamp: new Date().toISOString(),
});
export function useConversation(list?: GroceryList) {
  const { service, session } = useSession();
  const userId = session?.userId ?? '';
  const cacheKey = list ? 'chat.list.' + list.id : 'chat.main';
  const initialSessionId = list?.sessionId;
  const [conversation, setConversation] = useState<Conversation>({
    messages: [],
  });
  const contextKey = userId + ':' + cacheKey + ':' + (initialSessionId ?? '');
  const [loadedKey, setLoadedKey] = useState('');
  const loading = loadedKey !== contextKey;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const current = useRef<Conversation>({ messages: [] });
  const pending = useRef(false);
  const generation = useRef(0);
  const commit = (value: Conversation) => {
    current.current = value;
    setConversation(value);
  };
  useEffect(() => {
    const version = ++generation.current;
    pending.current = true;
    (async () => {
      let restored: Conversation = {
        messages: [],
        sessionId: initialSessionId,
      };
      try {
        const cached = await readConversation(userId, cacheKey);
        if (cached) restored = cached;
        if (restored.sessionId) {
          try {
            const history = await service.history(restored.sessionId);
            if (history.length) restored = { ...restored, messages: history };
          } catch (e) {
            if (e instanceof ApiError && e.status === 404)
              restored = { ...restored, sessionId: undefined };
            else if (version === generation.current)
              setError(
                'Could not refresh conversation history. ' + errorMessage(e),
              );
          }
        }
        if (version === generation.current) {
          commit(restored);
          await writeCache(userId, cacheKey, restored);
        }
      } catch (e) {
        if (version === generation.current) {
          commit(restored);
          setError('Could not restore saved chat. ' + errorMessage(e));
        }
      } finally {
        if (version === generation.current) {
          pending.current = false;
          setLoadedKey(contextKey);
        }
      }
    })();
    return () => {
      generation.current = version + 1;
    };
  }, [cacheKey, contextKey, initialSessionId, service, userId]);

  const send = async (text: string): Promise<boolean> => {
    if (!text.trim() || pending.current) return false;
    const version = generation.current;
    const before = current.current;
    const optimistic = [...before.messages, message('user', text.trim())];
    pending.current = true;
    setBusy(true);
    setError('');
    commit({ ...before, messages: optimistic });
    try {
      const response = await sendConversation(
        service.sendMessage.bind(service),
        before,
        text.trim(),
        list,
      );
      if (version !== generation.current) return true;
      const next = {
        sessionId: response.sessionId,
        messages: [...optimistic, message('assistant', response.text)],
      };
      commit(next);
      try {
        await writeCache(userId, cacheKey, next);
      } catch {
        if (version === generation.current)
          setError(
            'Message sent, but could not save a local copy of this conversation.',
          );
      }
      return true;
    } catch (e) {
      if (version === generation.current) {
        commit(before);
        setError(errorMessage(e));
      }
      return false;
    } finally {
      if (version === generation.current) {
        pending.current = false;
        setBusy(false);
      }
    }
  };
  const reset = async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await writeCache(userId, cacheKey, { messages: [] });
      commit({ messages: [] });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return { conversation, loading, busy, error, send, reset };
}
