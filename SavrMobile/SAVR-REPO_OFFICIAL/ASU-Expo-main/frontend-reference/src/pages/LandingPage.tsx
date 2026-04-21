import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Heart,
  Sparkles,
  ArrowRight,
  X,
  Loader2,
  XCircle,
  MapPin,
  TrendingDown,
  ScanLine,
  Share2,
  BarChart3,
} from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { BsArrowUpCircleFill } from "react-icons/bs";
import { LuCamera } from "react-icons/lu";
import { IoChatboxOutline } from "react-icons/io5";
import OnboardingSignupModal from "@/components/OnboardingSignupModal";
import useChatStore from "@/stores/chatStore";
import useListStore from "@/stores/listStore";
import { onboardingChatService, ChatMessage, GroceryItem } from "@/services/chatService";
import { SearchResultInDB, GroceryProduct } from "@/services/shoppingService";
import { SavedGroceryList } from "@/services/groceryListService";
import MarkdownText from "@/components/MarkdownText";
import { ListDrawer } from "@/components/chat/ListDrawer";
import { compressImage } from "@/utils/imageUtils";
import { useToast } from "@/components/ui/use-toast";
import heic2any from "heic2any";

const SUGGESTION_CONTAINERS = [
  // Container 1: Add Items to Grocery List
  [
    "Add eggs, milk, and bread to my list",
    "I just ran out of olive oil, add that",
    "Add chicken breast, garlic, and onions to my list",
    "Put coffee and filters on my grocery list",
    "Add pasta, tomato sauce, and parmesan",
    "I need bananas, spinach, and greek yogurt added",
    "Add ground beef and taco seasoning to my list",
    "Put avocados, limes, and cilantro on there",
    "Add rice, soy sauce, and sesame oil",
    "I need butter, flour, and sugar added to my list",
    "Add bell peppers, mushrooms, and zucchini",
    "Put salmon, lemon, and dill on my list",
    "Add almonds, honey, and oats",
    "I need cheddar cheese and crackers on there",
    "eggs, milk, bread, butter",
    "Add potatoes, carrots, and celery to my list",
    "Put tortillas, black beans, and salsa on there",
    "I need coconut milk, curry paste, and basil added",
    "Add bacon, lettuce, and tomatoes",
    "Put quinoa, chickpeas, and feta on my list",
    "Add shrimp, ginger, and scallions",
    "I need peanut butter, jelly, and whole wheat bread",
    "Add mozzarella, basil, and balsamic vinegar",
    "Put ground turkey, sweet potatoes, and kale on there",
    "I need heavy cream, vanilla extract, and chocolate chips",
  ],
  // Container 2: Specific Meal Ideas
  [
    "Walk me through how to make a classic lasagna.",
    "I want to try cooking Ethiopian food this week. Any suggestions?",
    "Plan a dinner around ground beef.",
    "Surprise me with a unique dinner recipe I might not have tried before!",
    "Build a grocery list for a chicken stir-fry recipe.",
    "What ingredients do I need for a good chicken curry?",
    "I want to make chicken parmesan tonight",
    "How do I make homemade tacos?",
    "I'm craving pad thai",
    "Show me how to make beef stroganoff",
    "I want to try making sushi at home",
    "Help me make a proper French onion soup",
    "I need a recipe for shepherd's pie",
    "How do I make authentic carbonara?",
    "I want to make butter chicken",
    "Show me how to make a good risotto",
    "I'm in the mood for fajitas",
    "Help me make chicken tikka masala",
    "I want to try making ramen from scratch",
    "How do I make beef Wellington?",
    "I want to make chicken enchiladas",
    "Show me how to make shrimp scampi",
    "I'm craving meatloaf and mashed potatoes",
    "Help me make homemade mac and cheese",
    "I want to try making paella",
    "How do I make a classic pot roast?",
    "Show me how to make fish tacos",
    "I want to make teriyaki salmon",
    "Help me make pulled pork sliders",
    "I'm in the mood for chicken and waffles",
  ],
  // Container 3: Dietary & Themed Requests
  [
    "Plan a week of vegetarian dinners for me.",
    "Suggest some quick and healthy breakfast ideas.",
    "Give me some high-protein meal ideas for lunch.",
    "I need ideas for kids' school lunches that are easy to pack.",
    "What are some good budget-friendly dinner recipes for a family of four?",
    "I want to meal prep on Sunday so I'm set for the whole week. What should I make?",
    "I need low-carb dinner ideas",
    "What are some good vegan breakfast options?",
    "Give me keto-friendly meal prep recipes",
    "I'm looking for gluten-free pasta alternatives",
    "What are some paleo dinner ideas?",
    "I need dairy-free dessert recipes",
    "Suggest some Mediterranean diet meals",
    "I need high-fiber meal ideas",
    "Give me some anti-inflammatory recipes",
    "What are good low-sodium dinner options?",
    "I need plant-based protein meal ideas",
    "Suggest some diabetic-friendly meals",
    "What are good iron-rich recipes for anemia?",
    "I need pescatarian dinner ideas for the week",
    "What are some gut-healthy probiotic-rich meals?",
    "Give me heart-healthy dinner recipes",
    "I need quick 30-minute weeknight dinners",
    "What are some good make-ahead freezer meals?",
    "Suggest some one-pot meals for easy cleanup",
    "I need budget-friendly vegetarian protein sources",
    "What are some good post-workout recovery meals?",
    "Give me kid-friendly hidden veggie recipes",
    "I need lactose-free breakfast ideas",
  ],
  // Container 4: Funny/Humorous
  [
    "I need a meal that screams, \"I'm an adult who successfully remembered to buy groceries this week!\"",
    "Help me plan a \"revenge dinner\" for my picky taste buds – something shockingly delicious they can't resist!",
    "I'm hosting a \"Pajama Party Brunch for Grown-Ups.\" What should be on the menu to maximize comfort and mimosa potential?",
    "My inner child is demanding pizza, but my adult self wants vegetables. Can you broker a delicious compromise?",
    "My pantry is currently a black hole. Fill my list with essentials for emerging from the void and cooking actual food.",
    "My cat just gave me \"the look\" – I think it means we need more tuna. Add it to the list!",
    "My significant other just said \"we're out of EVERYTHING.\" Translate that into a comprehensive grocery list, please.",
    "I need a grocery list for surviving a zombie apocalypse… but with delicious snacks, obviously.",
    "I accidentally ate a ghost pepper. Now I need soothing, non-spicy meal ideas for a week of gentle recovery.",
    "My doctor said \"eat more greens.\" Make it sound exciting, Savr. Really exciting.",
    "My spouse claims we have \"nothing to eat\" but I see a full fridge. Prove them wrong with dinner ideas!",
    "My kids staged a protest against vegetables. I need sneaky recipes to end this rebellion.",
    "My mother-in-law is visiting and I need to look like I know what I'm doing in the kitchen.",
    "My roommate ate all my snacks again. Add revenge snacks to my list that I can hide better.",
    "My toddler has rejected every meal for 3 days straight. Send help and recipes.",
    "My partner keeps \"forgetting\" it's their turn to cook. Give me a meal so easy they have no excuses.",
    "My teenager said my cooking is \"mid.\" I need a comeback dinner that slaps.",
    "My dog is judging my leftovers situation. Help me restore my dignity with a proper meal.",
    "My neighbor keeps bragging about their sourdough. I need a show-off recipe to reclaim my dignity.",
    "My ex is coming to pick up their stuff. I need to be cooking something that smells AMAZING.",
    "My houseplants are thriving but I can't keep produce alive. Help me meal plan before everything wilts.",
    "My gym buddy keeps meal prepping perfectly. I need to fake competence. What should I make?",
    "I promised homemade dinner but ordered takeout 4 nights in a row. Time to actually deliver.",
    "My dad said \"back in my day we ate everything.\" Challenge accepted. Give me an impossible-to-hate recipe.",
    "I bought an air fryer to look cool. Now I need to actually use it before someone notices.",
    "My coworkers keep bringing impressive lunches. I need to end this arms race with one killer meal.",
    "I told everyone I'm \"really into cooking now.\" Quick, give me something that backs up this lie.",
    "My brother bet me I couldn't cook a fancy meal. What's my winning move?",
  ],
  // Container 5: Upload Photo (any type)
  [
    "Here's my handwritten grocery list – can you add these items?",
    "Here's what's in my fridge – what can I make?",
    "Take a look at my pantry and tell me what I'm missing",
    "Here's a picture of a meal I want to make – what do I need?",
    "I saw this recipe in a cookbook – can you help me make it?",
    "What can I cook with what's in my fridge right now?",
    "Based on this pantry photo, what groceries should I buy?",
    "I found this recipe card – can you recreate it for me?",
    "Here's a photo of my produce drawer – what's about to go bad?",
    "This is what's left in my pantry after the kids raided it",
    "I took a pic of the ingredients I have – what can I make?",
    "Here's a recipe from my grandmother's cookbook",
    "Can you read this handwritten recipe and add the ingredients to my list?",
    "What's missing from my spice rack? Here's a photo",
    "I screenshotted a recipe from Instagram – help me make it",
    "Here's what survived in my fridge this week",
    "Can you organize this messy grocery list I scribbled down?",
    "I took a photo of the menu at a restaurant – can you help me recreate this dish?",
    "Here's my freezer inventory – what meal ideas do you have?",
    "Can you tell me what these ingredients are? I forgot to label them",
    "Here's a photo of my leftover containers – help me plan meals around them",
    "I found this old family recipe card – can you decode the handwriting?",
    "Here's what's in my meal prep containers – what should I make next batch?",
    "Can you read the ingredients list on this package? The print is tiny",
    "Here's my farmers market haul – what should I cook this week?",
    "I took a picture of a recipe on my friend's fridge – help me make it",
    "Here's my current grocery haul – did I forget anything important?",
  ],
];

function pickRandomSuggestions(): string[] {
  return SUGGESTION_CONTAINERS.map(
    (container) => container[Math.floor(Math.random() * container.length)]
  );
}

const LandingPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [onboardingSessionId, setOnboardingSessionId] = useState("");

  // Chat transition states
  const [chatActive, setChatActive] = useState(false);
  const [chatTransitioning, setChatTransitioning] = useState(false); // true during open/close animation
  const [chatVisible, setChatVisible] = useState(false); // controls CSS class for the animated state

  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [displayedSuggestions, setDisplayedSuggestions] = useState<string[]>(() => pickRandomSuggestions());
  const [chatInitialized, setChatInitialized] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pendingMessageRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Scroll progress and parallax
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  // Scroll animations for below-fold sections - using Intersection Observer
  const howItWorksAnim = useScrollAnimation({ threshold: 0.15, rootMargin: "0px 0px -50px 0px" });
  const featuresAnim = useScrollAnimation({ threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
  const statsAnim = useScrollAnimation({ threshold: 0.2, rootMargin: "0px 0px -30px 0px" });
  const ctaAnim = useScrollAnimation({ threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const { messages, streamingMessage, isLoading, sendMessage, groceryList, clearChat } = useChatStore();
  const {
    drawerState,
    setDrawerState,
    selectedListId,
    lists,
    addOrUpdateList,
    updateSelectionFunctional,
    calculateStoreSubtotals,
  } = useListStore();

  const selectedList = selectedListId
    ? lists.find((l) => l.id === selectedListId) || null
    : null;

  const inputBarRef = useRef<HTMLDivElement>(null);
  const [inputAreaHeight, setInputAreaHeight] = useState(64);
  const prevGroceryListRef = useRef<typeof groceryList>(null);

  const getItemsArray = (gl: any): GroceryItem[] => {
    if (!gl) return [];
    if (Array.isArray(gl)) return gl;
    if (gl.items && Array.isArray(gl.items)) return gl.items;
    return [];
  };

  const getGroceryListName = (gl: any): string => {
    if (!gl) return "Your Grocery List";
    if (typeof gl === "object" && !Array.isArray(gl) && gl.name) return gl.name;
    return "Your Grocery List";
  };

  // Sync groceryList from chat store → list store
  useEffect(() => {
    if (!chatActive) return;
    if (groceryList && getItemsArray(groceryList).length > 0) {
      const listName = getGroceryListName(groceryList);
      const realListId = groceryList.id;
      const tempList: SavedGroceryList = {
        id: realListId || "temp-current-list",
        name: listName,
        userId: "anonymous",
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        items: getItemsArray(groceryList),
        chat_session_id: useChatStore.getState().currentSession || undefined,
      };
      addOrUpdateList(tempList);
      const prevItems = prevGroceryListRef.current ? getItemsArray(prevGroceryListRef.current) : [];
      const currItems = getItemsArray(groceryList);
      const listActuallyChanged =
        prevItems.length !== currItems.length ||
        JSON.stringify(prevItems) !== JSON.stringify(currItems);
      if (listActuallyChanged) {
        useListStore.getState().selectList(tempList.id);
        if (useListStore.getState().drawerState === "collapsed") {
          setDrawerState("peek");
        }
      }
      prevGroceryListRef.current = groceryList;
    }
  }, [groceryList, chatActive, addOrUpdateList, setDrawerState]);

  // Track input bar height for drawer positioning
  useEffect(() => {
    if (!chatActive || !inputBarRef.current) return;
    const el = inputBarRef.current;
    const update = () => setInputAreaHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [chatActive]);

  const handleSelectProduct = useCallback(
    (itemName: string, product: GroceryProduct | SearchResultInDB, storeName: string) => {
      if (!selectedListId) return;
      updateSelectionFunctional(selectedListId, itemName, storeName, product as SearchResultInDB);
      setTimeout(() => calculateStoreSubtotals(selectedListId), 100);
    },
    [selectedListId, updateSelectionFunctional, calculateStoreSubtotals]
  );

  const handleCheckPrices = useCallback(() => {
    const sid = useChatStore.getState().currentSession || localStorage.getItem("onboarding-session-id") || "";
    setOnboardingSessionId(sid);
    setShowSignupModal(true);
  }, []);

  const preloadPage = (path: string) => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = path;
    document.head.appendChild(link);
    if (path === "/login") import("../pages/LoginPage");
    else if (path === "/signup") import("../pages/SignupPage");
  };

  const handleNavigation = (path: string) => {
    setIsNavigating(true);
    setTimeout(() => navigate(path), 800);
  };

  // Initialize onboarding chat session
  const initChat = useCallback(async () => {
    if (chatInitialized) return;
    setChatInitialized(true);
    useChatStore.getState().setOnboarding(true);
    try {
      const welcome = await onboardingChatService.getWelcomeMessage();
      if (welcome.session_id && !welcome.session_id.startsWith("error-")) {
        localStorage.setItem("onboarding-session-id", welcome.session_id);
        useChatStore.setState({ currentSession: welcome.session_id });
      }
      const welcomeMsg: ChatMessage = {
        id: `assistant-welcome-${Date.now()}`,
        content: welcome.content,
        is_user: false,
        timestamp: welcome.timestamp || new Date().toISOString(),
        imageBase64: null,
        imageMediaType: null,
      };
      useChatStore.setState((state) => ({
        messages: [...state.messages, welcomeMsg],
        isLoading: false,
      }));
    } catch {
      const fallback: ChatMessage = {
        id: `assistant-fallback-${Date.now()}`,
        content: "Hey there! I'm Savr, your grocery shopping sidekick. Tell me what you're cooking this week and I'll build your list!",
        is_user: false,
        timestamp: new Date().toISOString(),
        imageBase64: null,
        imageMediaType: null,
      };
      useChatStore.setState((state) => ({
        messages: [...state.messages, fallback],
        isLoading: false,
      }));
    }
    if (pendingMessageRef.current) {
      const msg = pendingMessageRef.current;
      pendingMessageRef.current = null;
      setTimeout(() => sendMessage(msg), 300);
    }
  }, [chatInitialized, sendMessage]);

  // Activate chat with animated transition
  const activateChat = (message?: string) => {
    setShowSuggestions(false);
    if (message) pendingMessageRef.current = message;

    // Start transition: mark active, begin animating
    setChatActive(true);
    setChatTransitioning(true);

    // After a frame, trigger the CSS transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setChatVisible(true);
        // End transition flag after animation completes
        setTimeout(() => setChatTransitioning(false), 600);
      });
    });
  };

  // Close chat with reverse animation — wipe session so next open is fresh
  const closeChat = () => {
    setChatTransitioning(true);
    setChatVisible(false);

    // After animation, tear down chat layer and reset all chat state
    setTimeout(() => {
      setChatActive(false);
      setChatTransitioning(false);
      setChatInitialized(false);
      clearChat();
      localStorage.removeItem("onboarding-session-id");
      // Reset list store state tied to this session
      useListStore.getState().selectList(null);
      setDrawerState("collapsed");
      prevGroceryListRef.current = null;
    }, 600);
  };

  const clearSelectedImage = useCallback(() => {
    setSelectedImage(null);
    setImageBase64(null);
    setImagePreviewUrl(null);
    setIsProcessingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const convertToBase64 = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(",")[1];
      setImageBase64(base64String);
      setIsProcessingImage(false);
    };
    reader.onerror = () => {
      toast({ title: "Error Reading File", description: "Could not process the selected image.", variant: "destructive" });
      clearSelectedImage();
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // If chat isn't active yet, activate it first
    if (!chatActive) activateChat();

    setIsProcessingImage(true);
    let processedFile = file;

    if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
      try {
        const conversionResult = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
        const convertedBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
        const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
        processedFile = new File([convertedBlob], `${baseName}.jpg`, { type: "image/jpeg" });
      } catch (err: any) {
        if (err?.code === 1 && err?.message?.includes("Image is already browser readable")) {
          if (!file.type?.startsWith("image/")) {
            processedFile = new File([file], file.name, { type: "image/jpeg" });
          }
        } else {
          toast({ title: "HEIC Conversion Error", description: "Could not convert HEIC image. Please try a different format.", variant: "destructive" });
          clearSelectedImage();
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
      }
    }

    if (!processedFile.type.startsWith("image/")) {
      toast({ title: "Invalid File Type", description: "Please select an image file.", variant: "destructive" });
      clearSelectedImage();
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (processedFile.size > 10 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Please select an image smaller than 10MB.", variant: "destructive" });
      clearSelectedImage();
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const compressedFile = await compressImage(processedFile);
      setSelectedImage(compressedFile);
      const previewReader = new FileReader();
      previewReader.onloadend = () => setImagePreviewUrl(previewReader.result as string);
      previewReader.readAsDataURL(compressedFile);
      convertToBase64(compressedFile);
    } catch {
      toast({ title: "Compression Error", description: "Error compressing image. Please try a different image.", variant: "destructive" });
      clearSelectedImage();
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      activateChat(inputValue.trim());
      setInputValue("");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    activateChat(suggestion);
  };

  const handleChatSend = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputValue.trim() && !selectedImage) || isLoading || isProcessingImage) return;
    if (selectedImage && !imageBase64) {
      toast({ title: "Image Still Processing", description: "Please wait a moment for the image to be ready.", variant: "default" });
      return;
    }
    const text = inputValue.trim();
    const imgB64 = imageBase64;
    const mediaType = selectedImage?.type;
    sendMessage({
      text: text || "(image)",
      imageBase64: imgB64,
      imageMediaType: mediaType,
    });
    setInputValue("");
    clearSelectedImage();
    if (chatInputRef.current) chatInputRef.current.style.height = "auto";
  };

  // Initialize chat when activated
  useEffect(() => {
    if (chatActive && !chatInitialized) initChat();
  }, [chatActive, chatInitialized, initChat]);

  // Auto-scroll messages
  useEffect(() => {
    if (chatActive && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingMessage, chatActive]);

  // Focus chat input after init
  useEffect(() => {
    if (chatActive && chatInitialized && chatInputRef.current && !isLoading) {
      chatInputRef.current.focus({ preventScroll: true });
    }
  }, [chatActive, chatInitialized, isLoading]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    const timer = setTimeout(() => setIsLoaded(true), 100);
    const preloadTimer = setTimeout(() => {
      preloadPage("/login");
      preloadPage("/signup");
      try {
        import("../pages/ChatPage");
        import("../pages/ListsPage");
      } catch { /* silent */ }
    }, 2000);

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
      setScrollY(scrollTop);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.documentElement.style.scrollBehavior = "auto";
      clearTimeout(timer);
      clearTimeout(preloadTimer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // ─── Chat input bar (shared between landing idle + chat active) ───
  const renderInputBar = (mode: "landing" | "chat") => {
    const isChat = mode === "chat";
    const chatSendDisabled = isLoading || isProcessingImage || (!inputValue.trim() && !selectedImage) || !!(selectedImage && !imageBase64);
    return (
      <div className={isChat ? "max-w-4xl mx-auto" : ""}>
        {/* Image Preview */}
        {isChat && imagePreviewUrl && (
          <div className="mb-2 px-4 relative inline-block">
            <div className="relative p-2 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600">
              <img
                src={imagePreviewUrl}
                alt="Selected preview"
                className="max-h-16 sm:max-h-20 max-w-full rounded-lg object-cover"
              />
              <button
                type="button"
                className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-5 w-5 sm:h-6 sm:w-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
                onClick={clearSelectedImage}
                title="Remove image"
              >
                <XCircle className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={isChat ? handleChatSend : handleInputSubmit}>
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/gif,image/webp,image/heic,.heic"
            style={{ display: "none" }}
          />

          <div className="flex items-center bg-white dark:bg-slate-800 rounded-full border border-slate-300 dark:border-slate-600 shadow-lg hover:shadow-xl transition-shadow duration-300 px-4 sm:px-5 py-2.5 sm:py-3">
            {isChat ? (
              <textarea
                ref={chatInputRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  const el = e.target;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 88)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!chatSendDisabled) handleChatSend(e as unknown as React.FormEvent);
                  }
                }}
                placeholder={
                  isProcessingImage
                    ? "Processing image..."
                    : selectedImage
                    ? "Add a description for the image..."
                    : "What are you shopping for?"
                }
                rows={1}
                disabled={isLoading || isProcessingImage}
                className="flex-1 bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-base outline-none resize-none min-h-[24px] max-h-[88px] overflow-y-auto scrollbar-hide disabled:opacity-50"
              />
            ) : (
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => { setDisplayedSuggestions(pickRandomSuggestions()); setShowSuggestions(true); }}
                placeholder="What are you shopping for?"
                className="flex-1 bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-base outline-none"
              />
            )}
            <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 disabled:opacity-40"
                aria-label="Upload image"
                disabled={isLoading || isProcessingImage}
                onClick={() => {
                  if (!chatActive) {
                    activateChat();
                    // Delay file picker until chat is rendered
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <LuCamera className="h-5 w-5" />
              </button>
              <button
                type="submit"
                className="text-green-500 hover:text-green-600 transition-colors disabled:opacity-40"
                disabled={isChat ? chatSendDisabled : !inputValue.trim()}
                aria-label="Send message"
              >
                {isChat && (isLoading || isProcessingImage) ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : (
                  <BsArrowUpCircleFill className="h-7 w-7" />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  };

  // ─── Chat messages area ───
  const renderMessages = () => (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {messages.map((message: ChatMessage) => (
        <div key={message.id} className={`flex ${message.is_user ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[90%] sm:max-w-[85%] lg:max-w-[70%] ${message.is_user ? "order-2" : "order-1"}`}>
            {!message.is_user && (
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                  <IoChatboxOutline className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Savr Assistant</span>
              </div>
            )}
            <div className={`relative rounded-2xl px-3 sm:px-4 lg:px-6 py-3 sm:py-4 ${
              message.is_user
                ? "bg-green-500 text-white"
                : "bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-slate-900 dark:text-white"
            }`}>
              <div className="space-y-2 sm:space-y-3"><MarkdownText text={message.content} /></div>
              {message.imageBase64 && message.imageMediaType && (
                <div className="mt-2 sm:mt-3">
                  <img
                    src={`data:${message.imageMediaType};base64,${message.imageBase64}`}
                    alt="User uploaded"
                    className="max-h-48 sm:max-h-64 rounded-lg object-cover w-full"
                  />
                </div>
              )}
              <div className={`text-xs mt-2 sm:mt-3 ${message.is_user ? "text-green-100" : "text-slate-500 dark:text-slate-400"}`}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        </div>
      ))}
      {streamingMessage && (
        <div className="flex justify-start">
          <div className="max-w-[90%] sm:max-w-[85%] lg:max-w-[70%]">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                <IoChatboxOutline className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Savr Assistant</span>
            </div>
            <div className="relative rounded-2xl px-3 sm:px-4 lg:px-6 py-3 sm:py-4 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-slate-900 dark:text-white">
              <div className="space-y-2 sm:space-y-3"><MarkdownText text={streamingMessage.content} /></div>
            </div>
          </div>
        </div>
      )}
      {isLoading && !streamingMessage && (
        <div className="flex justify-start">
          <div className="max-w-[90%] sm:max-w-[85%] lg:max-w-[70%]">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                <IoChatboxOutline className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Savr Assistant</span>
            </div>
            <div className="rounded-2xl px-3 sm:px-4 lg:px-6 py-3 sm:py-4 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:via-emerald-900 dark:to-green-900 transition-opacity duration-1000 ${
        isLoaded ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Scroll Progress Bar */}
      {!chatActive && <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} />}

      {/* Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:via-emerald-900 dark:to-green-900 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-600 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin" />
            </div>
            <p className="mt-6 text-lg font-medium text-slate-700 dark:text-slate-300 animate-pulse">Loading...</p>
          </div>
        </div>
      )}

      {/* ─── CHAT OVERLAY ─── */}
      {/* This layer exists whenever chatActive is true. It fades/slides in via chatVisible. */}
      {chatActive && (
        <div
          className={`fixed inset-0 z-[80] flex flex-col transition-opacity duration-500 ease-out ${
            chatVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{ pointerEvents: chatVisible && !chatTransitioning ? "auto" : chatActive ? "auto" : "none" }}
        >
          {/* Themed background container behind chat */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800" />

          {/* Close button */}
          <button
            onClick={closeChat}
            className={`landing-close-btn fixed top-4 right-4 flex items-center h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-600 rounded-full shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${drawerState === 'expanded' ? 'z-20' : 'z-[100]'}`}
            style={{ width: "40px" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.width = "170px"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.width = "40px"; }}
          >
            <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
              <X className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </span>
            <span className="whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300 pr-4 landing-close-text">
              Close Savr Chat
            </span>
          </button>

          {/* Messages area */}
          <div
            ref={messagesContainerRef}
            className={`relative flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 pt-14 hide-scrollbar transition-all duration-500 ${
              chatVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            } ${drawerState === "expanded" ? "pb-[60vh]" : drawerState === "peek" ? "pb-[140px]" : "pb-4"}`}
            style={{ transitionDelay: chatVisible ? "200ms" : "0ms" }}
          >
            {renderMessages()}
          </div>

          {/* Input bar container with themed background strip */}
          <div
            ref={inputBarRef}
            className={`relative flex-shrink-0 z-20 transition-all duration-500 ${
              chatVisible ? "translate-y-0" : "translate-y-full"
            }`}
          >
            {/* Background strip behind input — solid color for visual separation */}
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-200/80 to-emerald-100 dark:from-slate-900 dark:to-slate-800" />
            <div className="relative px-3 sm:px-4 pb-4 pt-3">
              {renderInputBar("chat")}
            </div>
          </div>

          {/* List Drawer — desktop: offset right; mobile/tablet: centered */}
          <div
            className="fixed left-0 right-0 z-10 pointer-events-none"
            style={{ bottom: 0 }}
          >
            {/* Mobile/Tablet: centered, narrower than input */}
            <div className="lg:hidden max-w-3xl mx-auto px-6 sm:px-8 relative pointer-events-auto">
              <ListDrawer
                list={selectedList}
                onCheckPrices={handleCheckPrices}
                onSelectStores={() => {
                  const sid = useChatStore.getState().currentSession || localStorage.getItem("onboarding-session-id") || "";
                  setOnboardingSessionId(sid);
                  setShowSignupModal(true);
                }}
                onSelectProduct={handleSelectProduct}
                isCheckingPrices={false}
                inputAreaHeight={inputAreaHeight - 2}
                embedded
              />
            </div>
            {/* Desktop: offset to the right so chat + drawer visible simultaneously */}
            <div className="hidden lg:block pointer-events-auto">
              <ListDrawer
                list={selectedList}
                onCheckPrices={handleCheckPrices}
                onSelectStores={() => {
                  const sid = useChatStore.getState().currentSession || localStorage.getItem("onboarding-session-id") || "";
                  setOnboardingSessionId(sid);
                  setShowSignupModal(true);
                }}
                onSelectProduct={handleSelectProduct}
                isCheckingPrices={false}
                inputAreaHeight={inputAreaHeight - 2}
              />
            </div>
          </div>

          <OnboardingSignupModal
            isOpen={showSignupModal}
            onClose={() => setShowSignupModal(false)}
            anonymousSessionId={onboardingSessionId}
          />
        </div>
      )}

      {/* ─── LANDING PAGE CONTENT ─── */}
      {/* Fades out when chat is visible */}
      <div
        className={`transition-all duration-500 ease-out ${
          chatVisible ? "opacity-0 scale-[0.97] pointer-events-none" : "opacity-100 scale-100"
        }`}
      >
        {/* Navigation */}
        <nav
          className={`sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 bg-cyan-100/80 dark:bg-cyan-900/80 backdrop-blur-xl transition-all duration-700 delay-200 ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center border-b border-slate-200 dark:border-slate-600 pb-3 sm:pb-4">
            <div className="flex items-center space-x-2">
              <img src="/assets/savr-logo(primary).svg" alt="Savr Logo" className="h-6 sm:h-8" />
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-105 text-xs sm:text-sm shadow-sm"
                onMouseEnter={() => preloadPage("/login")}
                onClick={() => handleNavigation("/login")}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                onMouseEnter={() => preloadPage("/signup")}
                onClick={() => handleNavigation("/signup")}
              >
                Get Started
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section
          className={`relative z-20 px-4 sm:px-6 py-4 sm:py-6 lg:py-8 transition-all duration-1000 delay-300 ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <h1
                className={`text-3xl sm:text-3xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 leading-tight px-2 transition-all duration-800 delay-600 ${
                  isLoaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                }`}
              >
                🍎 Your AI Grocery
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 via-emerald-400 to-green-600 shimmer-text">
                  Shopping Companion
                </span>🛍️
              </h1>
              <p
                className={`text-base sm:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 mb-6 sm:mb-8 max-w-5xl mx-auto leading-relaxed px-2 transition-all duration-800 delay-700 ${
                  isLoaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                }`}
              >
                Stop overpaying for groceries. Tell Savr what you need and we'll find the lowest price at a nearby store, saving you real money.
              </p>

              {/* Chat Input Bar — idle state, centered */}
              <div
                className={`max-w-2xl mx-auto mt-20 sm:mt-28 relative z-[60] transition-all duration-800 delay-800 ${
                  isLoaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                }`}
              >
                {renderInputBar("landing")}

                {/* Suggestion Prompts */}
                {showSuggestions && (
                  <div
                    ref={suggestionsRef}
                    className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-xl overflow-hidden z-[60] animate-suggestions-fade-in"
                  >
                    {displayedSuggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-5 py-3 text-sm sm:text-base text-slate-700 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            BELOW THE FOLD — Scroll-triggered reveal animations with subtle parallax
        ═══════════════════════════════════════════════════════════════════ */}

        {/* Section 1: How It Works — Visual Journey */}
        <section
          ref={howItWorksAnim.ref}
          className="relative z-10 px-4 sm:px-6 pt-[45vh] sm:pt-[55vh] pb-20 sm:pb-32"
          style={{ transform: `translateY(${Math.max(-140, -scrollY * 0.15)}px)` }}
        >
          <div
            className={`max-w-6xl mx-auto transition-all duration-700 ease-out ${
              howItWorksAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
            }`}
          >
            {/* Section Header */}
            <div className={`text-center mb-16 sm:mb-24 transition-all duration-700 ${
              howItWorksAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}>
              <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-wider text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/50 rounded-full uppercase">
                Simple as 1-2-3
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                How Savr Works
              </h2>
              <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                From your kitchen to checkout in three easy steps
              </p>
            </div>

            {/* Steps */}
            <div className="grid lg:grid-cols-3 gap-8 lg:gap-6">
              {[
                {
                  num: "1",
                  Icon: MessageSquare,
                  gradient: "from-green-500 to-emerald-600",
                  bgGlow: "bg-green-500/20",
                  title: "Tell Savr What You Need",
                  desc: "Chat naturally about recipes, meal plans, or just the basics. Savr understands you and builds your list as you talk.",
                },
                {
                  num: "2",
                  Icon: MapPin,
                  gradient: "from-sky-500 to-blue-600",
                  bgGlow: "bg-sky-500/20",
                  title: "Choose Your Stores",
                  desc: "Pick up to 3 stores near you. Savr instantly checks real-time prices at each one — no more guessing.",
                },
                {
                  num: "3",
                  Icon: TrendingDown,
                  gradient: "from-amber-500 to-orange-600",
                  bgGlow: "bg-amber-500/20",
                  title: "Save Real Money",
                  desc: "Compare every item side-by-side. Pick the best deals or go with the cheapest store overall. You decide.",
                },
              ].map((step, i) => (
                <div
                  key={step.num}
                  className={`relative group transition-all duration-700 ease-out ${
                    howItWorksAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                  }`}
                  style={{ transitionDelay: howItWorksAnim.isVisible ? `${150 + i * 150}ms` : "0ms" }}
                >
                  {/* Connector line (hidden on mobile, last item) */}
                  {i < 2 && (
                    <div className="hidden lg:block absolute top-16 left-[calc(50%+60px)] w-[calc(100%-120px)] h-[2px]">
                      <div className="h-full bg-gradient-to-r from-slate-300 dark:from-slate-600 to-transparent" />
                    </div>
                  )}

                  <div className="glass-card hover-lift rounded-3xl p-8 sm:p-10 text-center h-full">
                    {/* Glowing background */}
                    <div className={`absolute inset-0 ${step.bgGlow} rounded-3xl blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />

                    {/* Step number + Icon */}
                    <div className="relative mb-6">
                      <div className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                        <step.Icon className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-lg border-2 border-slate-100 dark:border-slate-700">
                        <span className={`text-lg sm:text-xl font-bold bg-gradient-to-br ${step.gradient} bg-clip-text text-transparent`}>{step.num}</span>
                      </div>
                    </div>

                    <h3 className="relative text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="relative text-slate-600 dark:text-slate-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Features Grid */}
        <section
          ref={featuresAnim.ref}
          className="relative z-10 px-4 sm:px-6 py-20 sm:py-32"
          style={{ transform: `translateY(${Math.max(-120, -scrollY * 0.06)}px)` }}
        >
          <div
            className={`max-w-7xl mx-auto transition-all duration-700 ease-out ${
              featuresAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
            }`}
          >
            {/* Section Header */}
            <div className={`text-center mb-16 sm:mb-20 transition-all duration-700 ${
              featuresAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}>
              <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-wider text-violet-700 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/50 rounded-full uppercase">
                Packed with Features
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                Why Canadians Love Savr
              </h2>
              <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                Everything you need to shop smarter, save more, and stress less
              </p>
            </div>

            {/* Features Bento Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {[
                {
                  Icon: MessageSquare,
                  gradient: "from-green-500 to-emerald-600",
                  title: "Just Ask Savr",
                  desc: "No menus. No buttons. Describe what you need in your own words.",
                  span: "lg:col-span-1"
                },
                {
                  Icon: BarChart3,
                  gradient: "from-violet-500 to-purple-600",
                  title: "Compare 3 Stores Instantly",
                  desc: "Real prices, real-time. See exactly what you'll pay at each store before you leave home.",
                  span: "lg:col-span-2"
                },
                {
                  Icon: ScanLine,
                  gradient: "from-sky-500 to-cyan-600",
                  title: "Snap & Shop",
                  desc: "Photograph a recipe, handwritten list, or your fridge — Savr reads it and builds your list.",
                  span: "lg:col-span-2"
                },
                {
                  Icon: Sparkles,
                  gradient: "from-amber-500 to-orange-600",
                  title: "Always Your Choice",
                  desc: "Multiple options per item. Every dollar is your call.",
                  span: "lg:col-span-1"
                },
                {
                  Icon: Heart,
                  gradient: "from-rose-500 to-pink-600",
                  title: "Made for You",
                  desc: "Set dietary preferences once. Vegan, gluten-free, allergies — covered.",
                  span: "lg:col-span-1"
                },
                {
                  Icon: Share2,
                  gradient: "from-teal-500 to-emerald-600",
                  title: "Shop Your Way",
                  desc: "Print, share, or pull it up in-store. Your list goes wherever you go.",
                  span: "lg:col-span-1"
                },
              ].map((feature, i) => (
                <div
                  key={feature.title}
                  className={`group relative ${feature.span} transition-all duration-600 ease-out ${
                    featuresAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                  }`}
                  style={{ transitionDelay: featuresAnim.isVisible ? `${100 + i * 100}ms` : "0ms" }}
                >
                  <div className="glass-card hover-lift rounded-2xl p-6 sm:p-8 h-full border border-white/50 dark:border-slate-700/50">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-5 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                      <feature.Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Trust/Stats Band */}
        <section
          ref={statsAnim.ref}
          className="relative z-10 py-16 sm:py-24 overflow-hidden"
          style={{ transform: `translateY(${Math.max(-150, -scrollY * 0.05)}px)` }}
        >
          {/* Gradient band background */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

          <div
            className={`relative max-w-6xl mx-auto px-4 sm:px-6 transition-all duration-700 ease-out ${
              statsAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 text-center text-white">
              {[
                { value: "15+", label: "Canadian Stores", sublabel: "Real prices, real-time" },
                { value: "3", label: "Store Comparison", sublabel: "Side by side pricing" },
                { value: "100%", label: "Free to Use", sublabel: "No credit card needed" },
                { value: "∞", label: "Grocery Lists", sublabel: "Create as many as you want" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className={`group transition-all duration-600 ease-out ${
                    statsAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: statsAnim.isVisible ? `${i * 100}ms` : "0ms" }}
                >
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
                    {stat.value}
                  </div>
                  <div className="text-lg sm:text-xl font-semibold text-white/90 mb-1">{stat.label}</div>
                  <div className="text-sm text-white/70">{stat.sublabel}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Final CTA */}
        <section
          ref={ctaAnim.ref}
          className="relative z-10 px-4 sm:px-6 py-24 sm:py-32"
          style={{ transform: `translateY(${Math.max(-180, -scrollY * 0.04)}px)` }}
        >
          <div
            className={`max-w-4xl mx-auto text-center transition-all duration-700 ease-out ${
              ctaAnim.isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95"
            }`}
          >
            {/* Floating elements around CTA */}
            <div className="absolute left-[10%] top-1/4 animate-float-slow hidden sm:block">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl opacity-80 rotate-12" />
            </div>
            <div className="absolute right-[15%] top-1/3 animate-float-reverse hidden sm:block">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl opacity-70 -rotate-6" />
            </div>
            <div className="absolute left-[20%] bottom-1/4 animate-float hidden sm:block">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg opacity-60 rotate-45" />
            </div>

            <div className="relative gradient-border rounded-3xl p-8 sm:p-16 bg-white dark:bg-slate-800">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">
                Ready to Start Saving?
              </h2>
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-8 sm:mb-10 max-w-xl mx-auto">
                Join Canadians who are already spending less on groceries. It's free to try — no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-semibold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 w-full sm:w-auto">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-semibold rounded-xl w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          className="relative z-10 px-4 sm:px-6 py-12 sm:py-16 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
          style={{ transform: `translateY(${Math.max(-200, -scrollY * 0.03)}px)` }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center space-x-3">
                <img src="/assets/savr-logo(primary).svg" alt="Savr Logo" className="h-7 sm:h-8" />
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Smart grocery shopping for Canadians
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-slate-600 dark:text-slate-400">
                <Link to="/blog" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Read our Blog</Link>
                <Link to="/privacy" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Terms of Service</Link>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-200/50 dark:border-slate-700/50 text-center text-sm text-slate-500 dark:text-slate-400">
              <p>&copy; {new Date().getFullYear()} Savr. Made with love in Canada.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
