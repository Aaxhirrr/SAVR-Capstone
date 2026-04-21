import { create } from 'zustand';
import authService from '@/services/authService';
import type { User } from '@/services/authService';
import { clearStoreCache } from '@/lib/storeCache';
import { resetChatStore } from '@/stores/chatStore';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: authService.isLoggedIn(),
  
  login: async (email: string, password: string) => {
    // Proactively clear any in-memory UI state from a prior session
    try { clearStoreCache(); } catch {}
    try { /* lazy import to avoid cycle */ (await import('@/stores/chatStore')).resetChatStore(); } catch {}

    set({ isLoading: true, error: null });
    try {
      await authService.login({ email: email, password });
      
      // Load user profile after successful login
      const user = await authService.getProfile();
      set({ user, isAuthenticated: true, isLoading: false });

      // Now that user_id is available, rehydrate chat store from the new user-scoped key
      try {
        const mod = await import('@/stores/chatStore');
        const useChatStore: any = (mod as any).default;
        if (useChatStore?.persist?.rehydrate) {
          await useChatStore.persist.rehydrate();
        }
      } catch {}
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Login failed', 
        isLoading: false,
        isAuthenticated: false 
      });
    }
  },
  
  signup: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Provide minimal required fields for SignupData
      await authService.signup({ email, password, first_name: ' ', last_name: ' ' });
      // Automatically login after signup
      await authService.login({ email: email, password });
      
      // Load user profile
      const user = await authService.getProfile();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Signup failed', 
        isLoading: false,
        isAuthenticated: false 
      });
    }
  },
  
  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
    resetChatStore();
    try { clearStoreCache(); } catch {}
  },
  
  loadUser: async () => {
    if (!authService.isLoggedIn()) {
      set({ user: null, isAuthenticated: false });
      return;
    }
    
    set({ isLoading: true });
    try {
      const user = await authService.getProfile();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load user'
      });
    }
  },
}));

export default useAuthStore; 