import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquarePlus, XCircle, MapPin, ArrowRight, Heart, Store, Sparkles, Search, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { IoChatboxOutline, IoCameraOutline } from 'react-icons/io5';
import { LiaShoppingBagSolid } from 'react-icons/lia';
import useChatStore, { resetChatStore } from '@/stores/chatStore';
import useListStore from '@/stores/listStore';
import { GroceryItem, ChatMessage } from '@/services/chatService';
import authService from '@/services/authService';
import chatService from '@/services/chatService';
import { checkServerHealth } from '@/services/api';
import { SavedGroceryList } from '@/services/groceryListService';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import '@/styles/typing-indicator.css';
import heic2any from 'heic2any';
import MarkdownText from '@/components/MarkdownText';
import { PreferencesDropdown } from '@/components/PreferencesDropdown';
import logger from '@/utils/logger';
import { ListDrawer } from '@/components/chat/ListDrawer';
import { useListChatSync } from '@/hooks/useListChatSync';
import { usePriceCheck } from '@/hooks/usePriceCheck';
import { SearchResultInDB, GroceryProduct, saveProductSelection, ProductSelectionCreate } from '@/services/shoppingService';
import { StoreSelectorDialog } from '@/components/store-selector/StoreSelectorDialog';
import storeService, { UserSelectedStore } from '@/services/storeService';
import { onboardingChatService } from '@/services/chatService';
import { compressImage } from '@/utils/imageUtils';

export interface ChatPageProps {
  /** Render without page-level layout (for embedding in LandingPage) */
  embedded?: boolean;
  /** Called when an unauthenticated user tries to check prices */
  onSignupPrompt?: (sessionId: string) => void;
}

// Helper function to safely get grocery items array
const getItemsArray = (groceryList: any): GroceryItem[] => {
  if (!groceryList) return [];
  if (Array.isArray(groceryList)) return groceryList;
  if (groceryList.items && Array.isArray(groceryList.items)) return groceryList.items;
  return [];
};

// Helper function to safely get the grocery list name
const getGroceryListName = (list: any): string => {
  if (!list) return 'Your Grocery List';
  if (typeof list === 'object' && !Array.isArray(list) && list.name) {
    return list.name;
  }
  return 'Your Grocery List';
};

function ChatPage({ embedded = false, onSignupPrompt }: ChatPageProps = {}) {
  const isOnboarding = embedded && !authService.isAuthenticated();
  const { messages, streamingMessage, groceryList, isLoading, error, sendMessage, hydrated } = useChatStore();
  const { toolActivities, isGenerating, spinnerActive, spinnerLabel } = useChatStore((s) => ({
    toolActivities: s.toolActivities,
    isGenerating: s.isGenerating,
    spinnerActive: s.spinnerActive,
    spinnerLabel: s.spinnerLabel,
  }));
  logger.changed('ChatPage:toolActivities', toolActivities);
  const [input, setInput] = useState('');
  // Legacy list panel visibility removed (receipt-style list will render inline)
  // const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  // const [isSaving, setIsSaving] = useState(false);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for hidden file input
  const chatInitializedRef = useRef<boolean>(false); // Track if chat has been initialized
  const [forceReload, setForceReload] = useState<boolean>(false); // Add state to force reload
  const isNewChatRef = useRef<boolean>(false); // Track if we explicitly want a new chat
  const inputAreaRef = useRef<HTMLDivElement>(null); // Ref for input area container
  const [inputAreaHeight, setInputAreaHeight] = useState(64); // Track input area height for drawer positioning
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false); // Store selector modal
  const [selectedStores, setSelectedStores] = useState<UserSelectedStore[]>([]); // User's selected stores
  const [_isSavingStores, setIsSavingStores] = useState(false); // Track when stores are being saved (used for race condition prevention)
  const [userName, setUserName] = useState<string>(''); // User's first name for greeting
  
  // Intro experience logic
  const hasUserMessages = messages.some((message) => message.is_user);
  const showIntroExperience = !isLoading && !hasUserMessages && messages.length > 0 && !streamingMessage;

  // Listen for mobile header store selector button
  useEffect(() => {
    const handler = () => setIsStoreModalOpen(true);
    window.addEventListener('open-store-selector', handler);
    return () => window.removeEventListener('open-store-selector', handler);
  }, []);

  // State for selected images (multi-image support, max 4)
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagesBase64, setImagesBase64] = useState<{base64: string, mediaType: string}[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageProcessingProgress, setImageProcessingProgress] = useState(0);
  const [imageProcessingInterval, setImageProcessingInterval] = useState<NodeJS.Timeout | undefined>(undefined);

  // List store state
  const {
    drawerState,
    setDrawerState,
    selectedListId,
    lists,
    updateSelectionFunctional,
    calculateStoreSubtotals,
    addOrUpdateList,
  } = useListStore();

  // Get selected list
  const selectedList = selectedListId
    ? lists.find(l => l.id === selectedListId) || null
    : null;

  // List-chat sync hook (skip in onboarding — uses authenticated endpoints)
  useListChatSync(isOnboarding);

  // Price check hook
  const { startPriceCheck, isCheckingPrices } = usePriceCheck();

  // Track input area height for drawer positioning
  useEffect(() => {
    const inputArea = inputAreaRef.current;
    if (!inputArea) return;

    const updateHeight = () => {
      const height = inputArea.offsetHeight;
      setInputAreaHeight(height);
    };

    // Initial measurement
    updateHeight();

    // Use ResizeObserver to track height changes (e.g., when textarea grows)
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(inputArea);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Fetch user's selected stores on mount (skip in onboarding mode)
  useEffect(() => {
    if (isOnboarding) return;
    storeService.getUserSelectedStores()
      .then(setSelectedStores)
      .catch((e) => {
        console.error('[ChatPage] Failed to fetch selected stores on mount', e);
      });
  }, [isOnboarding]);

  // Fetch user's name for greeting
  useEffect(() => {
    if (isOnboarding) return;
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserName(user.first_name || '');
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, [isOnboarding]);

  // Debug: log only on change (deduped)
  useEffect(() => {
    logger.changed('ChatPage:hydration', { hydrated, messagesCount: messages.length, hasList: !!groceryList }, 'info');
  }, [hydrated, messages.length, groceryList]);

  // Check for store hydration and inconsistent state
  // Track whether messages were ever loaded to avoid infinite reload loop
  // when there legitimately are no messages (new user, empty session)
  const hadMessagesRef = useRef(false);
  useEffect(() => {
    if (messages.length > 0) {
      hadMessagesRef.current = true;
    }
  }, [messages.length]);

  useEffect(() => {
    if (chatInitializedRef.current && hadMessagesRef.current && messages.length === 0 && !forceReload) {
      console.log('Message state lost after navigation, setting force reload flag');
      setForceReload(true);
    }
  }, [messages.length, forceReload]);

  // Main initialization effect
  useEffect(() => {
    logger.debug('ChatPage mount/update effect');
    
    // Check authentication (skip redirect when embedded/onboarding)
    if (!authService.isAuthenticated() && !isOnboarding) {
      logger.info('User not logged in, redirecting to login page');
      navigate('/login');
      return;
    }

    // Set onboarding mode in chat store
    if (isOnboarding) {
      useChatStore.getState().setOnboarding(true);
    } else {
      useChatStore.getState().setOnboarding(false);
    }

    if (!hydrated) {
      logger.debug('Waiting for store hydration to complete...');
      return;
    }
    
    if (forceReload) {
      logger.info('Force reload flag set, initializing page');
      initializePage();
      setForceReload(false);
      return;
    }

    // Note: Removed aggressive "broken state" reset that was causing data loss.
    // If groceryList has items but messages are empty, let initializePage() handle recovery
    // by fetching from the backend using the stored session ID.

    if (!chatInitializedRef.current) {
      logger.info('First mount - initializing chat');
      
      if (isNewChatRef.current) {
        logger.info('New chat requested - clearing any hydrated messages');
        isNewChatRef.current = false;
        initializePage();
        chatInitializedRef.current = true;
      } else if (messages.length > 0) {
        logger.info('Chat already hydrated from storage - skipping init', messages.length);
        chatInitializedRef.current = true;
      } else {
        logger.info('No messages in hydrated store - initializing from server');
        initializePage();
        chatInitializedRef.current = true;
      }
    } else {
      logger.changed('ChatPage:alreadyInitializedCount', { messages: messages.length }, 'debug');
    }
    
    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: embedded });
    }, 100);
  }, [navigate, hydrated, messages.length, groceryList, forceReload, isOnboarding]);

  // Check backend connectivity and load chat history
  const initializePage = async () => {
    logger.debug('InitializePage called');
    
    if (useChatStore.getState().isInitializing) {
      logger.debug('Already initializing, skipping');
      return;
    }
    
    useChatStore.setState({ isLoading: true, isInitializing: true });
    
    const safetyTimeout = setTimeout(() => {
      logger.warn('Safety timeout triggered - forcing loading state to false');
      useChatStore.setState({ isLoading: false, isInitializing: false });
    }, 10000);
    
    try {
      const isHealthy = await checkServerHealth();
      if (!isHealthy) {
        console.error("Backend server is not reachable!");
        useChatStore.setState({ 
          error: "Can't connect to chat service. Try resetting the app.",
          isLoading: false,
          isInitializing: false
        });
        clearTimeout(safetyTimeout);
        return;
      }
      
      const { getUserScopedSessionId, setUserScopedSessionId } = await import('@/stores/chatStore');

      // In onboarding mode, use localStorage-based session (no user-scoped)
      let sessionId: string | null = null;
      if (isOnboarding) {
        sessionId = localStorage.getItem('onboarding-session-id');
      } else {
        sessionId = getUserScopedSessionId();
      }

      if (isNewChatRef.current) {
        logger.info('User explicitly requested new chat - not loading any previous sessions');
        sessionId = null;
        isNewChatRef.current = false;
      } else if (!sessionId && !isOnboarding) {
        // Try to recover session from groceryList if it exists (auth required)
        const currentList = useChatStore.getState().groceryList;
        if (currentList?.id && !currentList.id.startsWith('temp-')) {
          logger.info('No session ID but groceryList exists - attempting recovery from list', currentList.id);
          try {
            const { apiClient } = await import('@/services/api');
            const response = await apiClient.get(`/grocery-lists/${currentList.id}/chat-history`);
            if (response.data?.session_id) {
              sessionId = response.data.session_id;
              setUserScopedSessionId(sessionId);
              useChatStore.setState({ currentSession: sessionId });
              logger.info('Recovered session ID from groceryList:', sessionId);
            }
          } catch (e) {
            logger.warn('Failed to recover session from groceryList:', e);
          }
        }

        if (!sessionId) {
          logger.info('No session ID in localStorage, starting fresh with welcome message');
        }
      }
      
      if (isOnboarding) {
        // Onboarding: always start fresh with welcome message (no auth to load history)
        logger.info('Onboarding mode - showing welcome message');
        useChatStore.setState({ isLoading: true });
        await showWelcomeMessage();
      } else if (sessionId && sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
        try {
          await useChatStore.getState().loadSession(sessionId);
          logger.info('Session loaded successfully');
          try {
            const draft = await chatService.getCurrentSessionList(sessionId);
            useChatStore.setState({ groceryList: {
              id: draft.list?.id || null,
              name: draft.list?.name || 'My Grocery List',
              items: draft.items
            } });
          } catch (e) {
            logger.warn('Failed to fetch session draft list:', e);
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
          if (useChatStore.getState().messages.length === 0) {
            logger.info('Failed to load history, showing welcome message');
            useChatStore.setState({ isLoading: true });
            await showWelcomeMessage();
          }
        }
      } else {
        logger.info('No valid session ID found, showing welcome message');
        useChatStore.setState({ isLoading: true });
        const welcome = isOnboarding
          ? await onboardingChatService.getWelcomeMessage()
          : await chatService.getWelcomeMessage();
        if (welcome.session_id && !welcome.session_id.startsWith('error-')) {
          // Store session ID
          if (isOnboarding) {
            localStorage.setItem('onboarding-session-id', welcome.session_id);
          } else {
            const { setUserScopedSessionId } = await import('@/stores/chatStore');
            setUserScopedSessionId(welcome.session_id);
          }
          useChatStore.setState({ currentSession: welcome.session_id });
          await useChatStore.getState().loadSession(welcome.session_id);
          try {
            const draft = await chatService.getCurrentSessionList(welcome.session_id);
            useChatStore.setState({ groceryList: {
              id: draft.list?.id || null,
              name: draft.list?.name || 'My Grocery List',
              items: draft.items
            } });
          } catch (e) {
            logger.warn('No draft list after welcome (expected for brand-new sessions)');
          }
        } else {
          await showWelcomeMessage();
        }
      }
      
      clearTimeout(safetyTimeout);
      useChatStore.setState({ isLoading: false, isInitializing: false });
      
    } catch (error) {
      console.error('Error during page initialization:', error);
      useChatStore.setState({ 
        isLoading: false,
        isInitializing: false,
        error: 'Failed to initialize chat. Please try refreshing the page.'
      });
      
      clearTimeout(safetyTimeout);
    }
  };
  
  // Helper function to show welcome message
  const showWelcomeMessage = async () => {
    try {
      useChatStore.setState({
        messages: [],
        currentSession: null,
        groceryList: null,
        isLoading: true
      });

      const { setUserScopedSessionId } = await import('@/stores/chatStore');
      setUserScopedSessionId(null);

      const welcomeResponse = isOnboarding
        ? await onboardingChatService.getWelcomeMessage()
        : await chatService.getWelcomeMessage();
      
      if (welcomeResponse.session_id && !welcomeResponse.session_id.startsWith('error-')) {
        // Store session ID
        if (isOnboarding) {
          localStorage.setItem('onboarding-session-id', welcomeResponse.session_id);
        } else {
          const { setUserScopedSessionId } = await import('@/stores/chatStore');
          setUserScopedSessionId(welcomeResponse.session_id);
        }
        useChatStore.setState({ currentSession: welcomeResponse.session_id });

        if (isOnboarding) {
          // For onboarding, just display the welcome content directly (no auth to load history)
          const welcomeMessage: ChatMessage = {
            id: 'welcome-message',
            content: welcomeResponse.content,
            is_user: false,
            timestamp: welcomeResponse.timestamp
          };
          useChatStore.setState({ messages: [welcomeMessage], isLoading: false });
        } else {
          await useChatStore.getState().loadSession(welcomeResponse.session_id);
        }
      } else {
        const welcomeMessage: ChatMessage = {
          id: 'welcome-message',
          content: welcomeResponse.content,
          is_user: false,
          timestamp: welcomeResponse.timestamp
        };
        
        useChatStore.setState({ 
          messages: [welcomeMessage],
          isLoading: false
        });
      }
      
      logger.info('Welcome message loaded with session:', welcomeResponse.session_id);
    } catch (error) {
      console.error('Failed to fetch welcome message, using fallback:', error);
      const welcomeMessage: ChatMessage = {
        id: 'welcome-message',
        content: "Hi, I'm Savr! You can tell me what meals you're shopping for, or just give me your shopping list.",
        is_user: false,
        timestamp: new Date().toISOString()
      };
      
      useChatStore.setState({ 
        messages: [welcomeMessage],
        isLoading: false
      });
      
      logger.info('Fallback welcome message displayed');
    }
  };

  // Scroll to bottom whenever messages change or drawer state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, drawerState]);

  const scrollToBottom = () => {
    if (embedded && messagesContainerRef.current) {
      // When embedded, scroll within the container to avoid scrolling the whole page
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Render debug (deduped)
  logger.changed('ChatPage:renderSnapshot', {
    isLoading,
    isProcessingImage,
    selectedImages: selectedImages.map(f => f.name),
    hasImagesBase64: imagesBase64.length,
    inputLength: input.length,
  }, 'debug');
  const sendButtonDisabled = isLoading || isProcessingImage || (!input.trim() && selectedImages.length === 0) || (selectedImages.length > 0 && imagesBase64.length < selectedImages.length);
  logger.changed('ChatPage:sendButtonDisabled', { disabled: sendButtonDisabled }, 'debug');

  useEffect(() => {
    return () => {
      if (imageProcessingInterval) {
        clearInterval(imageProcessingInterval);
      }
    };
  }, [imageProcessingInterval]);


  // Function to handle file selection (supports multiple files, max 4 total)
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remaining = 4 - selectedImages.length;
    if (remaining <= 0) {
      toast({ title: "Max Images Reached", description: "You can attach up to 4 images per message.", variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      toast({ title: "Some Images Skipped", description: `Only ${remaining} more image(s) can be added (max 4).`, variant: "default" });
    }

    setIsProcessingImage(true);
    setImageProcessingProgress(0);

    for (const file of filesToProcess) {
      console.log("File selected:", file.name, file.type);
      let processedFile = file;

      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        try {
          setImageProcessingProgress(10);
          const conversionResult = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
          const convertedBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
          const fileNameWithoutExtension = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          processedFile = new File([convertedBlob], `${fileNameWithoutExtension}.jpg`, { type: 'image/jpeg' });
          setImageProcessingProgress(50);
        } catch (conversionError: any) {
          if (conversionError?.code === 1 && conversionError?.message?.includes('Image is already browser readable')) {
            const readableTypeMatch = conversionError.message.match(/readable: (image\/[a-zA-Z]+)/);
            const assumedType = readableTypeMatch?.[1] || 'image/jpeg';
            if (!file.type || !file.type.startsWith('image/')) {
              processedFile = new File([file], file.name, { type: assumedType });
            }
            setImageProcessingProgress(50);
          } else {
            toast({ title: "HEIC Conversion Error", description: `Could not convert ${file.name}. Skipping.`, variant: "destructive" });
            continue;
          }
        }
      }

      if (!processedFile.type.startsWith('image/')) {
        toast({ title: "Invalid File Type", description: `${file.name} is not an image. Skipping.`, variant: "destructive" });
        continue;
      }

      if (processedFile.size > 10 * 1024 * 1024) {
        toast({ title: "File Too Large", description: `${file.name} exceeds 10MB. Skipping.`, variant: "destructive" });
        continue;
      }

      try {
        const compressedFile = await compressImage(processedFile);
        console.log("Image compressed:", compressedFile.name, `(${(compressedFile.size / 1024).toFixed(2)} KB)`);

        // Add to selected images
        setSelectedImages(prev => [...prev, compressedFile]);

        // Generate preview
        const previewUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(compressedFile);
        });
        setImagePreviews(prev => [...prev, previewUrl]);

        // Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(compressedFile);
        });
        setImagesBase64(prev => [...prev, { base64, mediaType: compressedFile.type }]);

        setImageProcessingProgress(75);
      } catch (error) {
        console.error("Error processing image:", error);
        toast({ title: "Processing Error", description: `Error processing ${file.name}. Skipping.`, variant: "destructive" });
      }
    }

    setIsProcessingImage(false);
    setImageProcessingProgress(100);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Function to trigger hidden file input
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Function to clear all selected images
  const clearSelectedImages = useCallback((clearFileInput: boolean = true) => {
    logger.debug("Clearing all selected images");
    setSelectedImages([]);
    setImagesBase64([]);
    setImagePreviews([]);
    setIsProcessingImage(false);
    setImageProcessingProgress(0);
    if (clearFileInput && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Function to remove a single image by index
  const removeImage = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagesBase64(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.debug("handleSendMessage triggered");

    if (isLoading || isProcessingImage) {
      logger.debug("handleSendMessage blocked: isLoading or isProcessingImage");
      return;
    }
    if (!input.trim() && selectedImages.length === 0) {
      logger.debug("handleSendMessage blocked: No input and no selected images");
      return;
    }
    if (selectedImages.length > 0 && imagesBase64.length < selectedImages.length) {
      logger.debug("handleSendMessage blocked: Images selected but base64 not ready");
      toast({ title: "Images Still Processing", description: "Please wait a moment for the images to be ready.", variant: "default" });
      return;
    }

    const textToSend = input.trim();
    const imagesToSend = imagesBase64.length > 0 ? imagesBase64 : undefined;

    logger.debug("Proceeding to send message...", { textLen: textToSend.length, imageCount: imagesToSend?.length || 0 });

    if (imagesToSend) {
      setImageProcessingProgress(0);
      if (imageProcessingInterval) {
        clearInterval(imageProcessingInterval);
      }
      let secondsElapsed = 0;
      const interval = setInterval(() => {
        secondsElapsed += 1;
        setImageProcessingProgress(Math.min(secondsElapsed * 10, 100));
        if (secondsElapsed >= 10) {
          clearInterval(interval);
          setImageProcessingInterval(undefined);
        }
      }, 1000);
      setImageProcessingInterval(interval);
    }

    try {
      await sendMessage({
        text: textToSend,
        // Legacy single-image fields for backward compat
        imageBase64: imagesToSend?.[0]?.base64 || null,
        imageMediaType: imagesToSend?.[0]?.mediaType || null,
        // Multi-image array
        images: imagesToSend,
      });
      logger.info("Message sent successfully via store");

      if (imageProcessingInterval) {
        clearInterval(imageProcessingInterval);
        setImageProcessingInterval(undefined);
      }
      setImageProcessingProgress(0);

      setInput('');
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
      clearSelectedImages();
    } catch (error: any) {
      console.error("Error in handleSendMessage catch block:", error);
      if (imageProcessingInterval) {
        clearInterval(imageProcessingInterval);
        setImageProcessingInterval(undefined);
      }
      setImageProcessingProgress(0);
      
      toast({ 
        title: "Failed to Send", 
        description: error?.message || "Could not send message. Image analysis may take longer than expected.", 
        variant: "destructive" 
      });
    }

    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: embedded });
    }, 50);
  };

  const handleClearChat = async () => {
    setIsCreatingNewChat(true);
    try {
      // Note: We intentionally do NOT call clearCurrentSessionList here.
      // The list should keep its chat_session_id so users can return to the
      // chat history later by selecting the list.
      const { setUserScopedSessionId } = await import('@/stores/chatStore');
      setUserScopedSessionId(null);
      localStorage.removeItem('savr-chat-storage');

      useChatStore.getState().clearChat();

      // Clear list store state to hide drawer when starting new chat
      useListStore.getState().selectList(null);
      useListStore.getState().setDrawerState('collapsed');

      await showWelcomeMessage();
    } finally {
      setIsCreatingNewChat(false);
    }
  };

  const handleFullReset = async () => {
    isNewChatRef.current = true;

    // Note: We intentionally do NOT call clearCurrentSessionList here.
    // The list should keep its chat_session_id so users can return to the
    // chat history later by selecting the list.
    const { setUserScopedSessionId } = await import('@/stores/chatStore');
    setUserScopedSessionId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('savr-chat-storage');

    resetChatStore();

    // Clear list store state to hide drawer when starting new chat
    useListStore.getState().selectList(null);
    useListStore.getState().setDrawerState('collapsed');

    await showWelcomeMessage();
  };

  // Track previous groceryList to detect actual changes (not just re-renders)
  const prevGroceryListRef = useRef<typeof groceryList>(null);

  // Effect to sync grocery list from chat to list store and trigger drawer
  // IMPORTANT: Only auto-select temp list when groceryList actually CHANGES (new items added via chat)
  // Do NOT re-select when user manually selects a different list
  useEffect(() => {
    if (groceryList && getItemsArray(groceryList).length > 0) {
      // Create a list object for the drawer
      // Use real list ID from backend if available, otherwise fall back to temp ID
      const listName = getGroceryListName(groceryList);
      const realListId = groceryList.id;  // Real ID from backend (if list was saved)
      const tempList: SavedGroceryList = {
        id: realListId || 'temp-current-list',  // Use real ID to avoid duplication on price check
        name: listName,
        userId: authService.getUserId() || 'anonymous',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        items: getItemsArray(groceryList),
        // Link to current session so useListChatSync knows this is the active chat
        chat_session_id: useChatStore.getState().currentSession || undefined,
      };

      // Add to list store (will update in place due to stable ID)
      addOrUpdateList(tempList);

      // Check if groceryList actually changed (not just a re-render due to other state changes)
      const prevItems = prevGroceryListRef.current ? getItemsArray(prevGroceryListRef.current) : [];
      const currItems = getItemsArray(groceryList);
      const listActuallyChanged = prevItems.length !== currItems.length ||
        JSON.stringify(prevItems) !== JSON.stringify(currItems);

      // Only auto-select temp list if the grocery list content actually changed
      // This prevents overriding user's manual list selection
      if (listActuallyChanged) {
        useListStore.getState().selectList(tempList.id);

        if (useListStore.getState().drawerState === 'collapsed') {
          setDrawerState('peek');
        }
      }

      prevGroceryListRef.current = groceryList;
    }
  }, [groceryList, addOrUpdateList, setDrawerState]);

  // Handle product selection in drawer
  const handleSelectProduct = useCallback(async (
    itemName: string,
    product: GroceryProduct | SearchResultInDB,
    storeName: string
  ) => {
    if (!selectedListId) return;

    // Optimistic local update
    updateSelectionFunctional(selectedListId, itemName, storeName, product as SearchResultInDB);
    // Recalculate subtotals after a short delay
    setTimeout(() => {
      calculateStoreSubtotals(selectedListId);
    }, 100);

    // Get session_id from price data for persistence
    const priceData = useListStore.getState().listPriceDataMap[selectedListId];
    const sessionId = priceData?.session_id;
    if (!sessionId) {
      // No active search session - can't persist selection
      return;
    }

    // Persist selection to backend
    const isNothingProduct = product.name === "Nothing";
    const selectedProductId = !isNothingProduct ? (product as SearchResultInDB).id : null;

    const selectionPayload: ProductSelectionCreate = {
      item_name: itemName,
      store_name: storeName,
      selected_product_id: selectedProductId,
      is_nothing: isNothingProduct,
      session_id: sessionId,
    };

    try {
      await saveProductSelection(selectedListId, selectionPayload);
    } catch (error) {
      console.error('Failed to save product selection:', error);
      // Selection is already applied locally - could show toast for error feedback
    }
  }, [selectedListId, updateSelectionFunctional, calculateStoreSubtotals]);

  // Handle check prices — gate behind auth for onboarding users
  const handleCheckPrices = useCallback(() => {
    if (isOnboarding) {
      // Show signup modal instead of running price check
      const sid = useChatStore.getState().currentSession || localStorage.getItem('onboarding-session-id') || '';
      onSignupPrompt?.(sid);
      return;
    }
    if (!selectedList) {
      toast({
        title: 'No List Selected',
        description: 'Please select a list first.',
        variant: 'destructive',
      });
      return;
    }
    startPriceCheck(selectedList);
    setDrawerState('expanded');
  }, [isOnboarding, onSignupPrompt, selectedList, startPriceCheck, setDrawerState, toast]);


  const renderLoadingIndicator = () => {
    // Show when any generation or tool activity is ongoing
    if (!isLoading && !isGenerating && !spinnerActive) return null;
    return (
      <div className="flex flex-col items-center gap-2 py-4">
        {/* Dot wave loader */}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-[bounce_1.4s_ease-in-out_infinite]" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-[bounce_1.4s_ease-in-out_infinite]" style={{ animationDelay: '200ms' }} />
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-[bounce_1.4s_ease-in-out_infinite]" style={{ animationDelay: '400ms' }} />
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-body" aria-live="polite">
          {imageProcessingProgress > 0
            ? `Analyzing image (${imageProcessingProgress}%)`
            : (spinnerLabel || 'Thinking…')}
        </span>
      </div>
    );
  };

  return (
    <div className={cn(
      "w-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden",
      embedded ? "h-full relative" : "h-full relative"
    )}>
      {/* Mint radial accents (light mode only) */}
      <div className="pointer-events-none absolute inset-0 z-0 dark:hidden">
        {/* Blob 1: mobile top-right, desktop top-left */}
        <div className="absolute -top-10 -right-10 lg:-left-10 lg:right-auto h-[34vh] w-[34vh] lg:h-[68vh] lg:w-[68vh] rounded-full bg-emerald-200/60 lg:bg-emerald-100/40 blur-3xl" />
        {/* Blob 2: mobile bottom-left, desktop bottom-right */}
        <div className="absolute -bottom-10 -left-10 lg:-right-10 lg:left-auto h-[36vh] w-[36vh] lg:h-[72vh] lg:w-[72vh] rounded-full bg-emerald-100/40 lg:bg-emerald-100/35 blur-3xl" />
      </div>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Header - Completely hidden, moved to input area */}
              
              {/* Messages Container - Fixed on mobile, flex on desktop */}
              <div
                ref={messagesContainerRef}
                className={cn(
                  "lg:relative bottom-0 left-0 right-0 lg:flex-1 overflow-y-auto overflow-x-hidden chat-messages hide-scrollbar scrollbar-hide bg-transparent dark:bg-slate-900 lg:min-h-0 transition-all duration-500",
                  embedded ? "relative flex-1 top-0" : "fixed top-0",
                  showIntroExperience ? "flex items-center justify-center" : ""
                )}
                style={{ zIndex: 10 }}
              >
                <div className={cn(
                  "w-full mx-auto px-4 sm:px-6 transition-all duration-500",
                  showIntroExperience
                    ? "min-h-[calc(100vh-120px)] sm:min-h-full flex flex-col items-center justify-center gap-8 sm:gap-10 pt-28 sm:pt-24 pb-10"
                    : embedded ? 'pt-4 pb-[100px] sm:pb-[116px]' : 'pt-[112px] pb-[160px] sm:pb-[180px] lg:pt-20 lg:pb-6'
                )}>
                  <div className="w-full flex justify-center px-0">
                    <div className="w-full max-w-[96%] sm:max-w-[85%] lg:max-w-[70%]">
                      {/* Intro Experience - Before first user message */}
                      {showIntroExperience ? (
                        <div className="w-full flex flex-col items-center justify-center gap-3 sm:gap-5">
                          {/* Greeting Heading */}
                          <div className="w-full flex justify-center">
                            <div className="w-full">
                              <div className="space-y-2 sm:space-y-3 text-left">
                                <p className="text-base sm:text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                                  Hello {userName || 'there'}
                                  <span role="img" aria-label="wave" className="text-2xl sm:text-4xl leading-none">
                                    👋
                                  </span>
                                </p>
                                <div className="text-4xl sm:text-5xl font-heading font-normal sm:font-medium text-slate-900 dark:text-white leading-tight" style={{ fontFamily: '"Crimson Pro", "EB Garamond", Garamond, Georgia, "Times New Roman", serif' }}>
                                  Your AI Grocery
                                  <br />
                                  <span className="italic" style={{ fontFamily: '"Crimson Pro", "EB Garamond", Garamond, Georgia, "Times New Roman", serif' }}>
                                    Shopping Companion.
                                  </span>
                                </div>
                                <div className="mt-2 sm:mt-3 lg:mt-6 inline-flex items-center px-3 sm:px-4 py-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-slate-200 dark:border-slate-600">
                                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1.5 sm:mr-2" />
                                  <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">
                                    🛒 AI-Powered Canadian Grocery Shopping 🇨🇦
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Initial Assistant Message */}
                          <div className="w-full flex justify-center">
                            <div className="w-full">
                              <div className="w-full sm:max-w-[85%] lg:max-w-[70%]">
                                <div className="flex items-center mb-2">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                                    <MessageSquarePlus className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                                  </div>
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 font-body">Savr Assistant</span>
                                </div>
                                <div className="relative message-bubble bg-slate-100/70 dark:bg-slate-700/70 backdrop-blur-md text-slate-900 dark:text-white rounded-2xl border border-slate-200/80 dark:border-slate-600/80 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm sm:text-base leading-relaxed sm:leading-[1.65]">
                                  <div className="space-y-1.5 sm:space-y-3">
                                    <MarkdownText text={messages[0]?.content || "Hi, I'm Savr! You can tell me what meals you're shopping for, or just give me your shopping list."} />
                                  </div>
                                  <div className="text-xs mt-2 sm:mt-3 text-slate-500 dark:text-slate-400">
                                    {messages[0] && new Date(messages[0].timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Intro Input - Below the message */}
                          <div className="w-full pt-1 pb-6 relative z-10">
                            <div className="w-full flex justify-center px-0">
                              <div className="w-full">
                                <div className="w-full rounded-2xl p-[1px] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 dark:from-emerald-500 dark:via-teal-500 dark:to-cyan-500" style={{ boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3), 0 8px 10px -6px rgba(20, 184, 166, 0.3)' }}>
                                  <div className="w-full bg-white dark:bg-slate-900 rounded-[15px] px-4 sm:px-6 py-4 space-y-4">
                                    {/* Image Preview */}
                                    {imagePreviews.length > 0 && (
                                      <div className="relative inline-block">
                                        <div className="relative p-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-600/60">
                                          <img
                                            src={imagePreviews[0]}
                                            alt="Selected preview"
                                            className="max-h-16 sm:max-h-20 max-w-full rounded-xl object-cover"
                                          />
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-5 w-5 sm:h-6 sm:w-6 bg-red-500 hover:bg-red-600 text-white rounded-full"
                                            onClick={() => removeImage(0)}
                                            title="Remove image"
                                            disabled={isLoading}
                                          >
                                            <XCircle className="h-3 w-3 sm:h-3 sm:w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                    
                                    <form onSubmit={handleSendMessage} className="flex flex-col gap-2 sm:gap-3">
                                      <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/jpeg,image/png,image/gif,image/webp,image/heic,.heic"
                                        style={{ display: "none" }}
                                      />
                                      
                                      {/* Textarea and Send Button Row */}
                                      <div className="flex items-end gap-2 lg:flex-col lg:gap-3 lg:relative">
                                        {/* Textarea - beside send on mobile, full width on desktop */}
                                        <div className="flex-1 min-w-0 flex items-stretch lg:w-full">
                                          <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                if (!sendButtonDisabled) {
                                                  handleSendMessage(e as unknown as React.FormEvent);
                                                }
                                              }
                                            }}
                                            placeholder={
                                              isLoading && imageProcessingProgress > 0
                                                ? "Analyzing your image..."
                                                : selectedImages.length > 0
                                                ? "Add a description for the image..."
                                                : "Ask anything..."
                                            }
                                            disabled={isLoading || isProcessingImage || isGenerating}
                                            rows={1}
                                            style={{ whiteSpace: input ? "pre-wrap" : "nowrap" }}
                                            className="w-full min-h-[36px] sm:min-h-[44px] max-h-40 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl border border-transparent bg-white dark:bg-slate-800 focus:outline-none focus:ring-0 focus:border-transparent text-sm sm:text-base font-body leading-relaxed resize-none overflow-hidden"
                                          />
                                        </div>
                                        
                                        {/* Send button - beside input on mobile, bottom right on desktop */}
                                        <Button
                                          type="submit"
                                          disabled={!!(isLoading || isProcessingImage || isGenerating || (!input.trim() && selectedImages.length === 0) || (selectedImages.length > 0 && imagesBase64.length < selectedImages.length))}
                                          className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-all duration-200 flex-shrink-0 flex items-center justify-center lg:absolute lg:bottom-0 lg:right-0"
                                          aria-label="Send message"
                                        >
                                          {(isLoading || isProcessingImage || spinnerActive) ? (
                                            <Loader2 className="h-7 w-7 sm:h-8 sm:w-8 animate-spin" />
                                          ) : (
                                            <ArrowRight className="h-[30px] w-[30px] sm:h-[34px] sm:w-[34px]" />
                                          )}
                                        </Button>
                                        
                                        {/* Action Buttons Row - desktop only, inside relative container */}
                                        <div className="hidden lg:flex w-full items-center gap-1 sm:gap-2">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleUploadClick}
                                            title="Camera"
                                            className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                          >
                                            <IoCameraOutline className="h-4 w-4" />
                                          </Button>
                                          
                                          {!isOnboarding && (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => navigate('/profile')}
                                              title="Preferences"
                                              className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            >
                                              <Heart className="h-4 w-4" />
                                            </Button>
                                          )}
                                          
                                          {!isOnboarding && (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              title="Stores"
                                              onClick={() => setIsStoreModalOpen(true)}
                                              className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            >
                                              <Store className="h-4 w-4" />
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Action Buttons Row - mobile only */}
                                      <div className="w-full flex lg:hidden items-center gap-1 sm:gap-2">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={handleUploadClick}
                                          title="Camera"
                                          className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                          <IoCameraOutline className="h-4 w-4" />
                                        </Button>
                                        
                                        {!isOnboarding && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => navigate('/profile')}
                                            title="Preferences"
                                            className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                          >
                                            <Heart className="h-4 w-4" />
                                          </Button>
                                        )}
                                        
                                        {!isOnboarding && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            title="Stores"
                                            onClick={() => setIsStoreModalOpen(true)}
                                            className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                          >
                                            <Store className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </form>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={cn(
                          'w-full px-3 sm:px-4 space-y-4 sm:space-y-6',
                          'transition-[margin] duration-300 ease-out',
                          // Shift left on desktop when drawer is open
                          drawerState === 'collapsed' ? 'mx-auto' : 'mx-auto lg:ml-6 lg:mr-[34rem] xl:mr-[44rem]'
                        )}>
                          {/* Normal conversation messages */}
                          {messages.map((message: ChatMessage) => (
                            <div
                              key={message.id}
                              className={`flex ${message.is_user ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[90%] sm:max-w-[85%] lg:max-w-[70%] ${message.is_user ? 'order-2' : 'order-1'}`}>
                                {/* Avatar */}
                                {!message.is_user && (
                                  <div className="flex items-center mb-2">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                                      <IoChatboxOutline className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 font-body">Savr Assistant</span>
                                  </div>
                                )}

                                {/* Message Bubble */}
                                <div
                                  className={`relative message-bubble backdrop-blur-md ${
                                    message.is_user
                                      ? 'bg-green-500/80 text-white border border-green-600/50'
                                      : 'bg-slate-100/70 dark:bg-slate-700/70 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-600/80'
                                  } rounded-2xl px-3 sm:px-4 lg:px-6 py-3 sm:py-4`}
                                >
                                  {/* Message Content */}
                                  <div className="space-y-2 sm:space-y-3">
                                    {/* Spinner is shown only on the Send button; no spinner inside bubbles */}
                                    <MarkdownText text={message.content} />

                                    {/* Image Display (multi-image or legacy single) */}
                                    {message.images && message.images.length > 0 ? (
                                      <div className={`mt-2 sm:mt-3 grid gap-2 ${message.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                        {message.images.map((img, idx) => (
                                          <img
                                            key={idx}
                                            src={`data:${img.mediaType};base64,${img.base64}`}
                                            alt={`Uploaded ${idx + 1}`}
                                            className="max-h-48 sm:max-h-64 rounded-lg object-cover w-full"
                                          />
                                        ))}
                                      </div>
                                    ) : message.imageBase64 && message.imageMediaType ? (
                                      <div className="mt-2 sm:mt-3">
                                        <img
                                          src={`data:${message.imageMediaType};base64,${message.imageBase64}`}
                                          alt="User uploaded"
                                          className="max-h-48 sm:max-h-64 rounded-lg object-cover w-full"
                                        />
                                      </div>
                                    ) : null}
                                  </div>

                                  {/* Timestamp */}
                                  <div
                                    className={`text-xs mt-2 sm:mt-3 ${
                                      message.is_user
                                        ? 'text-green-100'
                                        : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                  >
                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Streaming Message */}
                          {streamingMessage && (
                            <div
                              key={streamingMessage.id}
                              className={`flex justify-start`}
                            >
                              <div className={`max-w-[90%] sm:max-w-[85%] lg:max-w-[70%]`}>
                                {/* Avatar */}
                                <div className="flex items-center mb-2">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                                    <MessageSquarePlus className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                                  </div>
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 font-body">Savr Assistant</span>
                                </div>

                                {/* Message Bubble */}
                                <div
                                  className={`relative message-bubble backdrop-blur-md bg-slate-100/70 dark:bg-slate-700/70 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-600/80 rounded-2xl px-3 sm:px-4 lg:px-6 py-3 sm:py-4`}
                                >
                                  {/* Message Content */}
                                  <div className="space-y-2 sm:space-y-3">
                                    <MarkdownText text={streamingMessage.content} />

                                    {/* Image Display */}
                                    {streamingMessage.imageBase64 && streamingMessage.imageMediaType && (
                                      <div className="mt-2 sm:mt-3">
                                        <img
                                          src={`data:${streamingMessage.imageMediaType};base64,${streamingMessage.imageBase64}`}
                                          alt="User uploaded"
                                          className="max-h-48 sm:max-h-64 rounded-lg object-cover w-full"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* Timestamp */}
                                  <div
                                    className={`text-xs mt-2 sm:mt-3 text-slate-500 dark:text-slate-400`}
                                  >
                                    {new Date(streamingMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Loading Indicator */}
                          {renderLoadingIndicator()}

                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

                  {/* Input Area - Only show when NOT in intro experience */}
                  {!showIntroExperience && (
                  <div
                    ref={inputAreaRef}
                    className={cn(
                      "bottom-0 left-0 right-0 lg:left-auto lg:right-auto pt-0 pb-4 lg:py-4 bg-white dark:bg-slate-900 lg:bg-transparent lg:dark:bg-transparent lg:shrink-0 z-20",
                      embedded ? "sticky" : "fixed lg:sticky"
                    )}
                  >
                    <div className="w-full flex justify-center px-0">
                      <div className="w-full max-w-[96%] sm:max-w-[85%] lg:max-w-[70%]">
                        <div className="w-full rounded-2xl p-[1px] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 dark:from-emerald-500 dark:via-teal-500 dark:to-cyan-500" style={{ boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3), 0 8px 10px -6px rgba(20, 184, 166, 0.3)' }}>
                          <div className="w-full bg-white dark:bg-slate-900 rounded-[15px] px-4 sm:px-6 py-4 space-y-4">
                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {imagePreviews.map((previewUrl, idx) => (
                          <div key={idx} className="relative inline-block">
                            <div className="relative p-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-600/60">
                              <img
                                src={previewUrl}
                                alt={`Preview ${idx + 1}`}
                                className="max-h-16 sm:max-h-20 max-w-full rounded-xl object-cover"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-5 w-5 sm:h-6 sm:w-6 bg-red-500 hover:bg-red-600 text-white rounded-full"
                                onClick={() => removeImage(idx)}
                                title="Remove image"
                                disabled={isLoading}
                              >
                                <XCircle className="h-3 w-3 sm:h-3 sm:w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Input Form */}
                    <form onSubmit={handleSendMessage} className="flex flex-col gap-2 sm:gap-3">
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/jpeg,image/png,image/gif,image/webp,image/heic,.heic"
                        multiple
                        style={{ display: 'none' }}
                      />

                      {/* Textarea and Send Button Row */}
                      <div className="flex items-end gap-2 lg:flex-col lg:gap-3 lg:relative">
                        {/* Textarea - beside send on mobile, full width on desktop */}
                        <div className="flex-1 min-w-0 flex items-stretch lg:w-full">
                          <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (!sendButtonDisabled) {
                                  handleSendMessage(e as unknown as React.FormEvent);
                                }
                              }
                            }}
                            placeholder={
                              isLoading && imageProcessingProgress > 0
                                ? 'Analyzing your image...'
                                : selectedImages.length > 0
                                ? `Add a description for ${selectedImages.length > 1 ? 'the images' : 'the image'}...`
                                : 'Ask anything...'
                            }
                            disabled={isLoading || isProcessingImage || isGenerating}
                            rows={1}
                            style={{ whiteSpace: input ? "pre-wrap" : "nowrap" }}
                            className="w-full min-h-[36px] sm:min-h-[44px] max-h-40 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl border border-transparent bg-white dark:bg-slate-800 focus:outline-none focus:ring-0 focus:border-transparent text-sm sm:text-base font-body leading-relaxed resize-none overflow-hidden"
                          />
                        </div>
                        
                        {/* Send button - beside input on mobile, bottom right on desktop */}
                        <Button
                          type="submit"
                          disabled={!!(isLoading || isProcessingImage || isGenerating || (!input.trim() && selectedImages.length === 0) || (selectedImages.length > 0 && imagesBase64.length < selectedImages.length))}
                          className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-all duration-200 flex-shrink-0 flex items-center justify-center lg:absolute lg:bottom-0 lg:right-0"
                          aria-label="Send message"
                        >
                          {(isLoading || isProcessingImage || spinnerActive) ? (
                            <Loader2 className="h-7 w-7 sm:h-8 sm:w-8 animate-spin" />
                          ) : (
                            <ArrowRight className="h-[30px] w-[30px] sm:h-[34px] sm:w-[34px]" />
                          )}
                        </Button>

                        {/* Action Buttons Row - desktop only, inside relative container */}
                        <div className="hidden lg:flex w-full items-center gap-1 sm:gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleUploadClick}
                            title="Camera"
                            className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <IoCameraOutline className="h-4 w-4" />
                          </Button>
                          
                          {!isOnboarding && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate('/profile')}
                              title="Preferences"
                              className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Heart className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {!isOnboarding && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title="Stores"
                              onClick={() => setIsStoreModalOpen(true)}
                              className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Store className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons Row - mobile only */}
                      <div className="w-full flex lg:hidden items-center gap-1 sm:gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleUploadClick}
                          title="Camera"
                          className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <IoCameraOutline className="h-4 w-4" />
                        </Button>
                        
                        {!isOnboarding && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/profile')}
                            title="Preferences"
                            className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {!isOnboarding && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Stores"
                            onClick={() => setIsStoreModalOpen(true)}
                            className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Store className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </form>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

      {/* List Drawer - Bottom drawer for viewing list and prices */}
      <ListDrawer
        list={selectedList}
        onCheckPrices={handleCheckPrices}
        onSelectStores={() => {
          if (isOnboarding) {
            const sid = useChatStore.getState().currentSession || localStorage.getItem('onboarding-session-id') || '';
            onSignupPrompt?.(sid);
          } else {
            setIsStoreModalOpen(true);
          }
        }}
        onSelectProduct={handleSelectProduct}
        isCheckingPrices={isCheckingPrices}
        inputAreaHeight={inputAreaHeight}
        embedded={embedded}
      />

      {/* Store Selector Dialog */}
      <StoreSelectorDialog
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        onStoresUpdated={async (updatedStores) => {
          // 1. Optimistically update UI and mark as saving
          setSelectedStores(updatedStores);
          setIsSavingStores(true);

          console.log('[ChatPage StoreUpdate] Starting store sync. UI selection:', updatedStores.map(s => ({
            store_name: s.store_name,
            address: s.address,
            hasId: !!s.id,
            lat: s.latitude,
            lon: s.longitude
          })));

          try {
            // 2. Calculate diffs
            const updatedIds = new Set(updatedStores.map(s => s.id).filter(id => id !== undefined));
            const toRemove = selectedStores.filter(s => s.id && !updatedIds.has(s.id));
            const toAdd = updatedStores.filter(s => !s.id);

            console.log('[ChatPage StoreUpdate] Syncing stores:', {
              removing: toRemove.map(s => ({ name: s.store_name, id: s.id })),
              adding: toAdd.map(s => ({ name: s.store_name, address: s.address, lat: s.latitude, lon: s.longitude }))
            });

            // 3. Execute removals
            await Promise.all(toRemove.map(store =>
              store.id ? storeService.removeUserSelectedStore(store.id) : Promise.resolve()
            ));

            // 4. Execute additions
            const addResults = await Promise.all(toAdd.map(store =>
              storeService.addUserSelectedStore({
                store_name: store.store_name,
                address: store.address,
                postal_code: store.postal_code,
                image_url: store.image_url,
                place_id: store.place_id,
                distance: store.distance,
                latitude: store.latitude,
                longitude: store.longitude
              })
            ));
            console.log('[ChatPage StoreUpdate] Add results:', addResults.map(s => ({
              id: s.id,
              store_name: s.store_name,
              address: s.address
            })));

            // 5. Final sync with server
            const finalStores = await storeService.getUserSelectedStores();
            console.log('[ChatPage StoreUpdate] Final stores from server:', finalStores.map(s => ({
              id: s.id,
              store_name: s.store_name,
              address: s.address,
              postal_code: s.postal_code,
              lat: s.latitude,
              lon: s.longitude
            })));
            setSelectedStores(finalStores);
          } catch (err) {
            console.error('[ChatPage StoreUpdate] Failed to sync stores:', err);
            // Revert to server state
            try {
              const reverted = await storeService.getUserSelectedStores();
              setSelectedStores(reverted);
            } catch (e) {
              console.error('[ChatPage StoreUpdate] Critical failure reverting stores', e);
            }
          } finally {
            setIsSavingStores(false);
            console.log('[ChatPage StoreUpdate] Store sync completed');
          }
        }}
        initialSelected={selectedStores}
      />
      </div>
    </div>
  );
}

export default ChatPage;

 