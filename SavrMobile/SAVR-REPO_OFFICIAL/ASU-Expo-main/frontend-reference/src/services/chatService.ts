import api from './api';
import {
  fetchEventSource,
  EventSourceMessage,
} from "@microsoft/fetch-event-source";

export interface ChatMessage {
  id: string;
  content: string;
  is_user: boolean;
  timestamp: string;
  imageBase64?: string | null;
  imageMediaType?: string | null;
  images?: { base64: string; mediaType: string }[];
}

export interface ChatSession {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatImageData {
  base64: string;
  mediaType: string;
}

export interface ChatRequest {
  sessionId?: string;
  message: string;
  imageBase64?: string | null;
  imageMediaType?: string | null;
  images?: ChatImageData[];
  context?: Record<string, any>;
}

export interface ChatResponse {
  sessionId: string;
  botResponse: string;
  chat_response?: string;
  conversationState?: string;
  conversationHistory: ChatMessage[];
  groceryList?: GroceryItem[] | GroceryList;
  attachment?: {
    image_base64?: string;
    image_media_type?: string;
  };
}

export interface GroceryItem {
  id?: string;
  name: string;
  category: string;
  meal?: string;
  quantity: string;
  unit: string;
  checked?: boolean;
}

// Define interface for the grocery list that might be returned by the backend
export interface GroceryList {
  name: string;
  items: GroceryItem[];
}

export interface SessionDraftListResponse {
  list: { id: string; name: string; isDraft: boolean } | null;
  items: GroceryItem[];
  itemsCount: number;
}

export interface FinalizeDraftResponse {
  listId: string;
}

// Add interface for welcome message response
export interface WelcomeMessageResponse {
  content: string;
  timestamp: string;
  session_id: string;
}

// Mock data for development
const mockSessions: ChatSession[] = [
  {
    id: "session-1",
    user_id: "mock-user-id",
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 86400000).toISOString()
  }
];

const mockMessages: Record<string, ChatMessage[]> = {
  "session-1": [
    {
      id: "msg-1",
      content: "Hello, I need help with my grocery shopping.",
      is_user: true,
      timestamp: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: "msg-2",
      content: "Hi! I'm here to help with your grocery shopping needs. What would you like assistance with today?",
      is_user: false,
      timestamp: new Date(Date.now() - 86399000).toISOString() // 1 second later
    }
  ]
};

const chatService = {
  /**
   * Send a message to the chat assistant
   */
  sendMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    // Log the request but without the image data to avoid console bloat
    const logData = {
      sessionId: data.sessionId,
      message: data.message,
      hasImage: !!data.imageBase64,
      imageType: data.imageMediaType,
      imageSizeKB: data.imageBase64 ? Math.round((data.imageBase64.length * 3/4) / 1024) : 0
    };
    
    console.log("ChatService sendMessage called with:", logData);
    
    try {
      console.log("Connecting to backend API at /chat/message");
      
      // Remove sessionId if it's an error session
      if (data.sessionId && data.sessionId.startsWith('error-session-')) {
        console.log("Removing error session ID:", data.sessionId);
        data.sessionId = undefined;
      }
      
      // Increase timeout for requests with images
      const timeout = data.imageBase64 ? 120000 : 45000; // 120 seconds for image requests, 45 seconds for text-only
      
      // Prefer streaming automatically for requests; works with or without images
      try {
        console.log('Attempting streaming path from sendMessage');
        return await chatService.sendMessageStream(data, () => {});
      } catch (e) {
        console.warn('Streaming fallback to non-stream request due to error:', e);
      }

      // Make the non-streaming API call (fallback)
      const response = await api.post<ChatResponse>('/chat/message', data, { timeout });
      
      console.log("API response successful:", {
        sessionId: response.data.sessionId,
        hasBotResponse: !!response.data.botResponse,
        hasGroceryList: !!(response.data.groceryList && !Array.isArray(response.data.groceryList) && (response.data.groceryList as GroceryList).items),
        groceryItemCount: (response.data.groceryList && !Array.isArray(response.data.groceryList)) ? (response.data.groceryList as GroceryList).items?.length || 0 : 0,
      });
      
      // Handle the new response format, ensuring backward compatibility
      // If we have chat_response from the Claude JSON but not botResponse, use it
      if (response.data.chat_response && !response.data.botResponse) {
        response.data.botResponse = response.data.chat_response;
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error in chatService.sendMessage:', error);
      console.log('API error response:', error.response?.data || 'No response data');
      console.log('API error status:', error.response?.status || 'No status');
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        console.error("Authentication error: JWT token expired");
        
        // Clear auth data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user');
        
        // Redirect to login page if not already there
        if (window.location.pathname !== '/login') {
          console.log("Redirecting to login page due to expired token");
          window.location.href = '/login';
        }
        
        return {
          sessionId: data.sessionId || `error-session-${Date.now()}`,
          botResponse: "Your session has expired. Please log in again.",
          conversationHistory: []
        };
      }
      
      // Return generic error message
      return {
        sessionId: data.sessionId || `error-session-${Date.now()}`,
        botResponse: "Something went wrong. Please try again later.",
        conversationHistory: []
      };
    }
  },

  /** Stream a message using SSE (text-only). Returns full text when finished and yields deltas via callbacks. */
  sendMessageStream: async (
    data: ChatRequest,
    onDelta: (delta: string) => void,
  ): Promise<ChatResponse> => {
    console.log("ChatService sendMessageStream called", { hasImage: !!data.imageBase64, sessionId: data.sessionId });
    const token = localStorage.getItem('token');
    // Get baseURL from api instance - it already handles dev/prod correctly
    const baseURL = (api as any).defaults?.baseURL as string || '';
    const url = `${baseURL}/chat/stream`;

    return new Promise<ChatResponse>((resolve, reject) => {
      let fullText = "";
      let finalSessionId = data.sessionId;
      let finalAttachment: ChatResponse['attachment'] | undefined;

      const ctrl = new AbortController();

      fetchEventSource(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
        signal: ctrl.signal,
        
        onopen: async (response) => {
          console.log('Stream connection opened', { status: response.status });
          if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
            // All good
          } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            // Client-side error
            const errBody = await response.json();
            console.error('Fatal stream error (client)', errBody);
            reject(new Error(errBody.detail || 'client_error'));
            ctrl.abort();
          } else {
            // Server-side error
            console.error('Fatal stream error (server)');
            reject(new Error('server_error'));
            ctrl.abort();
          }
        },

        onmessage: (msg: EventSourceMessage) => {
          if (msg.event === 'error') {
            console.error('Stream error event received', msg.data);
            reject(new Error(msg.data || 'stream_error_event'));
            ctrl.abort();
            return;
          }
          
          if (!msg.data) {
            // Keep-alive ping, ignore
            return;
          }

          try {
            const payload = JSON.parse(msg.data);
            
            switch (msg.event) {
              case 'ready':
                console.log('Stream ready for session', payload.sessionId);
                finalSessionId = payload.sessionId;
                try {
                  const genEvt = new CustomEvent('savr-gen', { detail: { status: 'start', sessionId: payload.sessionId } });
                  window.dispatchEvent(genEvt);
                } catch {}
                break;

              case 'delta':
                if (payload.text) {
                  onDelta(payload.text);
                  fullText += payload.text;
                }
                break;
              
              case 'tool':
                try {
                  console.log('SSE tool event', payload);
                  const normalizeName = (n: string | undefined) => {
                    if (!n) return n;
                    if (n.startsWith('web_search')) return 'web_search';
                    return n;
                  };
                  const detail = { ...payload, name: normalizeName(payload.name) };
                  const toolEvt = new CustomEvent('savr-tool', { detail });
                  window.dispatchEvent(toolEvt);
                } catch {}
                break;
                
              case 'attachment':
                try {
                    console.log('SSE attachment event', payload);
                    finalAttachment = {
                        image_base64: payload.image_base64 || payload.imageBase64,
                        image_media_type: payload.image_media_type || payload.imageMediaType,
                    };
                    const attachEvt = new CustomEvent('savr-attachment', { detail: payload });
                    window.dispatchEvent(attachEvt);
                } catch {}
                break;

              case 'final':
                fullText = payload.text || fullText;
                console.log('Stream received final event');
                // The stream will close automatically after this, and `onclose` will resolve
                break;
            }
          } catch (e) {
            console.warn('Failed to parse SSE data chunk, ignoring.', { data: msg.data, error: e });
          }
        },

        onclose: () => {
          console.log('Stream connection closed.');
          try {
            const genEvtEnd = new CustomEvent('savr-gen', { detail: { status: 'end', sessionId: finalSessionId } });
            window.dispatchEvent(genEvtEnd);
          } catch {}

          if (fullText) {
            resolve({
              sessionId: finalSessionId || data.sessionId || `session-${Date.now()}`,
              botResponse: fullText,
              conversationHistory: [],
              attachment: finalAttachment,
            });
          } else {
            reject(new Error('Stream ended without producing any content.'));
          }
        },

        onerror: (err) => {
          console.error('Stream transport error', err);
          reject(err);
          // The library will automatically retry, but we throw to reject the promise
          throw err;
        },
      });
    });
  },

  /** Fetch the current session's draft list (authoritative list for Chat UI) */
  getSessionDraftList: async (sessionId: string): Promise<SessionDraftListResponse> => {
    if (!sessionId) {
      return { list: null, items: [], itemsCount: 0 };
    }
    const response = await api.get<SessionDraftListResponse>(`/chat/session/${sessionId}/list`, {
      timeout: 8000,
    });
    return response.data;
  },

  /** Preferred: Fetch the current session's list (draftless semantics) */
  getCurrentSessionList: async (sessionId: string): Promise<SessionDraftListResponse> => {
    if (!sessionId) {
      return { list: null, items: [], itemsCount: 0 };
    }
    const response = await api.get<SessionDraftListResponse>(`/chat/session/${sessionId}/list`, {
      timeout: 8000,
    });
    return response.data;
  },

  /** Finalize the current session's draft list and return the finalized list ID */
  finalizeDraftList: async (sessionId: string): Promise<FinalizeDraftResponse> => {
    if (!sessionId) throw new Error('Missing sessionId');
    const response = await api.post<FinalizeDraftResponse>(`/chat/session/${sessionId}/finalize`, {}, { timeout: 15000 });
    return response.data;
  },

  /** Hard delete the current session's draft list (used by New List) */
  deleteSessionDraftList: async (sessionId: string): Promise<void> => {
    if (!sessionId) return;
    await api.delete(`/chat/session/${sessionId}/draft`, { timeout: 8000 });
  },

  /** Preferred: Detach the current session's list (preserve list; clear from chat) */
  clearCurrentSessionList: async (sessionId: string): Promise<void> => {
    if (!sessionId) return;
    // Use new endpoint; fall back to legacy if needed
    try {
      await api.delete(`/chat/session/${sessionId}/current_list`, { timeout: 8000 });
    } catch (e) {
      await api.delete(`/chat/session/${sessionId}/draft`, { timeout: 8000 });
    }
  },

  /**
   * Get chat history for a session
   */
  getChatHistory: async (sessionId: string): Promise<ChatMessage[]> => {
    // Don't attempt to load history for auto-generated session IDs that haven't been saved yet
    if (!sessionId || sessionId.startsWith('new-session-') || sessionId.startsWith('error-session-')) {
      console.log('Skipping history load for new/invalid session');
      return [];
    }
    
    try {
      console.log(`Fetching chat history for session: ${sessionId}`);
      const response = await api.get<ChatMessage[]>(`/chat/history/${sessionId}`, {
        timeout: 5000 // Set a reasonable timeout of 5 seconds
      });
      console.log(`Successfully retrieved ${response.data.length} messages from history`);
      return response.data;
    } catch (error: any) {
      // Log detailed error information
      if (error.response) {
        console.error(`Error getting chat history (${error.response.status}):`, error.response.data);
      } else if (error.request) {
        console.error('Error getting chat history: No response received');
      } else {
        console.error('Error getting chat history:', error.message);
      }
      
      // Check for specific errors
      if (error.response?.status === 401) {
        console.error("Authentication error: JWT token expired");
        
        // Clear auth data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user');
        
        // Redirect to login page if not already there
        if (window.location.pathname !== '/login') {
          console.log("Redirecting to login page due to expired token");
          window.location.href = '/login';
        }
      }
      
      // For development, return mock data if API fails
      if (process.env.NODE_ENV === 'development' && mockMessages[sessionId]) {
        console.log('Using mock data for development');
        return mockMessages[sessionId];
      }
      
      // Return empty array for production
      return [];
    }
  },

  /**
   * Get all chat sessions for a user
   */
  getChatSessions: async (): Promise<ChatSession[]> => {
    try {
      const response = await api.get<ChatSession[]>('/chat/sessions');
      return response.data;
    } catch (error) {
      console.log('Error getting chat sessions:', error);
      
      // For development, return mock data if API fails
      return mockSessions;
    }
  },

  /**
   * Get personalized welcome message from the LLM
   */
  getWelcomeMessage: async (): Promise<WelcomeMessageResponse> => {
    try {
      console.log('Fetching personalized welcome message from backend');
      const response = await api.post<WelcomeMessageResponse>('/chat/welcome', {}, {
        timeout: 10000 // 10 second timeout for welcome message
      });
      
      console.log('Successfully received personalized welcome message with session:', response.data.session_id);
      return response.data;
    } catch (error) {
      console.error('Error fetching welcome message:', error);
      
      // Return a fallback welcome message with a dummy session ID
      return {
        content: "Hi, I'm Savr! You can tell me what meals you're shopping for, or just give me your shopping list.",
        timestamp: new Date().toISOString(),
        session_id: 'error-session-' + Date.now()
      };
    }
  },
};

// ---- Onboarding (anonymous) chat methods ----

export const onboardingChatService = {
  /** Get a welcome message for the onboarding chat (no auth) */
  getWelcomeMessage: async (): Promise<WelcomeMessageResponse> => {
    try {
      const response = await api.post<WelcomeMessageResponse>(
        '/chat/onboarding/welcome',
        {},
        { timeout: 10000 },
      );
      return response.data;
    } catch (error) {
      console.error('Onboarding welcome error:', error);
      return {
        content:
          "Hey there! I'm Savr, your grocery shopping sidekick. Tell me what you're cooking this week and I'll build your list!",
        timestamp: new Date().toISOString(),
        session_id: 'error-onboarding-' + Date.now(),
      };
    }
  },

  /** Stream a message in onboarding mode (no auth token needed for this endpoint) */
  sendMessageStream: async (
    data: ChatRequest,
    onDelta: (delta: string) => void,
  ): Promise<ChatResponse> => {
    const baseURL = (api as any).defaults?.baseURL as string || '';
    const url = `${baseURL}/chat/onboarding/stream`;

    return new Promise<ChatResponse>((resolve, reject) => {
      let fullText = '';
      let finalSessionId = data.sessionId;
      let finalAttachment: ChatResponse['attachment'] | undefined;

      const ctrl = new AbortController();

      fetchEventSource(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(data),
        signal: ctrl.signal,

        onopen: async (response) => {
          if (
            !response.ok ||
            !response.headers.get('content-type')?.includes('text/event-stream')
          ) {
            reject(new Error('onboarding_stream_open_failed'));
            ctrl.abort();
          }
        },

        onmessage: (msg: EventSourceMessage) => {
          if (msg.event === 'error') {
            reject(new Error(msg.data || 'onboarding_stream_error'));
            ctrl.abort();
            return;
          }
          if (!msg.data) return;

          try {
            const payload = JSON.parse(msg.data);
            switch (msg.event) {
              case 'ready':
                finalSessionId = payload.sessionId;
                break;
              case 'delta':
                if (payload.text) {
                  onDelta(payload.text);
                  fullText += payload.text;
                }
                break;
              case 'tool':
                try {
                  window.dispatchEvent(
                    new CustomEvent('savr-tool', { detail: payload }),
                  );
                } catch {}
                break;
              case 'final':
                fullText = payload.text || fullText;
                break;
            }
          } catch {}
        },

        onclose: () => {
          if (fullText) {
            resolve({
              sessionId:
                finalSessionId || data.sessionId || `session-${Date.now()}`,
              botResponse: fullText,
              conversationHistory: [],
              attachment: finalAttachment,
            });
          } else {
            reject(new Error('Onboarding stream ended without content.'));
          }
        },

        onerror: (err) => {
          reject(err);
          throw err;
        },
      });
    });
  },

  /** Fetch the grocery list for an onboarding session (no auth) */
  getSessionList: async (sessionId: string): Promise<SessionDraftListResponse> => {
    if (!sessionId) return { list: null, items: [], itemsCount: 0 };
    const response = await api.get<SessionDraftListResponse>(
      `/chat/onboarding/session/${sessionId}/list`,
      { timeout: 8000 },
    );
    return response.data;
  },

  /** Claim an anonymous onboarding session after signup */
  claimSession: async (anonymousSessionId: string): Promise<{ session_id: string; lists_transferred: number }> => {
    const response = await api.post('/chat/onboarding/claim', {
      anonymous_session_id: anonymousSessionId,
    });
    return response.data;
  },
};

export default chatService;