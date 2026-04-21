// A storage wrapper that scopes persisted keys by the current user id.
// Falls back to an anonymous scope when no user is logged in.

type NullableString = string | null;

export function getCurrentUserId(): NullableString {
  try {
    return localStorage.getItem('user_id');
  } catch {
    return null;
  }
}

export function makeScopedKey(baseKey: string, userId: NullableString): string {
  const suffix = userId && userId.trim().length > 0 ? userId : 'anonymous';
  return `${baseKey}-${suffix}`;
}

// Synchronous StateStorage-compatible object for zustand persist
export const userScopedStateStorage = {
  getItem(name: string): string | null {
    const scopedKey = makeScopedKey(name, getCurrentUserId());
    try {
      return localStorage.getItem(scopedKey);
    } catch {
      return null;
    }
  },
  setItem(name: string, value: string): void {
    const scopedKey = makeScopedKey(name, getCurrentUserId());
    try {
      localStorage.setItem(scopedKey, value);
    } catch {
      // ignore quota or access errors
    }
  },
  removeItem(name: string): void {
    const scopedKey = makeScopedKey(name, getCurrentUserId());
    try {
      localStorage.removeItem(scopedKey);
    } catch {
      // ignore
    }
  },
};

// Utility helpers for migrations and maintenance
export function migrateKeyToUserScope(baseKey: string): void {
  try {
    const userId = getCurrentUserId();
    const oldValue = localStorage.getItem(baseKey);
    if (!oldValue) return;
    const scopedKey = makeScopedKey(baseKey, userId);
    if (localStorage.getItem(scopedKey)) return; // already migrated
    localStorage.setItem(scopedKey, oldValue);
    localStorage.removeItem(baseKey);
  } catch {
    // ignore
  }
}

export function clearUserScopedKey(baseKey: string): void {
  try {
    const scopedKey = makeScopedKey(baseKey, getCurrentUserId());
    localStorage.removeItem(scopedKey);
  } catch {
    // ignore
  }
}


