import { useCallback, useEffect, useRef } from 'react';
import useListStore from '@/stores/listStore';
import useChatStore, { setUserScopedSessionId } from '@/stores/chatStore';
import chatService from '@/services/chatService';
import { apiClient } from '@/services/api';
import { SavedGroceryList } from '@/services/groceryListService';

interface ChatHistoryResponse {
  messages: Array<{
    id: string;
    content: string;
    is_user: boolean;
    timestamp: string;
    imageBase64?: string | null;
    imageMediaType?: string | null;
  }>;
  session_id: string | null;
}

/**
 * Hook to synchronize list selection with chat history
 * When a list is selected, loads the associated chat history
 * @param skip - If true, disables all side effects (used in onboarding mode)
 */
export function useListChatSync(skip = false) {
  const { selectedListId, lists, setDrawerState, fetchListPriceData } = useListStore();
  const { loadSession, clearChat } = useChatStore();
  const isLoadingRef = useRef(false);
  const lastLoadedListIdRef = useRef<string | null>(null);

  // Get the selected list object
  const selectedList = selectedListId
    ? lists.find(l => l.id === selectedListId) || null
    : null;

  // Fetch chat history for a grocery list
  const fetchChatHistoryForList = useCallback(async (listId: string): Promise<ChatHistoryResponse | null> => {
    try {
      const response = await apiClient.get<ChatHistoryResponse>(`/grocery-lists/${listId}/chat-history`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching chat history for list ${listId}:`, error);
      return null;
    }
  }, []);

  // Create a new chat session and link it to the list
  const createSessionForList = useCallback(async (listId: string): Promise<string | null> => {
    try {
      // Get a welcome message which creates a new session
      const welcomeResponse = await chatService.getWelcomeMessage();

      if (welcomeResponse.session_id && !welcomeResponse.session_id.startsWith('error-')) {
        // Link the new session to the list via backend
        try {
          await apiClient.put(`/grocery-lists/${listId}`, {
            chat_session_id: welcomeResponse.session_id
          });
        } catch (linkError) {
          console.warn('Could not link session to list:', linkError);
        }

        return welcomeResponse.session_id;
      }
      return null;
    } catch (error) {
      console.error('Error creating session for list:', error);
      return null;
    }
  }, []);

  // Load chat for selected list
  const loadChatForList = useCallback(async (list: SavedGroceryList) => {
    console.log('[useListChatSync] loadChatForList called for list:', list.id, 'name:', list.name);
    console.log('[useListChatSync] isLoadingRef:', isLoadingRef.current, 'lastLoadedListIdRef:', lastLoadedListIdRef.current);

    if (isLoadingRef.current) {
      console.log('[useListChatSync] Already loading, skipping');
      return;
    }
    if (lastLoadedListIdRef.current === list.id) {
      console.log('[useListChatSync] Already loaded this list, skipping');
      return;
    }

    isLoadingRef.current = true;
    lastLoadedListIdRef.current = list.id;

    try {
      // First try to get chat history for this list
      console.log('[useListChatSync] Fetching chat history for list:', list.id);
      const chatHistory = await fetchChatHistoryForList(list.id);
      console.log('[useListChatSync] Chat history response:', chatHistory);

      if (chatHistory && chatHistory.session_id) {
        // List has an associated chat session - load it
        console.log('[useListChatSync] Loading session:', chatHistory.session_id, 'with', chatHistory.messages.length, 'messages');
        setUserScopedSessionId(chatHistory.session_id);
        useChatStore.setState({
          currentSession: chatHistory.session_id,
          messages: chatHistory.messages.map(m => ({
            id: m.id,
            content: m.content,
            is_user: m.is_user,
            timestamp: m.timestamp,
            imageBase64: m.imageBase64 || null,
            imageMediaType: m.imageMediaType || null,
          })),
          isLoading: false,
          groceryList: null, // Clear stale grocery list to prevent overwriting fresh data from fetchLists
        });
        console.log('[useListChatSync] Chat loaded successfully');
      } else if (chatHistory && !chatHistory.session_id) {
        // List exists but no chat session - create one
        console.log('[useListChatSync] No session_id in response, creating new session for list');
        const newSessionId = await createSessionForList(list.id);
        if (newSessionId) {
          setUserScopedSessionId(newSessionId);
          await loadSession(newSessionId);
        } else {
          // Fallback to showing empty chat
          console.log('[useListChatSync] Failed to create session, clearing chat');
          clearChat();
        }
      } else {
        // Could not fetch chat history - try loading from the list's chat_session_id if available
        // This is a fallback for when the endpoint isn't available yet
        console.log('[useListChatSync] Chat history fetch returned null, trying fallback');
        const listWithSession = list as SavedGroceryList & { chat_session_id?: string };
        if (listWithSession.chat_session_id) {
          console.log('[useListChatSync] Using list.chat_session_id:', listWithSession.chat_session_id);
          setUserScopedSessionId(listWithSession.chat_session_id);
          await loadSession(listWithSession.chat_session_id);
        } else {
          // No session - start fresh
          console.log('[useListChatSync] No session found, clearing chat');
          clearChat();
        }
      }
    } catch (error) {
      console.error('[useListChatSync] Error loading chat for list:', error);
      // Don't clear chat on error - might just be a network issue
    } finally {
      isLoadingRef.current = false;
    }
  }, [fetchChatHistoryForList, createSessionForList, loadSession, clearChat]);

  // Start a new chat (unlinked to any list)
  const startNewChat = useCallback(async () => {
    // Clear list selection
    useListStore.getState().selectList(null);
    setDrawerState('collapsed');

    // Clear chat and get fresh session
    try {
      clearChat();
      const welcomeResponse = await chatService.getWelcomeMessage();

      if (welcomeResponse.session_id && !welcomeResponse.session_id.startsWith('error-')) {
        setUserScopedSessionId(welcomeResponse.session_id);
        useChatStore.setState({ currentSession: welcomeResponse.session_id });
        await loadSession(welcomeResponse.session_id);
      }
    } catch (error) {
      console.error('Error starting new chat:', error);
    }

    lastLoadedListIdRef.current = null;
  }, [clearChat, loadSession, setDrawerState]);

  // Load chat for a temp list (restore session when returning to it)
  const loadChatForTempList = useCallback(async (list: SavedGroceryList) => {
    if (isLoadingRef.current) return;

    // Get the session ID from the temp list
    const tempSessionId = list.chat_session_id;
    const currentSessionId = useChatStore.getState().currentSession;

    // If the temp list's session matches current session, no need to reload
    if (tempSessionId && tempSessionId === currentSessionId) {
      lastLoadedListIdRef.current = list.id;
      return;
    }

    // If temp list has a session ID, reload that session
    if (tempSessionId) {
      isLoadingRef.current = true;
      lastLoadedListIdRef.current = list.id;

      try {
        setUserScopedSessionId(tempSessionId);
        await loadSession(tempSessionId);
      } catch (error) {
        console.error('Error restoring temp list chat session:', error);
      } finally {
        isLoadingRef.current = false;
      }
    } else {
      // No session on temp list - just mark as loaded
      lastLoadedListIdRef.current = list.id;
    }

    // Show drawer in peek state if list has items
    if (list.items && list.items.length > 0) {
      const currentDrawerState = useListStore.getState().drawerState;
      if (currentDrawerState === 'collapsed') {
        setDrawerState('peek');
      }
    }
  }, [loadSession, setDrawerState]);

  // Effect to load chat when selected list changes
  useEffect(() => {
    if (skip) return; // Onboarding mode: skip authenticated API calls
    console.log('[useListChatSync] Effect triggered. selectedListId:', selectedListId, 'selectedList:', selectedList?.id);

    if (!selectedList) {
      console.log('[useListChatSync] No selected list, skipping');
      return;
    }

    // Handle temp lists - need to restore their chat session when returning to them
    if (selectedList.id?.startsWith('temp-')) {
      console.log('[useListChatSync] Temp list detected');
      // Only reload if we're actually switching TO this list (not just updating it)
      if (lastLoadedListIdRef.current !== selectedList.id) {
        loadChatForTempList(selectedList);
      }
      return;
    }

    // Handle regular (saved) lists
    console.log('[useListChatSync] Checking if should load. selectedList.id:', selectedList.id, 'lastLoadedListIdRef:', lastLoadedListIdRef.current);
    if (selectedList.id !== lastLoadedListIdRef.current) {
      console.log('[useListChatSync] Loading chat for different list');
      loadChatForList(selectedList);

      // Also fetch price data for this list
      fetchListPriceData(selectedList.id);

      // Show drawer in peek state if list has items
      if (selectedList.items && selectedList.items.length > 0) {
        const currentDrawerState = useListStore.getState().drawerState;
        if (currentDrawerState === 'collapsed') {
          setDrawerState('peek');
        }
      }
    } else {
      console.log('[useListChatSync] Same list as before, skipping load');
    }
  }, [skip, selectedList, loadChatForList, loadChatForTempList, fetchListPriceData, setDrawerState]);

  return {
    selectedList,
    loadChatForList,
    startNewChat,
  };
}
