import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  XCircle,
  ArrowRight,
  Heart,
  Store,
  Sparkles,
  Plus,
  Camera,
  Copy,
  Check,
} from "lucide-react";
import useChatStore from "@/stores/chatStore";
import useListStore from "@/stores/listStore";
import { GroceryItem, ChatMessage } from "@/services/chatService";
import authService from "@/services/authService";
import chatService from "@/services/chatService";
import { checkServerHealth } from "@/services/api";
import { SavedGroceryList } from "@/services/groceryListService";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import "@/styles/typing-indicator.css";
import heic2any from "heic2any";
import MarkdownText from "@/components/MarkdownText";
import logger from "@/utils/logger";
import { ListDrawer } from "@/components/chat/ListDrawer";
import { useListChatSync } from "@/hooks/useListChatSync";
import { usePriceCheck } from "@/hooks/usePriceCheck";
import {
  SearchResultInDB,
  GroceryProduct,
  saveProductSelection,
  ProductSelectionCreate,
} from "@/services/shoppingService";
import { StoreSelectorDialog } from "@/components/store-selector/StoreSelectorDialog";
import DietaryPreferencesDialog from "@/components/DietaryPreferencesDialog";
import storeService, { UserSelectedStore } from "@/services/storeService";
import { onboardingChatService } from "@/services/chatService";
import { compressImage } from "@/utils/imageUtils";

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
  if (groceryList.items && Array.isArray(groceryList.items))
    return groceryList.items;
  return [];
};

// Helper function to safely get the grocery list name
const getGroceryListName = (list: any): string => {
  if (!list) return "Your Grocery List";
  if (typeof list === "object" && !Array.isArray(list) && list.name) {
    return list.name;
  }
  return "Your Grocery List";
};

function ChatPage({ embedded = false, onSignupPrompt }: ChatPageProps = {}) {
  const isOnboarding = embedded && !authService.isAuthenticated();
  const {
    messages,
    streamingMessage,
    groceryList,
    isLoading,
    sendMessage,
    hydrated,
  } = useChatStore();
  const { isGenerating, spinnerActive } =
    useChatStore((s) => ({
      isGenerating: s.isGenerating,
      spinnerActive: s.spinnerActive,
    }));
  const [input, setInput] = useState("");
  // Legacy list panel visibility removed (receipt-style list will render inline)
  // const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  // const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for hidden file input
  const chatInitializedRef = useRef<boolean>(false); // Track if chat has been initialized
  const [forceReload, setForceReload] = useState<boolean>(false); // Add state to force reload
  const forceReloadCountRef = useRef<number>(0); // Cap force-reload retries to prevent infinite loops
  const isNewChatRef = useRef<boolean>(false); // Track if we explicitly want a new chat
  const inputAreaRef = useRef<HTMLDivElement>(null); // Ref for input area container
  const [inputAreaHeight, setInputAreaHeight] = useState(64); // Track input area height for drawer positioning
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false); // Store selector modal
  const [isDietaryModalOpen, setIsDietaryModalOpen] = useState(false); // Dietary preferences modal
  const [selectedStores, setSelectedStores] = useState<UserSelectedStore[]>([]); // User's selected stores
  const [_isSavingStores, setIsSavingStores] = useState(false); // Track when stores are being saved (used for race condition prevention)
  const [userName, setUserName] = useState<string>(""); // User's first name for greeting
  const [showToolsMenu, setShowToolsMenu] = useState(false); // For compact mode tools dropdown
  const [copiedBubbleId, setCopiedBubbleId] = useState<string | null>(null);
  const [tappedBubbleId, setTappedBubbleId] = useState<string | null>(null);
  const [displayedStreamingText, setDisplayedStreamingText] = useState("");
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const streamTargetRef = useRef("");


  

  // Listen for mobile header store selector button
  useEffect(() => {
    const handler = () => setIsStoreModalOpen(true);
    window.addEventListener("open-store-selector", handler);
    return () => window.removeEventListener("open-store-selector", handler);
  }, []);

  // State for selected images (multi-image support, max 4)
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagesBase64, setImagesBase64] = useState<
    { base64: string; mediaType: string }[]
  >([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageProcessingProgress, setImageProcessingProgress] = useState(0);
  const [imageProcessingInterval, setImageProcessingInterval] = useState<
    NodeJS.Timeout | undefined
  >(undefined);

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

  // Intro experience logic - only show on brand new chats (just opened, only has welcome message)


// Only show intro if: no selected list, exactly 1 welcome message, no user messages, no list, not loading
const showIntroExperience =
  hydrated &&
  !isLoading &&
  !streamingMessage &&
  messages.length === 1 &&
  !messages[0]?.is_user &&
  !selectedListId;

// Show compact input for any chat that's not the intro experience
const showCompactInput = !showIntroExperience;


  // Get selected list
  const selectedList = selectedListId
    ? lists.find((l) => l.id === selectedListId) || null
    : null;

  // List-chat sync hook (skip in onboarding — uses authenticated endpoints)
  const { resetLoadedListRef } = useListChatSync(isOnboarding);

  // Expose resetLoadedListRef to Layout component via custom event
  useEffect(() => {
    const handler = () => {
      console.log('[ChatPage] Received resetListChatRef event');
      resetLoadedListRef();
    };
    window.addEventListener('resetListChatRef', handler);
    return () => window.removeEventListener('resetListChatRef', handler);
  }, [resetLoadedListRef]);

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

  // Force recalculation of input area height when drawer state or selected list changes
  useEffect(() => {
    const inputArea = inputAreaRef.current;
    if (!inputArea) return;

    // Small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      const height = inputArea.offsetHeight;
      setInputAreaHeight(height);
    }, 50);

    return () => clearTimeout(timer);
  }, [drawerState, selectedListId, showIntroExperience]);

  // Fetch user's selected stores on mount (skip in onboarding mode)
  useEffect(() => {
    if (isOnboarding) return;
    storeService
      .getUserSelectedStores()
      .then(setSelectedStores)
      .catch((e) => {
        console.error("[ChatPage] Failed to fetch selected stores on mount", e);
      });
  }, [isOnboarding]);

  // Fetch user's name for greeting
  useEffect(() => {
    if (isOnboarding) return;
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserName(user.first_name || "");
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, [isOnboarding]);

  // Debug: log only on change (deduped)
  useEffect(() => {
    logger.changed(
      "ChatPage:hydration",
      { hydrated, messagesCount: messages.length, hasList: !!groceryList },
      "info",
    );
  }, [hydrated, messages.length, groceryList]);

  // Check for store hydration and inconsistent state
  // Track whether messages were ever loaded to avoid infinite reload loop
  // when there legitimately are no messages (new user, empty session)
  const hadMessagesRef = useRef(false);
  const prevSelectedListIdRef = useRef(selectedListId);
  useEffect(() => {
    if (messages.length > 0) {
      hadMessagesRef.current = true;
      forceReloadCountRef.current = 0; // Reset retry counter on successful message load
    }
  }, [messages.length]);

  // Reset hadMessagesRef when switching lists — messages being empty is expected during transition
  useEffect(() => {
    if (prevSelectedListIdRef.current !== selectedListId) {
      hadMessagesRef.current = false;
      prevSelectedListIdRef.current = selectedListId;
    }
  }, [selectedListId]);

  useEffect(() => {
    if (
      chatInitializedRef.current &&
      hadMessagesRef.current &&
      messages.length === 0 &&
      !forceReload &&
      forceReloadCountRef.current < 3 // Stop after 3 attempts to prevent infinite loops
    ) {
      console.log(
        "Message state lost after navigation, setting force reload flag",
        `(attempt ${forceReloadCountRef.current + 1}/3)`,
      );
      forceReloadCountRef.current += 1;
      setForceReload(true);
    }
  }, [messages.length, forceReload]);

  // Main initialization effect
  useEffect(() => {
    logger.debug("ChatPage mount/update effect");

    // Check authentication (skip redirect when embedded/onboarding)
    if (!authService.isAuthenticated() && !isOnboarding) {
      logger.info("User not logged in, redirecting to login page");
      navigate("/login");
      return;
    }

    // Set onboarding mode in chat store
    if (isOnboarding) {
      useChatStore.getState().setOnboarding(true);
    } else {
      useChatStore.getState().setOnboarding(false);
    }

    if (!hydrated) {
      logger.debug("Waiting for store hydration to complete...");
      return;
    }

    if (forceReload) {
      logger.info("Force reload flag set, initializing page");
      initializePage();
      setForceReload(false);
      return;
    }

    // Note: Removed aggressive "broken state" reset that was causing data loss.
    // If groceryList has items but messages are empty, let initializePage() handle recovery
    // by fetching from the backend using the stored session ID.

    if (!chatInitializedRef.current) {
      logger.info("First mount - initializing chat");

      if (isNewChatRef.current) {
        logger.info("New chat requested - clearing any hydrated messages");
        isNewChatRef.current = false;
        initializePage();
        chatInitializedRef.current = true;
      } else if (messages.length > 0) {
        logger.info(
          "Chat already hydrated from storage - skipping init",
          messages.length,
        );
        chatInitializedRef.current = true;
      } else {
        logger.info("No messages in hydrated store - initializing from server");
        initializePage();
        chatInitializedRef.current = true;
      }
    } else {
      logger.changed(
        "ChatPage:alreadyInitializedCount",
        { messages: messages.length },
        "debug",
      );
    }

    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: embedded });
    }, 100);
  }, [
    navigate,
    hydrated,
    messages.length,
    groceryList,
    forceReload,
    isOnboarding,
  ]);

  // Check backend connectivity and load chat history
  const initializePage = async () => {
    logger.debug("InitializePage called");

    if (useChatStore.getState().isInitializing) {
      logger.debug("Already initializing, skipping");
      return;
    }

    useChatStore.setState({ isLoading: true, isInitializing: true });

    const safetyTimeout = setTimeout(() => {
      logger.warn("Safety timeout triggered - forcing loading state to false");
      useChatStore.setState({ isLoading: false, isInitializing: false });
    }, 10000);

    try {
      const isHealthy = await checkServerHealth();
      if (!isHealthy) {
        console.error("Backend server is not reachable!");
        useChatStore.setState({
          error: "Can't connect to chat service. Try resetting the app.",
          isLoading: false,
          isInitializing: false,
        });
        clearTimeout(safetyTimeout);
        return;
      }

      const { getUserScopedSessionId, setUserScopedSessionId } =
        await import("@/stores/chatStore");

      // In onboarding mode, use localStorage-based session (no user-scoped)
      let sessionId: string | null = null;
      if (isOnboarding) {
        sessionId = localStorage.getItem("onboarding-session-id");
      } else {
        sessionId = getUserScopedSessionId();
      }

      if (isNewChatRef.current) {
        logger.info(
          "User explicitly requested new chat - not loading any previous sessions",
        );
        sessionId = null;
        isNewChatRef.current = false;
      } else if (!sessionId && !isOnboarding) {
        // Try to recover session from groceryList if it exists (auth required)
        const currentList = useChatStore.getState().groceryList;
        if (currentList?.id && !currentList.id.startsWith("temp-")) {
          logger.info(
            "No session ID but groceryList exists - attempting recovery from list",
            currentList.id,
          );
          try {
            const { apiClient } = await import("@/services/api");
            const response = await apiClient.get(
              `/grocery-lists/${currentList.id}/chat-history`,
            );
            if (response.data?.session_id) {
              sessionId = response.data.session_id;
              setUserScopedSessionId(sessionId);
              useChatStore.setState({ currentSession: sessionId });
              logger.info("Recovered session ID from groceryList:", sessionId);
            }
          } catch (e) {
            logger.warn("Failed to recover session from groceryList:", e);
          }
        }

        if (!sessionId) {
          logger.info(
            "No session ID in localStorage, starting fresh with welcome message",
          );
        }
      }

      if (isOnboarding) {
        // Onboarding: always start fresh with welcome message (no auth to load history)
        logger.info("Onboarding mode - showing welcome message");
        useChatStore.setState({ isLoading: true });
        await showWelcomeMessage();
      } else if (
        sessionId &&
        sessionId.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        )
      ) {
        try {
          await useChatStore.getState().loadSession(sessionId);
          logger.info("Session loaded successfully");
          try {
            const draft = await chatService.getCurrentSessionList(sessionId);
            useChatStore.setState({
              groceryList: {
                id: draft.list?.id || null,
                name: draft.list?.name || "My Grocery List",
                items: draft.items,
              },
            });
          } catch (e) {
            logger.warn("Failed to fetch session draft list:", e);
          }
        } catch (error) {
          console.error("Error loading chat history:", error);
          if (useChatStore.getState().messages.length === 0) {
            logger.info("Failed to load history, showing welcome message");
            useChatStore.setState({ isLoading: true });
            await showWelcomeMessage();
          }
        }
      } else {
        if (useChatStore.getState().messages.length > 0) {
          logger.info("Hydrated messages exist — skipping welcome reset");
          useChatStore.setState({ isLoading: false, isInitializing: false });
          clearTimeout(safetyTimeout);
          return;
        }
        logger.info("No valid session ID found, showing welcome message");
        useChatStore.setState({ isLoading: true });
        const welcome = isOnboarding
          ? await onboardingChatService.getWelcomeMessage()
          : await chatService.getWelcomeMessage();
        if (welcome.session_id && !welcome.session_id.startsWith("error-")) {
          // Store session ID
          if (isOnboarding) {
            localStorage.setItem("onboarding-session-id", welcome.session_id);
          } else {
            const { setUserScopedSessionId } =
              await import("@/stores/chatStore");
            setUserScopedSessionId(welcome.session_id);
          }
          useChatStore.setState({ currentSession: welcome.session_id });
          await useChatStore.getState().loadSession(welcome.session_id);
          try {
            const draft = await chatService.getCurrentSessionList(
              welcome.session_id,
            );
            useChatStore.setState({
              groceryList: {
                id: draft.list?.id || null,
                name: draft.list?.name || "My Grocery List",
                items: draft.items,
              },
            });
          } catch (e) {
            logger.warn(
              "No draft list after welcome (expected for brand-new sessions)",
            );
          }
        } else {
          await showWelcomeMessage();
        }
      }

      clearTimeout(safetyTimeout);
      useChatStore.setState({ isLoading: false, isInitializing: false });
    } catch (error) {
      console.error("Error during page initialization:", error);
      useChatStore.setState({
        isLoading: false,
        isInitializing: false,
        error: "Failed to initialize chat. Please try refreshing the page.",
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
        isLoading: true,
      });

      const { setUserScopedSessionId } = await import("@/stores/chatStore");
      setUserScopedSessionId(null);

      const welcomeResponse = isOnboarding
        ? await onboardingChatService.getWelcomeMessage()
        : await chatService.getWelcomeMessage();

      if (
        welcomeResponse.session_id &&
        !welcomeResponse.session_id.startsWith("error-")
      ) {
        // Store session ID
        if (isOnboarding) {
          localStorage.setItem(
            "onboarding-session-id",
            welcomeResponse.session_id,
          );
        } else {
          const { setUserScopedSessionId } = await import("@/stores/chatStore");
          setUserScopedSessionId(welcomeResponse.session_id);
        }
        useChatStore.setState({ currentSession: welcomeResponse.session_id });

        if (isOnboarding) {
          // For onboarding, just display the welcome content directly (no auth to load history)
          const welcomeMessage: ChatMessage = {
            id: "welcome-message",
            content: welcomeResponse.content,
            is_user: false,
            timestamp: welcomeResponse.timestamp,
          };
          useChatStore.setState({
            messages: [welcomeMessage],
            isLoading: false,
          });
        } else {
          await useChatStore.getState().loadSession(welcomeResponse.session_id);
        }
      } else {
        const welcomeMessage: ChatMessage = {
          id: "welcome-message",
          content: welcomeResponse.content,
          is_user: false,
          timestamp: welcomeResponse.timestamp,
        };

        useChatStore.setState({
          messages: [welcomeMessage],
          isLoading: false,
        });
      }

      logger.info(
        "Welcome message loaded with session:",
        welcomeResponse.session_id,
      );
    } catch (error) {
      console.error("Failed to fetch welcome message, using fallback:", error);
      const welcomeMessage: ChatMessage = {
        id: "welcome-message",
        content:
          "Hi, I'm Savr! You can tell me what meals you're shopping for, or just give me your shopping list.",
        is_user: false,
        timestamp: new Date().toISOString(),
      };

      useChatStore.setState({
        messages: [welcomeMessage],
        isLoading: false,
      });

      logger.info("Fallback welcome message displayed");
    }
  };

  // Scroll to bottom whenever messages change, drawer state changes, or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, drawerState, streamingMessage, isLoading]);

  // Auto-expand drawer on desktop when list is selected
  useEffect(() => {
    if (selectedList && typeof window !== "undefined" && window.innerWidth >= 1280) {
      setDrawerState("expanded");
    }
  }, [selectedList, setDrawerState]);

  const scrollToBottom = () => {
    if (embedded && messagesContainerRef.current) {
      // When embedded, scroll within the container to avoid scrolling the whole page
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Render debug (deduped)
  logger.changed(
    "ChatPage:renderSnapshot",
    {
      isLoading,
      isProcessingImage,
      selectedImages: selectedImages.map((f) => f.name),
      hasImagesBase64: imagesBase64.length,
      inputLength: input.length,
    },
    "debug",
  );
  const sendButtonDisabled =
    isLoading ||
    isProcessingImage ||
    (!input.trim() && selectedImages.length === 0) ||
    (selectedImages.length > 0 && imagesBase64.length < selectedImages.length);
  logger.changed(
    "ChatPage:sendButtonDisabled",
    { disabled: sendButtonDisabled },
    "debug",
  );

  useEffect(() => {
    return () => {
      if (imageProcessingInterval) {
        clearInterval(imageProcessingInterval);
      }
    };
  }, [imageProcessingInterval]);

  // Function to handle file selection (supports multiple files, max 4 total)
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remaining = 4 - selectedImages.length;
    if (remaining <= 0) {
      toast({
        title: "Max Images Reached",
        description: "You can attach up to 4 images per message.",
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      toast({
        title: "Some Images Skipped",
        description: `Only ${remaining} more image(s) can be added (max 4).`,
        variant: "default",
      });
    }

    setIsProcessingImage(true);
    setImageProcessingProgress(0);

    for (const file of filesToProcess) {
      console.log("File selected:", file.name, file.type);
      let processedFile = file;

      if (
        file.type === "image/heic" ||
        file.name.toLowerCase().endsWith(".heic")
      ) {
        try {
          setImageProcessingProgress(10);
          const conversionResult = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.8,
          });
          const convertedBlob = Array.isArray(conversionResult)
            ? conversionResult[0]
            : conversionResult;
          const fileNameWithoutExtension =
            file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
          processedFile = new File(
            [convertedBlob],
            `${fileNameWithoutExtension}.jpg`,
            { type: "image/jpeg" },
          );
          setImageProcessingProgress(50);
        } catch (conversionError: any) {
          if (
            conversionError?.code === 1 &&
            conversionError?.message?.includes(
              "Image is already browser readable",
            )
          ) {
            const readableTypeMatch = conversionError.message.match(
              /readable: (image\/[a-zA-Z]+)/,
            );
            const assumedType = readableTypeMatch?.[1] || "image/jpeg";
            if (!file.type || !file.type.startsWith("image/")) {
              processedFile = new File([file], file.name, {
                type: assumedType,
              });
            }
            setImageProcessingProgress(50);
          } else {
            toast({
              title: "HEIC Conversion Error",
              description: `Could not convert ${file.name}. Skipping.`,
              variant: "destructive",
            });
            continue;
          }
        }
      }

      if (!processedFile.type.startsWith("image/")) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not an image. Skipping.`,
          variant: "destructive",
        });
        continue;
      }

      if (processedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 10MB. Skipping.`,
          variant: "destructive",
        });
        continue;
      }

      try {
        const compressedFile = await compressImage(processedFile);
        console.log(
          "Image compressed:",
          compressedFile.name,
          `(${(compressedFile.size / 1024).toFixed(2)} KB)`,
        );

        // Add to selected images
        setSelectedImages((prev) => [...prev, compressedFile]);

        // Generate preview
        const previewUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(compressedFile);
        });
        setImagePreviews((prev) => [...prev, previewUrl]);

        // Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(compressedFile);
        });
        setImagesBase64((prev) => [
          ...prev,
          { base64, mediaType: compressedFile.type },
        ]);

        setImageProcessingProgress(75);
      } catch (error) {
        console.error("Error processing image:", error);
        toast({
          title: "Processing Error",
          description: `Error processing ${file.name}. Skipping.`,
          variant: "destructive",
        });
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
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagesBase64((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.debug("handleSendMessage triggered");

    if (isLoading || isProcessingImage) {
      logger.debug("handleSendMessage blocked: isLoading or isProcessingImage");
      return;
    }
    if (!input.trim() && selectedImages.length === 0) {
      logger.debug(
        "handleSendMessage blocked: No input and no selected images",
      );
      return;
    }
    if (
      selectedImages.length > 0 &&
      imagesBase64.length < selectedImages.length
    ) {
      logger.debug(
        "handleSendMessage blocked: Images selected but base64 not ready",
      );
      toast({
        title: "Images Still Processing",
        description: "Please wait a moment for the images to be ready.",
        variant: "default",
      });
      return;
    }

    const textToSend = input.trim();
    const imagesToSend = imagesBase64.length > 0 ? imagesBase64 : undefined;

    logger.debug("Proceeding to send message...", {
      textLen: textToSend.length,
      imageCount: imagesToSend?.length || 0,
    });

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

      setInput("");
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
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
        description:
          error?.message ||
          "Could not send message. Image analysis may take longer than expected.",
        variant: "destructive",
      });
    }

    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: embedded });
    }, 50);
  };

  /* Unused handlers - kept for future reference
  const handleClearChat = async () => {
    setIsCreatingNewChat(true);
    try {
      const { setUserScopedSessionId } = await import('@/stores/chatStore');
      setUserScopedSessionId(null);
      localStorage.removeItem('savr-chat-storage');
      useChatStore.getState().clearChat();
      useListStore.getState().selectList(null);
      useListStore.getState().setDrawerState('collapsed');
      await showWelcomeMessage();
    } finally {
      setIsCreatingNewChat(false);
    }
  };

  const handleFullReset = async () => {
    isNewChatRef.current = true;
    const { setUserScopedSessionId } = await import('@/stores/chatStore');
    setUserScopedSessionId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('savr-chat-storage');
    resetChatStore();
    useListStore.getState().selectList(null);
    useListStore.getState().setDrawerState('collapsed');
    await showWelcomeMessage();
  };
  */

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
      const realListId = groceryList.id; // Real ID from backend (if list was saved)
      const tempList: SavedGroceryList = {
        id: realListId || "temp-current-list", // Use real ID to avoid duplication on price check
        name: listName,
        userId: authService.getUserId() || "anonymous",
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        items: getItemsArray(groceryList),
        // Link to current session so useListChatSync knows this is the active chat
        chat_session_id: useChatStore.getState().currentSession || undefined,
      };

      // Add to list store (will update in place due to stable ID)
      addOrUpdateList(tempList);

      // Check if groceryList actually changed (not just a re-render due to other state changes)
      const prevItems = prevGroceryListRef.current
        ? getItemsArray(prevGroceryListRef.current)
        : [];
      const currItems = getItemsArray(groceryList);
      const listActuallyChanged =
        prevItems.length !== currItems.length ||
        JSON.stringify(prevItems) !== JSON.stringify(currItems);

      // Only auto-select temp list if the grocery list content actually changed
      // This prevents overriding user's manual list selection
      if (listActuallyChanged) {
        useListStore.getState().selectList(tempList.id);
        // Auto-open drawer only on desktop split view. On mobile it feels disruptive.
        const isDesktopViewport =
          typeof window !== "undefined" && window.innerWidth >= 1280;
        if (isDesktopViewport) {
          setDrawerState("expanded");
        }
      }

      prevGroceryListRef.current = groceryList;
    }
  }, [groceryList, addOrUpdateList, setDrawerState]);

  // Handle product selection in drawer
  const handleSelectProduct = useCallback(
    async (
      itemName: string,
      product: GroceryProduct | SearchResultInDB,
      storeName: string,
    ) => {
      if (!selectedListId) return;

      // Optimistic local update
      updateSelectionFunctional(
        selectedListId,
        itemName,
        storeName,
        product as SearchResultInDB,
      );
      // Recalculate subtotals after a short delay
      setTimeout(() => {
        calculateStoreSubtotals(selectedListId);
      }, 100);

      // Get session_id from price data for persistence
      const priceData =
        useListStore.getState().listPriceDataMap[selectedListId];
      const sessionId = priceData?.session_id;
      if (!sessionId) {
        // No active search session - can't persist selection
        return;
      }

      // Persist selection to backend
      const isNothingProduct = product.name === "Nothing";
      const selectedProductId = !isNothingProduct
        ? (product as SearchResultInDB).id
        : null;

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
        console.error("Failed to save product selection:", error);
        // Selection is already applied locally - could show toast for error feedback
      }
    },
    [selectedListId, updateSelectionFunctional, calculateStoreSubtotals],
  );

  // Handle check prices — gate behind auth for onboarding users
  const handleCheckPrices = useCallback(() => {
    if (isOnboarding) {
      // Show signup modal instead of running price check
      const sid =
        useChatStore.getState().currentSession ||
        localStorage.getItem("onboarding-session-id") ||
        "";
      onSignupPrompt?.(sid);
      return;
    }
    if (!selectedList) {
      toast({
        title: "No List Selected",
        description: "Please select a list first.",
        variant: "destructive",
      });
      return;
    }
    startPriceCheck(selectedList);
    setDrawerState("expanded");
  }, [
    isOnboarding,
    onSignupPrompt,
    selectedList,
    startPriceCheck,
    setDrawerState,
    toast,
  ]);

  const renderLoadingIndicator = () => {
    // Show when any generation or tool activity is ongoing
    if (!isLoading && !isGenerating && !spinnerActive) return null;
    const loaderText = "Thinking";
    return (
      <div className="flex justify-center py-3.5">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-800/90 px-3.5 py-1.5 shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary/60 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <span
            className="text-xs font-medium text-slate-600 dark:text-slate-300 font-body"
            aria-live="polite">
            {loaderText}
          </span>
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-[bounce_0.75s_ease-in-out_infinite]" />
            <span
              className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-[bounce_0.75s_ease-in-out_infinite]"
              style={{ animationDelay: "120ms" }}
            />
            <span
              className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-[bounce_0.75s_ease-in-out_infinite]"
              style={{ animationDelay: "240ms" }}
            />
          </div>
        </div>
      </div>
    );
  };

  const handleCopyBubbleText = useCallback(
    async (bubbleId: string, content: string) => {
      if (!content?.trim()) return;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(content);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = content;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }

        setCopiedBubbleId(bubbleId);
        if (copyResetTimeoutRef.current) {
          clearTimeout(copyResetTimeoutRef.current);
        }
        copyResetTimeoutRef.current = setTimeout(() => {
          setCopiedBubbleId((curr) => (curr === bubbleId ? null : curr));
        }, 1500);
      } catch (error) {
        console.error("Copy failed:", error);
        toast({
          title: "Copy failed",
          description: "Couldn't copy message text. Please try again.",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  // Smoothly reveal streaming text so token updates don't feel abrupt.
  useEffect(() => {
    streamTargetRef.current = streamingMessage?.content || "";
  }, [streamingMessage?.content]);

  useEffect(() => {
    if (!streamingMessage) {
      streamTargetRef.current = "";
      setDisplayedStreamingText("");
      return;
    }

    const timer = window.setInterval(() => {
      setDisplayedStreamingText((current) => {
        const target = streamTargetRef.current;
        if (!target) return "";
        if (!target.startsWith(current)) {
          return target;
        }
        if (current.length >= target.length) {
          return current;
        }
        const remaining = target.length - current.length;
        const step = remaining > 48 ? 8 : remaining > 20 ? 5 : 3;
        return target.slice(0, current.length + step);
      });
    }, 18);

    return () => {
      window.clearInterval(timer);
    };
  }, [streamingMessage?.id, !!streamingMessage]);

  return (
    <div
      className={cn(
        "w-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden",
        embedded ? "h-full relative" : "h-full relative",
      )}>
      {/* Background with gradient blobs and food doodles from SVG - Only visible in light mode */}
      <div className="pointer-events-none fixed inset-0 z-0 dark:hidden overflow-hidden">
        {/* Gradient blobs */}
        <div
          className="absolute -top-10 -right-10 lg:-left-10 lg:right-auto h-[34vh] w-[34vh] lg:h-[68vh] lg:w-[68vh] rounded-full bg-gradient-to-br from-orange-200/50 via-amber-200/40 to-yellow-200/30 blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute -bottom-10 -left-10 lg:-right-10 lg:left-auto h-[36vh] w-[36vh] lg:h-[72vh] lg:w-[72vh] rounded-full bg-gradient-to-br from-emerald-200/40 via-teal-200/30 to-cyan-200/25 blur-3xl animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[40vh] w-[40vh] rounded-full bg-gradient-to-br from-pink-200/25 via-rose-200/20 to-fuchsia-200/20 blur-3xl animate-pulse"
          style={{ animationDuration: "12s", animationDelay: "4s" }}
        />

        {/* Food doodle pattern from SVG - scrolling horizontally - more visible */}
        <div
          className="absolute inset-0 opacity-100 animate-[scrollHorizontal_50s_linear_infinite]"
          style={{
            backgroundImage: "url(/food-pattern.svg)",
            backgroundSize: "500px 500px",
            backgroundRepeat: "repeat",
            filter:
              "brightness(0) invert(1) drop-shadow(0 0 2px rgba(255,255,255,0.3))",
            width: "200%",
          }}
        />

        <style>{`
          @keyframes scrollHorizontal {
            0% { transform: translateX(0); }
            100% { transform: translateX(-500px); }
          }
        `}</style>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden relative">
        {/* Header - Completely hidden, moved to input area */}

        {/* Desktop: Left Drawer Column */}
        <div
          className={cn(
            "hidden xl:flex xl:flex-shrink-0 overflow-hidden transition-[width,opacity] duration-500 ease-out",
            selectedList && drawerState !== "collapsed"
              ? "xl:w-1/2 opacity-100"
              : "xl:w-0 opacity-0 pointer-events-none",
          )}>
          <div className="w-full p-4 flex items-center justify-center">
            <div className="w-full max-w-2xl xl:translate-x-4">
              {selectedList && drawerState !== "collapsed" && (
                <ListDrawer
                  list={selectedList}
                  onCheckPrices={handleCheckPrices}
                  onSelectStores={() => {
                    if (isOnboarding) {
                      const sid =
                        useChatStore.getState().currentSession ||
                        localStorage.getItem("onboarding-session-id") ||
                        "";
                      onSignupPrompt?.(sid);
                    } else {
                      setIsStoreModalOpen(true);
                    }
                  }}
                  onSelectProduct={handleSelectProduct}
                  isCheckingPrices={isCheckingPrices}
                  inputAreaHeight={0}
                  embedded={true}
                />
              )}
            </div>
          </div>
        </div>

        {/* Blur overlay for mobile/tablet when list is expanded */}
        <div
          className={cn(
            "fixed inset-0 xl:hidden bg-black/60 backdrop-blur-xl transition-all duration-300 z-[30]",
            drawerState === 'expanded' ? "opacity-100 visible" : "opacity-0 invisible"
          )}
        />

        {/* Desktop: Chat Column */}
        <div className={`flex flex-col flex-1 transition-[width] duration-500 ease-out ${
          selectedList && drawerState !== "collapsed" ? "xl:w-1/2" : "xl:w-full"
        }`}>
        
        {/* Messages Container - Fixed on mobile, flex on desktop */}
        <div
          ref={messagesContainerRef}
          className={cn(
            "xl:relative bottom-0 left-0 right-0 xl:flex-1 overflow-y-auto overflow-x-hidden chat-messages hide-scrollbar scrollbar-hide bg-transparent dark:bg-transparent xl:min-h-0 transition-all duration-300 ease-in-out",
            embedded ? "relative flex-1 top-0" : "fixed top-0",
            showIntroExperience ? "flex items-center justify-center" : "",
          )}
          style={{ zIndex: 10 }}>
          <div
            className={cn(
              "w-full mx-auto transition-all duration-500",
              showIntroExperience
  ? "min-h-[calc(100vh-120px)] sm:min-h-full flex flex-col items-center justify-center gap-8 sm:gap-10 pt-[calc(env(safe-area-inset-top)+8rem)] sm:pt-24 pb-10"



                : embedded
                  ? "pt-4 pb-[100px] sm:pb-[116px]"
                  : "pt-[112px] pb-[160px] sm:pb-[180px] xl:pt-20 xl:pb-6",
            )}>
            <div className="w-full flex justify-center px-0">
              <div className={cn(
                "w-full max-w-[calc(100%-2.25rem)] sm:max-w-[82%] transition-[max-width,transform] duration-500 ease-out will-change-transform",
                selectedList && drawerState !== "collapsed" 
                  ? "xl:max-w-[88%] xl:translate-x-4" // Wide + shifted in split mode
                  : "xl:max-w-[68%] xl:translate-x-0" // Normal width when full screen
              )}>
                {/* Intro Experience - Before first user message */}
                {showIntroExperience ? (
                  <div className="w-full flex flex-col items-center justify-center gap-3 sm:gap-5">
                    {/* Greeting Heading */}
                     <div className="w-full flex justify-center">
                      <div className="w-full">
                        <div className="space-y-2 sm:space-y-3 text-left">
                          <p className="text-base sm:text-xl font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            Hello {userName || "there"}
                            <span
                              role="img"
                              aria-label="wave"
                              className="text-2xl sm:text-4xl leading-none inline-block animate-[wave_0.6s_ease-in-out_3]">
                              👋
                            </span>
                          </p>
                          <div
  className="text-[clamp(1.7rem,3.2vw,5rem)] leading-tight text-[#204529] dark:text-white"
  style={{ fontFamily: '"Caprasimo", system-ui, sans-serif' }}
>
  Your ai grocery
  <br />
  <span
    className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2 pb-1"
    style={{ fontFamily: '"Caprasimo", system-ui, sans-serif' }}
  >
    shopping companion.
  </span>
</div>


                          <div className="mt-2 sm:mt-3 lg:mt-6 inline-flex items-center px-3 sm:px-4 py-3 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border-2 border-orange-200 dark:border-slate-600 shadow-sm">
                            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 mr-1.5 sm:mr-2 animate-pulse" />
                            <style>{`
                                    @keyframes wave {
                                      0%, 100% { transform: rotate(0deg); }
                                      10% { transform: rotate(14deg); }
                                      20% { transform: rotate(-8deg); }
                                      30% { transform: rotate(14deg); }
                                      40% { transform: rotate(-4deg); }
                                      50% { transform: rotate(10deg); }
                                      60% { transform: rotate(0deg); }
                                    }
                                  `}</style>
                            <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                              🛒 AI-Powered Canadian Grocery Shopping 🇨🇦
                            </span>
                          </div>
                        </div>
                      </div>
                    </div> 

                    {/* Initial Assistant Message */}
                    <div className="w-full flex justify-center">
                      <div className="w-full">
                        <div className="w-full sm:max-w-[86%] lg:max-w-[72%]">
                          <div className="flex items-center mb-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-2 sm:mr-3 shadow-md">
                              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-white" strokeWidth={2.25} />
                            </div>
                            <span className="text-sm font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-body">
                              Savr Assistant
                            </span>
                          </div>
                          <div className="relative message-bubble bg-slate-100/70 dark:bg-slate-700/70 backdrop-blur-md text-slate-900 dark:text-white rounded-2xl border border-slate-200/80 dark:border-slate-600/80 px-4 sm:px-5 lg:px-6 py-3.5 sm:py-4 text-sm sm:text-[15px] leading-[1.65]">
                            <div className="leading-[1.65]">
                              <MarkdownText
                                text={
                                  messages[0]?.content ||
                                  "Hi, I'm Savr! You can tell me what meals you're shopping for, or just give me your shopping list."
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Intro Input - Below the message */}
                    <div className="w-full pt-1 pb-6 relative z-10">
                      <div className="w-full flex justify-center px-0">
                        <div className="w-full">
                          <div
                            className="w-full rounded-2xl p-[2px] bg-[linear-gradient(135deg,_#ff8a80,_#ffab91,_#EFD3B1,_#ff8a80)]">
                            <div
                              className="w-full rounded-[14px] bg-white px-4 py-3 space-y-3 dark:bg-slate-900 shadow-[0_4px_20px_rgba(32,69,41,0.06)]">
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
                                      disabled={isLoading}>
                                      <XCircle className="h-3 w-3 sm:h-3 sm:w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}

                              <form
                                onSubmit={handleSendMessage}
                                className="flex flex-col gap-2 sm:gap-3">
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  onChange={handleFileChange}
                                  accept="image/jpeg,image/png,image/gif,image/webp,image/heic,.heic"
                                  style={{ display: "none" }}
                                />

                                {/* Textarea and Send Button Row */}
                                <div className="flex items-center gap-3 lg:flex-col lg:gap-3 lg:relative">
                                  {/* Textarea - beside send on mobile, full width on desktop */}
                                  <div className="flex-1 min-w-0 flex items-stretch lg:w-full">
                                    <textarea
                                      ref={inputRef}
                                      value={input}
                                      onChange={(e) => setInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                          e.preventDefault();
                                          if (!sendButtonDisabled) {
                                            handleSendMessage(
                                              e as unknown as React.FormEvent,
                                            );
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
                                      disabled={
                                        isLoading ||
                                        isProcessingImage ||
                                        isGenerating
                                      }
                                      rows={1}
                                      style={{
                                        whiteSpace: input
                                          ? "pre-wrap"
                                          : "nowrap",
                                      }}
                                      className="w-full min-h-[40px] max-h-40 px-0 py-2 rounded-none border border-transparent bg-transparent dark:bg-transparent focus:outline-none focus:ring-0 focus:border-transparent text-sm lg:text-base font-body leading-snug resize-none overflow-hidden placeholder:text-[#a8b5a0] text-[#204529] dark:text-slate-100"
                                    />
                                  </div>

                                  {/* Send button - beside input on mobile, bottom right on desktop */}
                                  <Button
                                    type="submit"
                                    size="icon"
                                    disabled={
                                      !!(
                                        isLoading ||
                                        isProcessingImage ||
                                        isGenerating ||
                                        (!input.trim() &&
                                          selectedImages.length === 0) ||
                                        (selectedImages.length > 0 &&
                                          imagesBase64.length <
                                            selectedImages.length)
                                      )
                                    }
                                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center p-0 rounded-xl text-white transition-all hover:scale-105 disabled:opacity-50 bg-[#71C278] shadow-[0_2px_8px_rgba(113,194,120,0.35)] lg:absolute lg:bottom-0 lg:right-0"
                                    aria-label="Send message">
                                    {isLoading ||
                                    isProcessingImage ||
                                    spinnerActive ? (
                                      <span className="relative inline-flex h-5 w-5 items-center justify-center">
                                        <span className="absolute h-5 w-5 rounded-full border-2 border-white/35" />
                                        <span className="absolute h-5 w-5 rounded-full border-2 border-transparent border-t-white border-r-white animate-[spin_0.65s_linear_infinite]" />
                                        <span className="h-1.5 w-1.5 rounded-full bg-white/95 animate-pulse" />
                                      </span>
                                    ) : (
                                      <ArrowRight size={20} strokeWidth={2.25} />
                                    )}
                                  </Button>

                                  {/* Action Buttons Row - desktop only, inside relative container */}
                                  <div className="hidden lg:flex w-full items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={handleUploadClick}
                                      title="Camera"
                                      className="h-10 w-10 rounded-xl bg-[#f5efe5] dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:opacity-80">
                                      <Camera className="h-5 w-5" strokeWidth={2} />
                                    </Button>

                                    {!isOnboarding && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsDietaryModalOpen(true)}
                                        title="Dietary Preferences"
                                        className="h-10 w-10 rounded-xl bg-[#f5efe5] dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:opacity-80">
                                        <Heart className="h-5 w-5" strokeWidth={2} />
                                      </Button>
                                    )}

                                    {!isOnboarding && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        title="Stores"
                                        onClick={() =>
                                          setIsStoreModalOpen(true)
                                        }
                                        className="h-10 w-10 rounded-xl bg-[#f5efe5] dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:opacity-80">
                                        <Store className="h-5 w-5" strokeWidth={2} />
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Action Buttons Row - mobile only */}
                                <div className="w-full flex lg:hidden items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleUploadClick}
                                    title="Camera"
                                    className="h-10 w-10 rounded-xl bg-[#f5efe5] dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:opacity-80">
                                    <Camera className="h-5 w-5" strokeWidth={2} />
                                  </Button>

                                  {!isOnboarding && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setIsDietaryModalOpen(true)}
                                      title="Dietary Preferences"
                                      className="h-10 w-10 rounded-xl bg-[#f5efe5] dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:opacity-80">
                                      <Heart className="h-5 w-5" strokeWidth={2} />
                                    </Button>
                                  )}

                                  {!isOnboarding && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      title="Stores"
                                      onClick={() => setIsStoreModalOpen(true)}
                                      className="h-10 w-10 rounded-xl bg-[#f5efe5] dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:opacity-80">
                                      <Store className="h-5 w-5" strokeWidth={2} />
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
                  <div
                    className="w-full space-y-6 sm:space-y-7">
                    {/* Normal conversation messages */}
                    {messages.map((message: ChatMessage) => (
                      <div
                        key={message.id}
                        className={`flex ${message.is_user ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[92%] sm:max-w-[86%] lg:max-w-[72%] ${message.is_user ? "order-2" : "order-1"}`}>
                          {/* Avatar */}
                          {!message.is_user && (
                            <div className="flex items-center mb-2">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-2 sm:mr-3 shadow-md">
                                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-white" strokeWidth={2.25} />
                              </div>
                              <span className="text-sm font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-body">
                                Savr Assistant
                              </span>
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div
                            onClick={() => {
                              if (window.innerWidth < 640 && !message.is_user) {
                                setTappedBubbleId((prev) => prev === message.id ? null : message.id);
                              }
                            }}
                            className={`relative message-bubble transition-all duration-200 overflow-hidden ${
                              message.is_user
                                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-none border-0 text-sm sm:text-base leading-[1.5]"
                                : "backdrop-blur-md bg-gradient-to-br from-slate-50/80 via-white/80 to-slate-50/80 dark:from-slate-700/70 dark:via-slate-700/70 dark:to-slate-700/70 text-slate-900 dark:text-white border-2 border-orange-200/60 dark:border-slate-600/80 shadow-sm text-sm sm:text-[15px] leading-[1.65]"
                            } group rounded-2xl px-4 sm:px-5 lg:px-6 py-3.5 sm:py-4`}>
                            {!message.is_user && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyBubbleText(message.id, message.content);
                                }}
                                className={cn(
                                  "absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md border transition-all duration-200 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
                                  tappedBubbleId === message.id ? "opacity-80" : "opacity-0 pointer-events-none sm:pointer-events-auto",
                                  "border-slate-200/80 bg-white/80 text-slate-600 hover:bg-white hover:text-slate-800 dark:border-slate-500/70 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-700",
                                )}
                                aria-label="Copy message text"
                                title="Copy message text">
                                {copiedBubbleId === message.id ? (
                                  <Check className="h-3.5 w-3.5" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                            {/* Message Content */}
                            <div
                              className={cn(
                                "space-y-2.5 sm:space-y-3.5",
                                !message.is_user && "pr-7 sm:pr-8",
                              )}>
                              <MarkdownText text={message.content} />

                              {/* Image Display (multi-image or legacy single) */}
                              {message.images && message.images.length > 0 ? (
                                <div
                                  className={`mt-2 sm:mt-3 grid gap-2 ${message.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                                  {message.images.map((img, idx) => (
                                    <img
                                      key={idx}
                                      src={`data:${img.mediaType};base64,${img.base64}`}
                                      alt={`Uploaded ${idx + 1}`}
                                      className="max-h-48 sm:max-h-64 rounded-lg object-cover w-full"
                                    />
                                  ))}
                                </div>
                              ) : message.imageBase64 &&
                                message.imageMediaType ? (
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
                                  ? "text-primary-foreground/80"
                                  : "text-slate-500 dark:text-slate-400"
                              }`}>
                              {new Date(message.timestamp).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Streaming Message */}
                    {streamingMessage && (
                      <div
                        key={streamingMessage.id}
                        className={`flex justify-start`}>
                        <div
                          className={`max-w-[92%] sm:max-w-[86%] lg:max-w-[72%]`}>
                          {/* Avatar */}
                          <div className="flex items-center mb-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-white" strokeWidth={2.25} />
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 font-body">
                              Savr Assistant
                            </span>
                          </div>

                          {/* Message Bubble */}
                          <div
                            onClick={() => {
                              if (window.innerWidth < 640) {
                                setTappedBubbleId((prev) => prev === `stream-${streamingMessage.id}` ? null : `stream-${streamingMessage.id}`);
                              }
                            }}
                            className={`group relative message-bubble backdrop-blur-md bg-slate-100/70 dark:bg-slate-700/70 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-600/80 rounded-2xl px-4 sm:px-5 lg:px-6 py-3.5 sm:py-4 overflow-hidden text-sm sm:text-[15px] leading-[1.65]`}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyBubbleText(
                                  `stream-${streamingMessage.id}`,
                                  streamingMessage.content,
                                );
                              }}
                              className={cn(
                                "absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200/80 bg-white/80 text-slate-600 transition-all duration-200 hover:bg-white hover:text-slate-800 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 dark:border-slate-500/70 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-700",
                                tappedBubbleId === `stream-${streamingMessage.id}` ? "opacity-80" : "opacity-0 pointer-events-none sm:pointer-events-auto",
                              )}
                              aria-label="Copy message text"
                              title="Copy message text">
                              {copiedBubbleId === `stream-${streamingMessage.id}` ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            {/* Message Content */}
                            <div
                              className="pr-7 sm:pr-8 space-y-2.5 sm:space-y-3.5 animate-stream-text-in">
                              <MarkdownText
                                text={
                                  displayedStreamingText ||
                                  streamingMessage.content
                                }
                              />

                              {/* Image Display */}
                              {streamingMessage.imageBase64 &&
                                streamingMessage.imageMediaType && (
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
                              className={`text-xs mt-2 sm:mt-3 text-slate-500 dark:text-slate-400`}>
                              {new Date(
                                streamingMessage.timestamp,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
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
              "bottom-0 left-0 right-0 xl:left-auto xl:right-auto pt-0 pb-4 xl:py-4 bg-white dark:bg-slate-900 xl:bg-transparent xl:dark:bg-transparent xl:shrink-0 z-[55]",
              embedded ? "sticky" : "fixed xl:sticky",
            )}>
            <div className="w-full flex px-0 justify-center">
              <div className={cn(
                "w-full max-w-[calc(100%-2.25rem)] sm:max-w-[82%] transition-[max-width,transform] duration-500 ease-out will-change-transform",
                selectedList && drawerState !== "collapsed" 
                  ? "xl:max-w-[88%] xl:translate-x-4" // Wide + shifted in split mode
                  : "xl:max-w-[68%] xl:translate-x-0" // Normal width when full screen
              )}>
                <div
                  className="w-full rounded-2xl p-[2px] bg-[linear-gradient(135deg,_#ff8a80,_#ffab91,_#EFD3B1,_#ff8a80)]">
                  <div className={cn(
                    "w-full rounded-[14px] bg-white transition-all duration-200 dark:bg-slate-900 shadow-[0_4px_20px_rgba(32,69,41,0.06)]",
                    showCompactInput 
                      ? "px-4 py-3"
                      : "px-4 sm:px-6 py-4", // Normal padding
                    showCompactInput ? "" : "space-y-4" // No space-y in compact mode
                  )}>
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
                                disabled={isLoading}>
                                <XCircle className="h-3 w-3 sm:h-3 sm:w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Input Form */}
                    <form
                      onSubmit={handleSendMessage}
                      className={cn(
                        showCompactInput 
                          ? "flex flex-col gap-3"
                          : "flex flex-col gap-2 sm:gap-3" // Normal spacing
                      )}>
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/jpeg,image/png,image/gif,image/webp,image/heic,.heic"
                        multiple
                        style={{ display: "none" }}
                      />

                      {/* Textarea and Send Button Row */}
                      <div className={cn(
                        showCompactInput
                          ? "flex items-center gap-3 lg:flex-row lg:gap-3 lg:relative"
                          : "flex items-end gap-2 lg:flex-col lg:gap-3 lg:relative" // Normal: items-end
                      )}>
                        {/* Tools Menu Button - Compact Mode Only (Mobile) - Left side */}
                        {showCompactInput && (
                          <DropdownMenu open={showToolsMenu} onOpenChange={setShowToolsMenu}>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors hover:opacity-80 text-[#204529] dark:text-slate-200 bg-[#f5efe5] dark:bg-slate-800">
                                <Plus className="h-5 w-5" strokeWidth={2.5} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              className="w-64 z-[70] rounded-xl border border-slate-200/80 dark:border-slate-700/70 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-xl p-2"
                            >
                              <DropdownMenuItem
                                onClick={handleUploadClick}
                                className="cursor-pointer rounded-lg px-3 py-2.5"
                              >
                                <Camera className="h-6 w-6 mr-3" strokeWidth={2.25} />
                                Camera
                              </DropdownMenuItem>
                              {!isOnboarding && (
                                <DropdownMenuItem
                                  onClick={() => setIsDietaryModalOpen(true)}
                                  className="cursor-pointer rounded-lg px-3 py-2.5"
                                >
                                  <Heart className="h-6 w-6 mr-3" strokeWidth={2.25} />
                                  <span className="whitespace-nowrap">Dietary Preferences</span>
                                </DropdownMenuItem>
                              )}
                              {!isOnboarding && (
                                <DropdownMenuItem
                                  onClick={() => setIsStoreModalOpen(true)}
                                  className="cursor-pointer rounded-lg px-3 py-2.5"
                                >
                                  <Store className="h-6 w-6 mr-3" strokeWidth={2.25} />
                                  Stores
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}

                        {/* Textarea - beside send on mobile, full width on desktop */}
                        <div className="flex-1 min-w-0 flex items-stretch lg:w-full">
                          <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                if (!sendButtonDisabled) {
                                  handleSendMessage(
                                    e as unknown as React.FormEvent,
                                  );
                                }
                              }
                            }}
                            placeholder={
                              isLoading && imageProcessingProgress > 0
                                ? "Analyzing your image..."
                                : selectedImages.length > 0
                                  ? `Add a description for ${selectedImages.length > 1 ? "the images" : "the image"}...`
                                  : "Ask anything..."
                            }
                            disabled={
                              isLoading || isProcessingImage || isGenerating
                            }
                            rows={1}
                            style={{
                              whiteSpace: input ? "pre-wrap" : "nowrap",
                            }}
                            className={cn(
                              "w-full border border-transparent bg-transparent dark:bg-transparent focus:outline-none focus:ring-0 focus:border-transparent font-body resize-none overflow-hidden placeholder:text-[#a8b5a0] text-[#204529] dark:text-slate-100",
                              showCompactInput
                                ? "min-h-[40px] max-h-40 px-0 py-2 text-sm lg:text-base leading-snug rounded-none"
                                : "min-h-[36px] sm:min-h-[44px] max-h-40 px-3.5 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base leading-relaxed rounded-2xl" // Normal
                            )}
                          />
                        </div>

                        {/* Send button - beside input on mobile, bottom right on desktop */}
                        <Button
                          type="submit"
                          size="icon"
                          disabled={
                            !!(
                              isLoading ||
                              isProcessingImage ||
                              isGenerating ||
                              (!input.trim() && selectedImages.length === 0) ||
                              (selectedImages.length > 0 &&
                                imagesBase64.length < selectedImages.length)
                            )
                          }
                          className={cn(
                            "flex flex-shrink-0 items-center justify-center p-0 rounded-xl text-white transition-all hover:scale-105 disabled:opacity-50 bg-[#71C278] shadow-[0_2px_8px_rgba(113,194,120,0.35)]",
                            "h-10 w-10",
                            !showCompactInput && "lg:absolute lg:bottom-0 lg:right-0",
                          )}
                          aria-label="Send message">
                          {/* Keep markup, but match hero styling (no sparkle overlay). */}
                          {!showCompactInput && (
                            <div className="hidden absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                          )}
                          {isLoading || isProcessingImage || spinnerActive ? (
                            <span className="relative inline-flex h-5 w-5 items-center justify-center">
                              <span className="absolute h-5 w-5 rounded-full border-2 border-white/35" />
                              <span className="absolute h-5 w-5 rounded-full border-2 border-transparent border-t-white border-r-white animate-[spin_0.65s_linear_infinite]" />
                              <span className="h-1.5 w-1.5 rounded-full bg-white/95 animate-pulse" />
                            </span>
                          ) : (
                            showCompactInput ? (
                              <ArrowRight
                                className="group-hover:translate-x-0.5"
                                size={20}
                                strokeWidth={2.25}
                              />
                            ) : (
                              <ArrowRight className="group-hover:translate-x-0.5 h-5 w-5" />
                            )
                          )}
                        </Button>

                        {/* Action Buttons Row - desktop only, inside relative container */}
                        <div className={cn("hidden lg:flex w-full items-center gap-1 sm:gap-2", showCompactInput && "lg:hidden")}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleUploadClick}
                            title="Camera"
                            className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-400 hover:bg-gradient-to-br hover:from-blue-100 hover:to-cyan-100 hover:text-blue-600 dark:hover:bg-slate-800 transition-all hover:scale-110 hover:rotate-12">
                            <Camera className="h-5 w-5" strokeWidth={2.5} />
                          </Button>

                          {!isOnboarding && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setIsDietaryModalOpen(true)}
                              title="Dietary Preferences"
                              className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-400 hover:bg-gradient-to-br hover:from-pink-100 hover:to-rose-100 hover:text-pink-600 dark:hover:bg-slate-800 transition-all hover:scale-110 hover:-rotate-6">
                              <Heart className="h-5 w-5" strokeWidth={2.5} />
                            </Button>
                          )}

                          {!isOnboarding && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title="Stores"
                              onClick={() => setIsStoreModalOpen(true)}
                              className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-400 hover:bg-gradient-to-br hover:from-purple-100 hover:to-fuchsia-100 hover:text-purple-600 dark:hover:bg-slate-800 transition-all hover:scale-110 hover:rotate-6">
                              <Store className="h-5 w-5" strokeWidth={2.5} />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons Row - mobile only (hidden in compact mode) */}
                      {!showCompactInput && (
                        <div className="w-full flex lg:hidden items-center gap-1 sm:gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleUploadClick}
                          title="Camera"
                          className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-400 hover:bg-gradient-to-br hover:from-blue-100 hover:to-cyan-100 hover:text-blue-600 dark:hover:bg-slate-800 transition-all hover:scale-110 hover:rotate-12">
                          <Camera className="h-5 w-5" strokeWidth={2.5} />
                        </Button>

                            {!isOnboarding && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsDietaryModalOpen(true)}
                                title="Dietary Preferences"
                                className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-400 hover:bg-gradient-to-br hover:from-pink-100 hover:to-rose-100 hover:text-pink-600 dark:hover:bg-slate-800 transition-all hover:scale-110 hover:-rotate-6">
                                <Heart className="h-5 w-5" strokeWidth={2.5} />
                              </Button>
                            )}

                        {!isOnboarding && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Stores"
                            onClick={() => setIsStoreModalOpen(true)}
                            className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Store className="h-5 w-5" strokeWidth={2.5} />
                          </Button>
                        )}
                      </div>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        </div> {/* End Desktop Chat Column */}

        {/* Mobile List Drawer - Only show when there's a selected list */}
        {selectedList && (
          <div className="xl:hidden">
            <ListDrawer
            list={selectedList}
            onCheckPrices={handleCheckPrices}
            onSelectStores={() => {
              if (isOnboarding) {
                const sid =
                  useChatStore.getState().currentSession ||
                  localStorage.getItem("onboarding-session-id") ||
                  "";
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
          </div>
        )}

        {/* Store Selector Dialog */}
        <StoreSelectorDialog
          isOpen={isStoreModalOpen}
          onClose={() => setIsStoreModalOpen(false)}
          onStoresUpdated={async (updatedStores) => {
            // 1. Optimistically update UI and mark as saving
            setSelectedStores(updatedStores);
            setIsSavingStores(true);

            console.log(
              "[ChatPage StoreUpdate] Starting store sync. UI selection:",
              updatedStores.map((s) => ({
                store_name: s.store_name,
                address: s.address,
                hasId: !!s.id,
                lat: s.latitude,
                lon: s.longitude,
              })),
            );

            try {
              // 2. Calculate diffs
              const updatedIds = new Set(
                updatedStores.map((s) => s.id).filter((id) => id !== undefined),
              );
              const toRemove = selectedStores.filter(
                (s) => s.id && !updatedIds.has(s.id),
              );
              const toAdd = updatedStores.filter((s) => !s.id);

              console.log("[ChatPage StoreUpdate] Syncing stores:", {
                removing: toRemove.map((s) => ({
                  name: s.store_name,
                  id: s.id,
                })),
                adding: toAdd.map((s) => ({
                  name: s.store_name,
                  address: s.address,
                  lat: s.latitude,
                  lon: s.longitude,
                })),
              });

              // 3. Execute removals
              await Promise.all(
                toRemove.map((store) =>
                  store.id
                    ? storeService.removeUserSelectedStore(store.id)
                    : Promise.resolve(),
                ),
              );

              // 4. Execute additions
              const addResults = await Promise.all(
                toAdd.map((store) =>
                  storeService.addUserSelectedStore({
                    store_name: store.store_name,
                    address: store.address,
                    postal_code: store.postal_code,
                    image_url: store.image_url,
                    place_id: store.place_id,
                    distance: store.distance,
                    latitude: store.latitude,
                    longitude: store.longitude,
                  }),
                ),
              );
              console.log(
                "[ChatPage StoreUpdate] Add results:",
                addResults.map((s) => ({
                  id: s.id,
                  store_name: s.store_name,
                  address: s.address,
                })),
              );

              // 5. Final sync with server
              const finalStores = await storeService.getUserSelectedStores();
              console.log(
                "[ChatPage StoreUpdate] Final stores from server:",
                finalStores.map((s) => ({
                  id: s.id,
                  store_name: s.store_name,
                  address: s.address,
                  postal_code: s.postal_code,
                  lat: s.latitude,
                  lon: s.longitude,
                })),
              );
              setSelectedStores(finalStores);
            } catch (err) {
              console.error(
                "[ChatPage StoreUpdate] Failed to sync stores:",
                err,
              );
              // Revert to server state
              try {
                const reverted = await storeService.getUserSelectedStores();
                setSelectedStores(reverted);
              } catch (e) {
                console.error(
                  "[ChatPage StoreUpdate] Critical failure reverting stores",
                  e,
                );
              }
            } finally {
              setIsSavingStores(false);
              console.log("[ChatPage StoreUpdate] Store sync completed");
            }
          }}
          initialSelected={selectedStores}
        />

        {/* Dietary Preferences Dialog */}
        {!isOnboarding && (
          <DietaryPreferencesDialog
            isOpen={isDietaryModalOpen}
            onClose={() => setIsDietaryModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

export default ChatPage;
