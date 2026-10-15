import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Conversation } from '@/models/domain';
const prefix = (userId: string) => `savr.v1.${encodeURIComponent(userId)}.`;
const key = (userId: string, name: string) => prefix(userId) + name;
export async function readCache<T>(
  userId: string,
  name: string,
): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key(userId, name));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    await AsyncStorage.removeItem(key(userId, name));
    return null;
  }
}
export async function writeCache(userId: string, name: string, value: unknown) {
  await AsyncStorage.setItem(key(userId, name), JSON.stringify(value));
}
export async function removeCache(userId: string, name: string) {
  await AsyncStorage.removeItem(key(userId, name));
}
export async function clearUserCache(userId: string) {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) =>
    k.startsWith(prefix(userId)),
  );
  if (keys.length) await AsyncStorage.multiRemove(keys);
}
export async function readConversation(
  userId: string,
  name: string,
): Promise<Conversation | null> {
  const value = await readCache<Conversation>(userId, name);
  if (
    !value ||
    !Array.isArray(value.messages) ||
    (value.sessionId !== undefined && typeof value.sessionId !== 'string')
  )
    return null;
  if (
    !value.messages.every(
      (m) =>
        m &&
        typeof m.id === 'string' &&
        typeof m.text === 'string' &&
        typeof m.timestamp === 'string' &&
        ['user', 'assistant'].includes(m.role),
    )
  )
    return null;
  return value;
}
