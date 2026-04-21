import { create } from 'zustand';
import { persist, PersistOptions, createJSONStorage } from 'zustand/middleware';
import { userScopedStateStorage, migrateKeyToUserScope } from '@/lib/userScopedStorage';
import { getCurrentUserId } from '@/lib/userScopedStorage';
import chatService, { ChatMessage, onboardingChatService } from '@/services/chatService';

// Helper to get user-scoped session ID from localStorage
export function getUserScopedSessionId(): string | null {
  try {
    const userId = getCurrentUserId();
    const key = userId ? `chatSessionId-${userId}` : 'chatSessionId-anonymous';
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// Helper to set user-scoped session ID in localStorage
export function setUserScopedSessionId(sessionId: string | null): void {
  try {
    const userId = getCurrentUserId();
    const key = userId ? `chatSessionId-${userId}` : 'chatSessionId-anonymous';
    if (sessionId) {
      localStorage.setItem(key, sessionId);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

interface ChatState {
  // Chat state
  currentSession: string | null;
  messages: ChatMessage[];
  streamingMessage: ChatMessage | null; // For in-progress streaming response
  groceryList: any; // Changed from GroceryItem[] | null to any to support both array and object formats
  isLoading: boolean;
  error: string | null;
  conversationState: string | null;
  hydrated: boolean; // Add a flag to track if the store has been hydrated from storage
  isInitializing: boolean; // Add flag to prevent multiple initializations
  // Tool lifecycle (active tool uses during streaming)
  toolActivities: Record<string, { name: string; label: string }>;
  // Generation state for UI
  isGenerating: boolean;
  // Last seen tool info to keep label stable between start/end and for fast tools
  lastToolLabel?: string;
  lastToolName?: string;
  currentToolDisplay?: string;
  // Prevent very fast tools from being invisible by enforcing a short dwell time
  labelLockedUntil?: number;
  labelTimer?: any;
  spinnerActive: boolean;
  spinnerLabel?: string;

  // Onboarding mode (anonymous, no auth)
  isOnboarding: boolean;

  // Actions
  sendMessage: (messageData: string | { text: string; imageBase64?: string | null; imageMediaType?: string | null; images?: { base64: string; mediaType: string }[] }) => Promise<void>;
  clearChat: () => void;
  loadSession: (sessionId: string) => Promise<void>;
  setHydrated: (hydrated: boolean) => void; // Add a function to set the hydrated flag
  setOnboarding: (onboarding: boolean) => void;
}

// Define the persistence configuration - Revert changes here
const persistConfig: PersistOptions<
  ChatState,
  Pick<ChatState, 'currentSession' | 'messages' | 'groceryList' | 'conversationState'>
> = {
  name: 'savr-chat-storage',
  // Scope persisted data per user using a storage wrapper
  storage: createJSONStorage(() => userScopedStateStorage),
  partialize: (state) => ({
    // Only persist these fields to localStorage
    currentSession: state.currentSession,
    messages: state.messages,
    groceryList: state.groceryList,
    conversationState: state.conversationState
  }),
  onRehydrateStorage: () => (state) => {
    if (state) {
      state.setHydrated(true);
    }
  },
  version: 1, // Optional version number for migrations
};

const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state - use user-scoped session ID
      currentSession: getUserScopedSessionId(),
      messages: [],
      streamingMessage: null, // Init streaming message
      groceryList: null,
      isLoading: false,
      error: null,
      conversationState: null,
      hydrated: false, // Initialize as not hydrated
      isInitializing: false, // Initialize as not initializing
      toolActivities: {},
      isGenerating: false,
      lastToolLabel: undefined,
      lastToolName: undefined,
      currentToolDisplay: undefined,
      labelLockedUntil: undefined,
      labelTimer: undefined,
      spinnerActive: false,
      spinnerLabel: undefined,
      isOnboarding: false,

      // Set hydrated state
      setHydrated: (hydrated: boolean) => set({ hydrated }),
      setOnboarding: (onboarding: boolean) => set({ isOnboarding: onboarding }),
      
      // Actions
      sendMessage: async (messageData) => {
        // Handle both string and object formats
        const message = typeof messageData === 'string' ? messageData : messageData.text;
        const imageBase64 = typeof messageData === 'string' ? undefined : messageData.imageBase64;
        const imageMediaType = typeof messageData === 'string' ? undefined : messageData.imageMediaType;
        const images = typeof messageData === 'string' ? undefined : messageData.images;
        
        // Don't send empty messages unless there's an image
        if (!message.trim() && !imageBase64) return;
        
        const { currentSession } = get();
        
        // Skip any error sessions from previous failed attempts
        const sessionId = currentSession && currentSession.startsWith('error-session-') 
          ? undefined 
          : currentSession;
          
        // Add user message to state immediately
        const userMessage: ChatMessage = {
          id: `user-${Date.now()}`,
          content: message,
          is_user: true,
          timestamp: new Date().toISOString(),
          imageBase64: imageBase64 || null,
          imageMediaType: imageMediaType || null,
          images: images || undefined,
        };
        
        set(state => ({
          messages: [...state.messages, userMessage],
          isLoading: true,
          error: null,
          streamingMessage: null, // Clear any previous streaming state
        }));
        
        try {
          // Listen for attachment events during this stream to preview screenshot
          const handleAttach = (ev: any) => {
            try {
              const payload = (ev && ev.detail) || {};
              const imgB64 = payload.imageBase64 || payload.image_base64;
              const imgType = payload.imageMediaType || payload.image_media_type;
              if (!imgB64 || !imgType) return;
              set(state => {
                const base = state.streamingMessage || {
                  id: 'assistant-streaming',
                  content: '',
                  is_user: false,
                  timestamp: new Date().toISOString(),
                } as ChatMessage;
                return {
                  streamingMessage: {
                    ...base,
                    imageBase64: imgB64,
                    imageMediaType: imgType,
                  }
                };
              });
            } catch {}
          };
          window.addEventListener('savr-attachment', handleAttach as EventListener);
          // All logic now happens within the streaming path.
          // The `sendMessageStream` service returns a promise that resolves
          // with the full, final response object when the stream is complete.
          const streamFn = get().isOnboarding
            ? onboardingChatService.sendMessageStream
            : chatService.sendMessageStream;
          const finalResponse = await streamFn({
            sessionId: sessionId || undefined,
            message,
            imageBase64,
            imageMediaType,
            images,
            context: {}
          }, (delta) => {
            // This callback updates the `streamingMessage` state for the UI
            set(state => {
              if (!state.streamingMessage) {
                return {
                  streamingMessage: {
                    id: 'assistant-streaming',
                    content: delta,
                    is_user: false,
                    timestamp: new Date().toISOString(),
                  },
                  isLoading: false, 
                };
              }
              return {
                streamingMessage: {
                  ...state.streamingMessage,
                  content: state.streamingMessage.content + delta,
                }
              };
            });
          });
          // Clean up attachment listener for this request
          try { window.removeEventListener('savr-attachment', handleAttach as EventListener); } catch {}

          // When the stream is finished, `finalResponse` contains the complete message.

          set(state => {
            // Create the final, permanent message object from the stream's result
            const finalMessage: ChatMessage = {
              id: `assistant-${Date.now()}`,
              content: finalResponse.botResponse,
              is_user: false,
              timestamp: new Date().toISOString(),
              imageBase64: finalResponse.attachment?.image_base64 || state.streamingMessage?.imageBase64,
              imageMediaType: finalResponse.attachment?.image_media_type || state.streamingMessage?.imageMediaType,
            };

            // Add the final message to the array and clear the temporary streaming state
            return {
              messages: [...state.messages, finalMessage],
              streamingMessage: null,
              isLoading: false,
              isGenerating: false,
              toolActivities: {},
              currentSession: finalResponse.sessionId || state.currentSession,
            };
          });

          // Update session ID if it's new
          if (!sessionId && finalResponse.sessionId) {
            if (get().isOnboarding) {
              localStorage.setItem('onboarding-session-id', finalResponse.sessionId);
            } else {
              setUserScopedSessionId(finalResponse.sessionId);
            }
          }
          
          // Refresh the current list from the backend
          try {
            const sess = (sessionId || finalResponse.sessionId);
            if (sess) {
              const listFetcher = get().isOnboarding
                ? onboardingChatService.getSessionList
                : chatService.getCurrentSessionList;
              const draft = await listFetcher(sess);
              set({ groceryList: {
                id: draft.list?.id || null,  // Include real list ID to avoid duplication on price check
                name: draft.list?.name || 'My Grocery List',
                items: draft.items
              } });
            }
          } catch (e) {
            console.warn('Failed to refresh current list after message:');
          }
        } catch (error: any) {
          const err = error as any;
          console.error('Error sending message in chat store:');
          let errorContent = "Sorry, I'm having trouble connecting. Please try again.";
          
          // Handle different types of errors
          if (err.message && (err.message.includes('timeout') || err.message.includes('timed out'))) {
            // If there was image data in the request, provide a more specific message
            if (imageBase64) {
              errorContent = "The image analysis is taking longer than expected. Please try again with a simpler image or just describe it in text.";
            } else {
              errorContent = "Sorry, the request took too long to complete. This might be due to high traffic. Please try again in a moment.";
            }
          } else if (err.response?.status === 401) {
            errorContent = "Your session has expired. You'll be redirected to the login page...";
            
            // Add a slight delay before the redirect to allow the user to see the message
            setTimeout(() => {
              // We don't actually need to redirect here as the api interceptor will handle it
              // This just ensures the error message is shown before the redirect
            }, 1500);
          } else if (err.response?.data?.botResponse) {
            // Use the error message from the backend if available
            errorContent = err.response.data.botResponse;
          } else if (imageBase64 && err.message) {
            // For image-related errors, customize the message
            errorContent = "There was a problem processing your image. It might be too large or in an unsupported format. Please try again.";
          }
          
          // Add error message to chat
          const errorMessage: ChatMessage = {
            id: `error-${Date.now()}`,
            content: errorContent,
            is_user: false,
            timestamp: new Date().toISOString()
          };
          
          set(state => ({
            messages: [...state.messages, errorMessage],
            isLoading: false,
              streamingMessage: null, // Ensure streaming is cleared on error
            error: 'Failed to get response. Please try again.'
          }));
        }
      },
      
      clearChat: () => {
        // Clear chat history, session, and grocery list
        setUserScopedSessionId(null);
        localStorage.removeItem('savr-chat-storage'); // Clear the persisted store data
        
        set({
          currentSession: null,
          messages: [],
            streamingMessage: null,
          groceryList: null,
          error: null,
          conversationState: null,
          isLoading: false,
          isInitializing: false
        });
        
      },
      
      loadSession: async (sessionId: string) => {
          set({ isLoading: true, error: null, streamingMessage: null });
        
        // Add a safety timeout to ensure loading state is cleared even if something fails
        const safetyTimeout = setTimeout(() => {
          set({ isLoading: false });
        }, 8000); // 8 seconds max loading time
        
        try {
          
          // Load chat history for the session
          const history = await chatService.getChatHistory(sessionId);
          
          // If no history was found, this might be an invalid session
          if (!history || history.length === 0) {
            console.warn("No chat history found for this session. It might be invalid.");
            // Just set empty state but don't show error
            set({
              currentSession: sessionId,
              messages: [],
              isLoading: false
            });
            clearTimeout(safetyTimeout);
            return;
          }
          
          // Set the history in the state
          set({
            currentSession: sessionId,
            messages: history,
            isLoading: false
          });
          
          // Update user-scoped session ID
          setUserScopedSessionId(sessionId);
          
          // Clear the safety timeout since we've completed successfully
          clearTimeout(safetyTimeout);
        } catch (error: any) {
          console.error('Error loading session:');
          
          set({
            isLoading: false,
            error: 'Failed to load chat history. Please try again.'
          });
          
          // Clear the safety timeout since we've handled the error
          clearTimeout(safetyTimeout);
        }
      }
    }),
    persistConfig
  )
);

// Initialize with welcome message if no messages exist
const initialize = async () => {
  // Get current state
  const { currentSession } = useChatStore.getState();

  // Attempt a one-time migration from legacy global key to user-scoped key
  try {
    migrateKeyToUserScope('savr-chat-storage');
  } catch {}
  
  // Check if the current session looks valid
  if (currentSession && (
    currentSession.startsWith('error-session-') || 
    !currentSession.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  )) {
    console.warn('Invalid session ID detected, resetting session');
    setUserScopedSessionId(null);
    useChatStore.setState({ currentSession: null });
  }
  
  // Don't automatically add welcome message here - let the ChatPage handle it
};

// Function to reset the store - can be called from any component
export const resetChatStore = () => {
  // Clear chat localStorage items
  setUserScopedSessionId(null);
  localStorage.removeItem('savr-chat-storage');
  
  // Reset store to initial state
  useChatStore.setState({
    currentSession: null,
    messages: [],
    streamingMessage: null,
    groceryList: null, 
    isLoading: false,
    error: null,
    conversationState: null,
    hydrated: true,
    isInitializing: false
  });
  
};

// Run initialization
initialize();

export default useChatStore; 

// --- Progress listeners and spinner label management (tool/generation events) ---
// Attach once in the browser to translate streaming events into UI-friendly labels.
if (typeof window !== 'undefined') {
  const w = window as any;
  if (!w.__savrProgressListeners__) {
    w.__savrProgressListeners__ = true;

    const mapToolNameToLabel = (name?: string, fallback?: string): string => {
      const n = (name || '').toLowerCase();
      switch (n) {
        case 'web_search':
          return 'Searching the web…';
        case 'webpage_viewer':
          return 'Analyzing page…';
        case 'init_grocery_list':
          return 'Starting a list…';
        case 'update_grocery_list':
          return 'Updating your list…';
        case 'analyze_user_data':
          return 'Checking your lists…';
        default:
          return fallback || 'Working…';
      }
    };

    // Past-tense post-hoc labels for already-finished tools
    const mapToolNameToPastLabel = (name?: string): string | undefined => {
      const n = (name || '').toLowerCase();
      switch (n) {
        case 'web_search':
          return 'Searched the web…';
        case 'webpage_viewer':
          return 'Analyzed page…';
        case 'init_grocery_list':
          return 'Started a list…';
        case 'update_grocery_list':
          return 'Updated your list…';
        case 'analyze_user_data':
          return 'Checked your lists…';
        default:
          return undefined;
      }
    };

    const setState = useChatStore.setState;
    const getState = useChatStore.getState;

    // Dwell helper: ensure label is visible for at least dwellMs
    const setSpinnerLabelWithDwell = (label: string, dwellMs = 700) => {
      const now = Date.now();
      const unlockAt = now + dwellMs;
      // Clear existing timer if any
      const prevTimer = getState().labelTimer;
      if (prevTimer) {
        try { clearTimeout(prevTimer as any); } catch {}
      }
      const timer = setTimeout(() => {
        // Timer only unlocks; it does not change label by itself
        setState({ labelLockedUntil: undefined, labelTimer: undefined });
      }, dwellMs);
      setState({
        spinnerActive: true,
        spinnerLabel: label,
        lastToolLabel: label,
        labelLockedUntil: unlockAt,
        labelTimer: timer,
      });
    };

    // Generation lifecycle (start/end)
    const onGen = (ev: any) => {
      const detail = (ev && ev.detail) || {};
      const status = detail.status;
      if (status === 'start') {
        // Start of thinking stream
        setSpinnerLabelWithDwell('Thinking…', 700);
        setState({ isGenerating: true });
      } else if (status === 'end') {
        // End of generation: clear spinner if no active tools remain and dwell passed
        const now = Date.now();
        const remaining = Math.max(0, (getState().labelLockedUntil || 0) - now);
        const clearFn = () => setState({
          spinnerActive: false,
          spinnerLabel: undefined,
          isGenerating: false,
          toolActivities: {},
          lastToolLabel: undefined,
          lastToolName: undefined,
          labelLockedUntil: undefined,
          labelTimer: undefined,
        });
        if (remaining > 0) {
          setTimeout(clearFn, remaining);
        } else {
          clearFn();
        }
      }
    };

    // Tool activity (start/end)
    const onTool = (ev: any) => {
      const detail = (ev && ev.detail) || {};
      const id: string | undefined = detail.id;
      const status: string | undefined = detail.status;
      const rawName: string | undefined = detail.name;
      const providedLabel: string | undefined = detail.label;
      const name = rawName || '';

      if (!id || !status) return;

      if (status === 'start') {
        const displayLabel = mapToolNameToLabel(name, providedLabel);
        setState((state) => {
          const nextActivities = { ...state.toolActivities, [id]: { name, label: displayLabel } };
          return {
            toolActivities: nextActivities,
            lastToolName: name,
            lastToolLabel: displayLabel,
          } as Partial<typeof state>;
        });
        setSpinnerLabelWithDwell(mapToolNameToLabel(name, providedLabel), 700);
      } else if (status === 'progress') {
        // Progress update: update label for this tool with minimum dwell
        const displayLabel = providedLabel || 'Working…';
        setState((state) => {
          const existing = state.toolActivities[id];
          if (existing) {
            const nextActivities = { ...state.toolActivities, [id]: { ...existing, label: displayLabel } };
            return {
              toolActivities: nextActivities,
              lastToolLabel: displayLabel,
            } as Partial<typeof state>;
          }
          return {};
        });
        setSpinnerLabelWithDwell(displayLabel, 400); // shorter dwell for progress updates
      } else if (status === 'end') {
        setState((state) => {
          const next = { ...state.toolActivities } as Record<string, { name: string; label: string }>;
          delete next[id];
          return { toolActivities: next } as Partial<typeof state>;
        });

        // Choose next label: if another tool active, use its label; else revert to Thinking…
        const now = Date.now();
        const remaining = Math.max(0, (getState().labelLockedUntil || 0) - now);
        const activities = Object.values(getState().toolActivities || {});
        const nextLabel = activities.length > 0 ? (activities[activities.length - 1].label || 'Working…') : 'Thinking…';

        const apply = () => {
          if (activities.length > 0) {
            // Keep active with the next tool's ongoing label
            setSpinnerLabelWithDwell(nextLabel, 700);
            return;
          }
          // No active tools. Show a brief past-tense label for the tool that just finished, then revert.
          const past = mapToolNameToPastLabel(name) || 'Done.';
          setSpinnerLabelWithDwell(past, 700);
          // After dwell, fall back to Thinking… if still generating; else clear.
          const dwellLeft = Math.max(0, (getState().labelLockedUntil || 0) - Date.now());
          const after = () => {
            if (getState().isGenerating) {
              setSpinnerLabelWithDwell('Thinking…', 700);
            } else {
              setState({ spinnerActive: false, spinnerLabel: undefined });
            }
          };
          if (dwellLeft > 0) setTimeout(after, dwellLeft); else after();
        };
        if (remaining > 0) {
          setTimeout(apply, remaining);
        } else {
          apply();
        }
      }
    };

    try { window.addEventListener('savr-gen', onGen as EventListener); } catch {}
    try { window.addEventListener('savr-tool', onTool as EventListener); } catch {}
  }
}