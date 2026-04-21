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
  // Track the desired list ID so we can re-trigger after a blocked load finishes
  const pendingListIdRef = useRef<string | null>(null);
  const autoExpandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stabilize store functions with refs to prevent callback identity changes
  const loadSessionRef = useRef(loadSession);
  loadSessionRef.current = loadSession;
  const clearChatRef = useRef(clearChat);
  clearChatRef.current = clearChat;

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
      console.error(`Error fetching chat history for list ${listId}:`);
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
      console.error('Error creating session for list:');
      return null;
    }
  }, []);

  // Load chat for selected list
  const loadChatForList = useCallback(async (list: SavedGroceryList) => {

    if (lastLoadedListIdRef.current === list.id) {
      return;
    }

    if (isLoadingRef.current) {
      // Another load is in progress — queue this list so it loads when the current one finishes
      pendingListIdRef.current = list.id;
      return;
    }

    isLoadingRef.current = true;
    lastLoadedListIdRef.current = list.id;
    pendingListIdRef.current = null;

    try {
      // First try to get chat history for this list
      const chatHistory = await fetchChatHistoryForList(list.id);

      // Check if user switched to a different list while we were fetching — discard stale result
      if (pendingListIdRef.current && pendingListIdRef.current !== list.id) {
        return;
      }

      if (chatHistory && chatHistory.session_id) {
        // List has an associated chat session - load it
        setUserScopedSessionId(chatHistory.session_id);
        const mappedMessages = chatHistory.messages.map(m => ({
          id: m.id,
          content: m.content,
          is_user: m.is_user,
          timestamp: m.timestamp,
          imageBase64: m.imageBase64 || null,
          imageMediaType: m.imageMediaType || null,
        }));
        console.log('[useListChatSync] Setting messages in store:', mappedMessages.length);
        useChatStore.setState({
          currentSession: chatHistory.session_id,
          messages: mappedMessages,
          isLoading: false,
          groceryList: null, // Clear stale grocery list to prevent overwriting fresh data from fetchLists
        });
      } else if (chatHistory && !chatHistory.session_id) {
        // List exists but no chat session - create one
        const newSessionId = await createSessionForList(list.id);
        if (newSessionId) {
          setUserScopedSessionId(newSessionId);
          await loadSessionRef.current(newSessionId);
        } else {
          // Fallback to showing empty chat
          clearChatRef.current();
        }
      } else {
        // Could not fetch chat history - try loading from the list's chat_session_id if available
        // This is a fallback for when the endpoint isn't available yet
        const listWithSession = list as SavedGroceryList & { chat_session_id?: string };
        if (listWithSession.chat_session_id) {
          setUserScopedSessionId(listWithSession.chat_session_id);
          await loadSessionRef.current(listWithSession.chat_session_id);
        } else {
          // No session - start fresh
          clearChatRef.current();
        }
      }
    } catch (error) {
      console.error('[useListChatSync] Error loading chat for list:');
      // Don't clear chat on error - might just be a network issue
    } finally {
      isLoadingRef.current = false;

      // If another list was requested while we were loading, process it now
      const pending = pendingListIdRef.current;
      if (pending && pending !== list.id) {
        const pendingList = useListStore.getState().lists.find(l => l.id === pending);
        if (pendingList) {
          // Also fetch price data for the pending list
          useListStore.getState().fetchListPriceData(pending);
          loadChatForList(pendingList);
        }
      }
    }
  }, [fetchChatHistoryForList, createSessionForList]);

  // Start a new chat (unlinked to any list)
  const startNewChat = useCallback(async () => {
    // Clear list selection
    useListStore.getState().selectList(null);
    setDrawerState('collapsed');

    // Clear chat and get fresh session
    try {
      clearChatRef.current();
      const welcomeResponse = await chatService.getWelcomeMessage();

      if (welcomeResponse.session_id && !welcomeResponse.session_id.startsWith('error-')) {
        setUserScopedSessionId(welcomeResponse.session_id);
        useChatStore.setState({ currentSession: welcomeResponse.session_id });
        await loadSessionRef.current(welcomeResponse.session_id);
      }
    } catch (error) {
      console.error('Error starting new chat:');
    }

    lastLoadedListIdRef.current = null;
  }, [setDrawerState]);

  // Load chat for a temp list (restore session when returning to it)
  const loadChatForTempList = useCallback(async (list: SavedGroceryList) => {
    if (isLoadingRef.current) {
      pendingListIdRef.current = list.id;
      return;
    }

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
        await loadSessionRef.current(tempSessionId);
      } catch (error) {
        console.error('Error restoring temp list chat session:');
      } finally {
        isLoadingRef.current = false;
      }
    } else {
      // No session on temp list - just mark as loaded
      lastLoadedListIdRef.current = list.id;
    }

    // Show drawer - expand on desktop, peek-then-expand on mobile
    if (list.items && list.items.length > 0) {
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
      if (isDesktop) {
        setDrawerState('expanded');
      } else {
        const currentDrawer = useListStore.getState().drawerState;
        if (currentDrawer === 'expanded' || currentDrawer === 'peek') {
          setDrawerState('expanded');
        } else {
          setDrawerState('peek');
          if (autoExpandTimerRef.current) clearTimeout(autoExpandTimerRef.current);
          autoExpandTimerRef.current = setTimeout(() => setDrawerState('expanded'), 500);
        }
      }
    }
  }, [setDrawerState]);

  // Effect to load chat when selected list changes (debounced to handle rapid switching)
  useEffect(() => {
    if (skip) return;
    if (!selectedListId) return;

    // Debounce rapid list switching — wait 150ms before loading to avoid firing
    // multiple API calls when user clicks through lists quickly
    const timer = setTimeout(() => {
      const currentList = useListStore.getState().lists.find(l => l.id === selectedListId);
      if (!currentList) return;

      // Handle temp lists
      if (currentList.id?.startsWith('temp-')) {
        if (lastLoadedListIdRef.current !== currentList.id) {
          loadChatForTempList(currentList);
        }
        return;
      }

      // Handle regular (saved) lists
      if (currentList.id !== lastLoadedListIdRef.current) {
        loadChatForList(currentList);
        fetchListPriceData(currentList.id);

        if (currentList.items && currentList.items.length > 0) {
          const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
          if (isDesktop) {
            setDrawerState('expanded');
          } else {
            const currentDrawer = useListStore.getState().drawerState;
            if (currentDrawer === 'expanded' || currentDrawer === 'peek') {
              setDrawerState('expanded');
            } else {
              setDrawerState('peek');
              if (autoExpandTimerRef.current) clearTimeout(autoExpandTimerRef.current);
              autoExpandTimerRef.current = setTimeout(() => setDrawerState('expanded'), 500);
            }
          }
        }
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (autoExpandTimerRef.current) clearTimeout(autoExpandTimerRef.current);
    };
  }, [skip, selectedListId, loadChatForList, loadChatForTempList, fetchListPriceData, setDrawerState]);

  // Function to reset the loaded list ref (useful when manually clearing chat state)
  const resetLoadedListRef = useCallback(() => {
    console.log('[useListChatSync] Resetting lastLoadedListIdRef');
    lastLoadedListIdRef.current = null;
  }, []);

  return {
    selectedList,
    loadChatForList,
    startNewChat,
    resetLoadedListRef,
  };
}
