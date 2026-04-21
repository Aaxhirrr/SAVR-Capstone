import { useEffect, useState, useCallback, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Newspaper,
  UserCircle,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  Calendar,
  MoreVertical,
  Trash2,
  Loader2,
  Pencil,
  ChevronDown,
  Plus,
} from "lucide-react";
import authService, { User } from "@/services/authService";
import useListStore from "@/stores/listStore";
import useChatStore from "@/stores/chatStore";
import { SavedGroceryList, deleteGroceryList } from "@/services/groceryListService";
import chatService from "@/services/chatService";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// List item component
const ListItem = ({
  list,
  isSelected,
  onSelect,
  onDelete,
  onRename,
}: {
  list: SavedGroceryList;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(list.name);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const handleSaveRename = () => {
    const trimmed = renameValue.trim();
    setIsRenaming(false);
    if (trimmed && trimmed !== list.name) {
      onRename(trimmed);
    } else {
      setRenameValue(list.name);
    }
  };

  const handleBlur = () => {
    // Delay to avoid race with Radix dropdown focus restoration
    setTimeout(() => {
      // Only save if still in renaming mode (not cancelled via Escape)
      if (renameInputRef.current && !renameInputRef.current.matches(':focus')) {
        handleSaveRename();
      }
    }, 150);
  };

  return (
    <div
      onClick={(e) => {
        // Don't trigger select when renaming
        if (isRenaming) { e.stopPropagation(); return; }
        onSelect();
      }}
      className={cn(
        "group relative px-2 py-3 rounded-lg cursor-pointer transition-all duration-200",
        isSelected
          ? "bg-gradient-to-r from-green-500/15 to-green-600/10 border border-green-500/30"
          : "hover:bg-slate-100 dark:hover:bg-slate-700/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleSaveRename(); }
                if (e.key === 'Escape') { e.preventDefault(); setRenameValue(list.name); setIsRenaming(false); }
              }}
              onBlur={handleBlur}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-sm font-medium bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-green-500"
              autoComplete="off"
            />
          ) : (
            <h4 className={cn(
              "text-sm font-medium truncate",
              isSelected ? "text-green-700 dark:text-green-400" : "text-slate-800 dark:text-slate-200"
            )}>
              {list.name}
            </h4>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(list.createdAt)}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {list.items.length} item{list.items.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-opacity relative z-50"
              style={{ minWidth: '32px', minHeight: '32px' }}
            >
              <MoreVertical className="h-4 w-4 text-slate-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 z-[100] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                // Select the list first to avoid a re-render resetting isRenaming
                onSelect();
                setRenameValue(list.name);
                setTimeout(() => setIsRenaming(true), 200);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

const Layout = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const [lastScrollY, setLastScrollY] = useState(0);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [listsExpanded, setListsExpanded] = useState(false);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);

  // List store
  const {
    lists,
    isLoadingLists,
    selectedListId,
    selectList,
    fetchLists,
    renameList,
  } = useListStore();

  // Fetch lists on mount
  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // Handle list deletion
  const handleDeleteList = useCallback(async (list: SavedGroceryList) => {
    try {
      await deleteGroceryList(list.id);
      fetchLists();
      toast({
        title: 'List Deleted',
        description: `"${list.name}" has been deleted.`,
      });
    } catch (error) {
      console.error('Error deleting list:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the list.',
        variant: 'destructive',
      });
    }
  }, [fetchLists, toast]);

  // Handle list rename
  const handleRenameList = useCallback(async (list: SavedGroceryList, newName: string) => {
    try {
      await renameList(list.id, newName);
      toast({ description: 'List renamed', duration: 2000 });
    } catch {
      toast({ variant: 'destructive', description: 'Failed to rename list', duration: 3000 });
    }
  }, [renameList, toast]);

  const navigate = useNavigate();
  const location = useLocation();

  // Handle list selection
  const handleSelectList = useCallback((list: SavedGroceryList) => {
    selectList(list.id);
    setSidebarOpen(false);
    if (location.pathname !== '/chat') {
      navigate('/chat');
    }
  }, [selectList, location.pathname, navigate]);

  useEffect(() => {
    // console.log("Layout component mounted");

    // Check if user is authenticated
    const token = localStorage.getItem("token");
    // console.log("Auth token exists:", !!token);

    // Check if user data exists
    const userJson = localStorage.getItem("user");
    // console.log("User data exists:", !!userJson);

    // Try to refresh the profile data
    const refreshUserData = async () => {
      try {
        if (token) {
          const success = await authService.refreshProfile();
          if (success) {
            const refreshedUserJson = localStorage.getItem("user");
            if (refreshedUserJson) {
              setUser(JSON.parse(refreshedUserJson));
            }
          }
        }
      } catch (error: any) {
        console.error("Error refreshing user data:", error);
      }
    };

    // If we have a token but no user data, try to refresh
    if (token && !userJson) {
      refreshUserData();
    } else if (userJson) {
      // Otherwise use the existing user data
      setUser(JSON.parse(userJson));
    }

    return () => {
      // console.log("Layout component unmounted");
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen]);

  // Mobile header hide-on-scroll
  useEffect(() => {
    let ticking = false;
    const handleScroll = (target: Window | Element) => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const currentY =
          target instanceof Window
            ? window.scrollY || 0
            : (target as Element).scrollTop || 0;
        // Only manage background color change based on scroll position
        if (currentY < 8) {
          if (!isAtTop) setIsAtTop(true);
          if (isScrollingUp) setIsScrollingUp(false);
        } else {
          if (isAtTop) setIsAtTop(false);
          const delta = currentY - lastScrollY;
          if (delta < -2) {
            // scrolling up
            if (!isScrollingUp) setIsScrollingUp(true);
          } else if (delta > 2) {
            // scrolling down
            if (isScrollingUp) setIsScrollingUp(false);
          }
        }
        setLastScrollY(currentY);
        ticking = false;
      });
    };
    // Prefer chat messages scroll container if present
    const chatMessagesEl = document.querySelector('.chat-messages') as Element | null;
    const scrollTarget =
      chatMessagesEl ||
      ((mainRef.current && mainRef.current.scrollHeight > mainRef.current.clientHeight)
        ? (mainRef.current as Element)
        : window);
    const onScroll = () => handleScroll(scrollTarget);
    (scrollTarget as any).addEventListener("scroll", onScroll, { passive: true });
    return () => (scrollTarget as any).removeEventListener("scroll", onScroll);
  }, [lastScrollY, sidebarOpen, location.pathname, isAtTop, isScrollingUp]);

  // console.log("Current location:", location.pathname);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: "/chat", label: "Chat", icon: <MessageSquare size={20} /> },
    { path: "/flyers", label: "Flyers", icon: <Newspaper size={20} /> },
  ];

  const desktopNavItems = [
    { path: "/chat", label: "Chat", icon: <MessageSquare size={20} /> },
    { path: "/flyers", label: "Flyers", icon: <Newspaper size={20} /> },
  ];

  const handleLogout = () => {
    // console.log("Logging out...");
    authService.logout();
    navigate("/login");
    setSidebarOpen(false);
  };

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  // New chat handler
  const handleNewChat = async () => {
    if (location.pathname !== '/chat') {
      navigate('/chat');
      return;
    }
    setIsCreatingNewChat(true);
    try {
      const { getUserScopedSessionId } = await import('@/stores/chatStore');
      const existingSessionId = getUserScopedSessionId();
      if (existingSessionId) {
        try {
          await chatService.clearCurrentSessionList(existingSessionId);
        } catch (e) {
          console.warn('Failed to delete server-side draft:', e);
        }
      }
      const { setUserScopedSessionId } = await import('@/stores/chatStore');
      setUserScopedSessionId(null);
      localStorage.removeItem('savr-chat-storage');
      
      // Clear chat store
      useChatStore.getState().clearChat();
      useChatStore.setState({ currentSession: null, messages: [], groceryList: null });
      
      // Clear list store state to hide drawer when starting new chat
      useListStore.getState().selectList(null);
      useListStore.getState().setDrawerState('collapsed');
      
      // Also clear the persisted list store from localStorage
      const user = authService.getCurrentUser();
      if (user) {
        localStorage.removeItem(`savr-list-storage-${user.id}`);
      }
      
      // Reset the list-chat sync hook's loaded ref so it can reload lists
      window.dispatchEvent(new CustomEvent('resetListChatRef'));
      
      // Show welcome message
      const welcome = await chatService.getWelcomeMessage();
      if (welcome.session_id && !welcome.session_id.startsWith('error-')) {
        const { setUserScopedSessionId: setSessionId } = await import('@/stores/chatStore');
        setSessionId(welcome.session_id);
        useChatStore.setState({ currentSession: welcome.session_id });
        await useChatStore.getState().loadSession(welcome.session_id);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast({ title: 'Error', description: 'Failed to create new chat', variant: 'destructive' });
    } finally {
      setIsCreatingNewChat(false);
    }
  };

  // Pages where header should be sticky
  const pagesWithStickyHeader = ['/profile', '/flyers'];
  const shouldHeaderBeSticky = pagesWithStickyHeader.includes(location.pathname);
  const isChatPage = location.pathname === "/chat";
  const isChatHeaderCompact = isChatPage && !isAtTop;
  const mobileHeaderSpacingClass = isChatPage
    ? `${isChatHeaderCompact ? "py-1.5" : "py-2.5"} px-[18px]`
    : "py-2 px-4";
  const chatMenuButtonMotionClass = isChatPage
    ? `${isChatHeaderCompact ? "scale-95" : "scale-100"} origin-left`
    : "";
  const mobileHeaderScrolledClass = shouldHeaderBeSticky
    ? "bg-white dark:bg-slate-900"
    : !isAtTop
      ? isChatPage
        ? "bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-700/80"
        : "bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl"
      : "";

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-900">
      {/* Mobile Header - Sticky on specific pages */}
      <header className={`${mobileHeaderSpacingClass} ${shouldHeaderBeSticky ? 'sticky' : 'fixed xl:relative'} top-0 left-0 right-0 z-50 xl:hidden transition-all duration-200 ${mobileHeaderScrolledClass}`}>
        <div className="flex justify-between items-center">
          {/* Left side: hamburger only */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "flex items-center justify-center rounded-xl transition-all duration-200 ease-out text-slate-600",
              isChatPage
                ? "p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                : "p-1.5 hover:bg-gradient-to-br hover:from-orange-100 hover:to-amber-100 hover:text-orange-700 hover:scale-110 hover:rotate-6",
              chatMenuButtonMotionClass,
            )}
            aria-label="Toggle navigation menu">
            {sidebarOpen ? (
              <X size={isChatPage ? 22 : 24} />
            ) : (
              <Menu size={isChatPage ? 22 : 24} />
            )}
          </button>

          {/* Center: Logo */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
            <img
              src="/assets/savr-logo(primary).svg"
              alt="Savr Logo"
              className={cn(
                isChatPage ? (isChatHeaderCompact ? "h-4" : "h-6") : "h-6",
                "transition-all duration-200 ease-out",
              )}
            />
          </div>

          {/* Right side: Empty div for visual balance */}
          <div className={isChatPage ? (isChatHeaderCompact ? "w-7" : "w-8") : "w-8"}></div>
        </div>
      </header>

      {/* Mobile/Tablet Overlay Sidebar */}
      <div
        className="fixed inset-0 z-[60] xl:hidden"
        style={{ pointerEvents: sidebarOpen ? "auto" : "none" }}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-150"
          style={{ opacity: sidebarOpen ? 1 : 0 }}
          onClick={() => setSidebarOpen(false)}
        />
        {/* Sidebar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-72 max-w-[75vw] bg-white dark:bg-slate-800 transform transition-transform duration-150 ease-out shadow-xl"
          style={{
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          }}>
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-6 pt-8 pb-4 flex items-center justify-between gap-3">
              <div className="flex items-center">
                <img
                  src="/assets/savr-logo(primary).svg"
                  alt="Savr Logo"
                  className="h-6"
                />
              </div>
              <button
                onClick={() => {
                  handleNewChat();
                  setSidebarOpen(false);
                }}
                disabled={isCreatingNewChat}
                className="flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 hover:from-orange-500 hover:via-amber-500 hover:to-yellow-500 text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 hover:rotate-6 relative overflow-hidden group"
                aria-label="Start new chat"
              >
                {/* Sparkle effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                {isCreatingNewChat ? <Loader2 className="h-5 w-5 animate-spin relative z-10" /> : <Plus size={24} className="relative z-10" />}
              </button>
            </div>

            {/* Navigation */}
            <nav className="px-6 py-2">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={handleNavClick}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                        isActive(item.path)
                          ? "bg-gradient-to-r from-green-400/30 via-emerald-400/30 to-teal-400/30 text-green-700 border-2 border-green-200"
                          : "text-slate-700 hover:bg-gradient-to-r hover:from-orange-100/80 hover:via-amber-100/80 hover:to-yellow-100/80 hover:text-orange-700 hover:scale-[1.02]"
                      }`}>
                      <span
                        className={`flex items-center justify-center h-8 w-8 rounded-xl transition-all ${
                          isActive(item.path)
                            ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white"
                            : "bg-gradient-to-br from-orange-200 to-amber-200 text-orange-600 group-hover:from-orange-300 group-hover:to-amber-300 group-hover:scale-110 group-hover:rotate-6"
                        }`}>
                        {item.icon}
                      </span>
                      <span
                        className={`text-sm font-semibold leading-tight ${
                          isActive(item.path)
                            ? "text-green-700"
                            : "text-slate-700 group-hover:text-orange-800"
                        }`}>
                        {item.label}
                      </span>
                    </Link>
                  </li>
                ))}
                
                {/* My Lists Section Header - Mobile */}
                <li>
                  <button
                    onClick={() => setListsExpanded(!listsExpanded)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-3 text-slate-600 dark:text-slate-400 hover:bg-gradient-to-r hover:from-rose-100 hover:via-pink-100 hover:to-fuchsia-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 group hover:scale-[1.02] relative overflow-hidden"
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      <span className="flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br from-rose-200 via-pink-200 to-fuchsia-200 dark:bg-slate-700 text-rose-600 dark:text-slate-400 group-hover:from-rose-300 group-hover:via-pink-300 group-hover:to-fuchsia-300 group-hover:scale-110 group-hover:-rotate-6 transition-all">
                        <ShoppingCart size={20} />
                      </span>
                      <span className="text-sm font-semibold leading-tight group-hover:text-rose-700 transition-colors">
                        My Lists
                      </span>
                    </div>
                    <ChevronDown 
                      className={`h-4 w-4 transition-all duration-300 group-hover:text-rose-600 relative z-10 ${
                        listsExpanded ? 'rotate-180' : 'rotate-0'
                      }`}
                    />
                  </button>
                </li>
              </ul>
            </nav>

            {/* My Lists Content - Mobile (Collapsible) */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                listsExpanded ? "flex-1 min-h-0 opacity-100" : "h-0 opacity-0"
              }`}
            >
              <div className="px-6 h-full min-h-0 flex flex-col">
                {isLoadingLists ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                  </div>
                ) : lists.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">No lists yet</p>
                    <p className="text-xs mt-0.5 opacity-70">Chat to create one</p>
                  </div>
                ) : (
                  <div className="space-y-1 flex-1 min-h-0 overflow-y-auto">
                    {lists.map((list) => (
                      <ListItem
                        key={list.id}
                        list={list}
                        isSelected={selectedListId === list.id}
                        onSelect={() => handleSelectList(list)}
                        onDelete={() => handleDeleteList(list)}
                        onRename={(newName) => handleRenameList(list, newName)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 space-y-2 mt-auto">
              {/* Profile Link */}
              <Link
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group ${
                  isActive("/profile")
                    ? "bg-gradient-to-r from-green-400/30 via-emerald-400/30 to-teal-400/30 text-green-700 border-2 border-green-200"
                    : "text-slate-700 hover:bg-gradient-to-r hover:from-blue-100/80 hover:via-indigo-100/80 hover:to-purple-100/80 hover:text-blue-700 hover:scale-[1.02]"
                }`}>
                <span
                  className={`flex items-center justify-center h-8 w-8 rounded-xl transition-all ${
                    isActive("/profile")
                      ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white"
                      : "bg-gradient-to-br from-blue-200 to-indigo-200 text-blue-600 group-hover:from-blue-300 group-hover:to-indigo-300 group-hover:scale-110 group-hover:rotate-6"
                  }`}
                >
                  <UserCircle size={18} />
                </span>
                <span
                  className={`text-sm font-semibold leading-tight ${
                    isActive("/profile")
                      ? "text-green-700"
                      : "text-slate-700 group-hover:text-blue-800"
                  }`}
                >
                  {user
                    ? user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.username || user.email
                    : "Profile"}
                </span>
              </Link>
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-red-100/80 hover:via-rose-100/80 hover:to-pink-100/80 hover:text-red-700 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 font-semibold group hover:scale-[1.02]"
              >
                <span className="flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br from-red-200 to-rose-200 text-red-600 group-hover:from-red-300 group-hover:to-rose-300 group-hover:scale-110 group-hover:-rotate-6 transition-all">
                  <LogOut size={16} />
                </span>
                <span className="text-sm leading-tight">Logout</span>
              </button>
              <div className="pt-0.5 flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <Link
                  to="/terms"
                  onClick={() => setSidebarOpen(false)}
                  className="hover:underline hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Terms
                </Link>
                <span aria-hidden="true">•</span>
                <Link
                  to="/privacy"
                  onClick={() => setSidebarOpen(false)}
                  className="hover:underline hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Privacy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar - Fixed position, wider for lists */}
      <div className="flex flex-1 min-h-0 relative">
        <nav 
          className="hidden xl:block fixed left-0 top-0 bottom-0 z-30 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-r border-orange-100/40 dark:border-slate-700/40 w-64 shadow-sm"
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="flex-shrink-0 h-16 lg:h-20 flex items-center justify-center px-2">
              <div className="flex items-center justify-center w-full">
                <img
                  src="/assets/savr-logo(primary).svg"
                  alt="Savr Logo"
                  className="h-6"
                />
              </div>
            </div>

            {/* Navigation - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="px-3 py-4 h-full flex flex-col min-h-0">
                <ul className="space-y-2 flex-shrink-0">
                {/* New Chat Button */}
                <li>
                  <button
                    onClick={handleNewChat}
                    disabled={isCreatingNewChat}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 hover:from-orange-500 hover:via-amber-500 hover:to-yellow-500 text-white hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden"
                  >
                    {/* Sparkle overlay effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/25 backdrop-blur-sm transition-all group-hover:bg-white/35 group-hover:rotate-12 flex-shrink-0 relative z-10">
                      {isCreatingNewChat ? (
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      ) : (
                        <Plus size={20} className="text-white" />
                      )}
                    </span>
                    <span className="text-sm font-bold relative z-10">
                      New Chat ✨
                    </span>
                  </button>
                </li>
                
                {desktopNavItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                        isActive(item.path)
                          ? "bg-gradient-to-r from-green-400/30 via-emerald-400/30 to-teal-400/30 text-green-700 border border-green-200"
                          : "text-slate-700 hover:bg-gradient-to-r hover:from-orange-100/80 hover:via-amber-100/80 hover:to-yellow-100/80 hover:text-orange-700 hover:scale-[1.02]"
                      }`}
                    >
                      <span
                        className={`flex items-center justify-center h-8 w-8 rounded-xl transition-all flex-shrink-0 relative z-10 ${
                          isActive(item.path)
                            ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white'
                            : 'bg-gradient-to-br from-orange-200 to-amber-200 text-orange-600 group-hover:from-orange-300 group-hover:to-amber-300 group-hover:scale-110 group-hover:rotate-6'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span 
                        className={`text-sm font-semibold relative z-10 ${
                          isActive(item.path)
                            ? "text-green-700"
                            : "text-slate-700 group-hover:text-orange-800"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                ))}
                
                {/* My Lists Section Header */}
                <li>
                  <button
                    onClick={() => setListsExpanded(!listsExpanded)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-gradient-to-r hover:from-rose-100 hover:via-pink-100 hover:to-fuchsia-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 group hover:scale-[1.02] hover:shadow-sm relative overflow-hidden"
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      <span className="flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br from-rose-200 via-pink-200 to-fuchsia-200 dark:bg-slate-700 text-rose-600 dark:text-slate-400 group-hover:from-rose-300 group-hover:via-pink-300 group-hover:to-fuchsia-300 group-hover:scale-110 group-hover:-rotate-6 transition-all flex-shrink-0">
                        <ShoppingCart size={20} />
                      </span>
                      <span className="text-sm font-semibold group-hover:text-rose-700 transition-colors">
                        My Lists
                      </span>
                    </div>
                    <ChevronDown 
                      className={`h-4 w-4 transition-all duration-300 group-hover:text-rose-600 relative z-10 ${
                        listsExpanded ? 'rotate-180' : 'rotate-0'
                      }`}
                    />
                  </button>
                </li>
              </ul>

              {/* Lists Content - Desktop (collapsible dropdown) */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  listsExpanded ? "flex-1 min-h-0 opacity-100" : "h-0 opacity-0"
                }`}
              >
                <div className="overflow-y-auto px-1.5 pb-3 h-full min-h-0">
                  {isLoadingLists ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                    </div>
                  ) : lists.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">No lists yet</p>
                      <p className="text-xs mt-0.5 opacity-70">Start a chat to create one</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {lists.map((list) => (
                        <ListItem
                          key={list.id}
                          list={list}
                          isSelected={selectedListId === list.id}
                          onSelect={() => handleSelectList(list)}
                          onDelete={() => handleDeleteList(list)}
                          onRename={(newName) => handleRenameList(list, newName)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

            {/* Profile & Logout - Fixed at bottom */}
            <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md flex-shrink-0 space-y-2 px-3 py-4 border-t border-orange-100/40 dark:border-slate-700/40">
              <Link
                to="/profile"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive("/profile")
                    ? "bg-gradient-to-r from-green-400/30 via-emerald-400/30 to-teal-400/30 text-green-700 border border-green-200"
                    : "text-slate-700 hover:bg-gradient-to-r hover:from-blue-100/80 hover:via-indigo-100/80 hover:to-purple-100/80 hover:text-blue-700 hover:scale-[1.02]"
                }`}
              >
                <span
                  className={`flex items-center justify-center h-8 w-8 rounded-xl transition-all flex-shrink-0 ${
                    isActive("/profile")
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white'
                      : 'bg-gradient-to-br from-blue-200 to-indigo-200 text-blue-600 group-hover:from-blue-300 group-hover:to-indigo-300 group-hover:scale-110 group-hover:rotate-6'
                  }`}
                >
                  <UserCircle size={18} />
                </span>
                <span 
                  className={`text-sm font-semibold ${
                    isActive("/profile")
                      ? "text-green-700"
                      : "text-slate-700 group-hover:text-blue-800"
                  }`}
                >
                  {user
                    ? user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.username || user.email
                    : "Profile"}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-red-100/80 hover:via-rose-100/80 hover:to-pink-100/80 hover:text-red-700 dark:hover:bg-slate-700 transition-all duration-200 group hover:scale-[1.02]"
              >
                <span className="flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br from-red-200 to-rose-200 text-red-600 group-hover:from-red-300 group-hover:to-rose-300 group-hover:scale-110 group-hover:-rotate-6 transition-all flex-shrink-0">
                  <LogOut size={16} />
                </span>
                <span className="text-sm font-semibold">
                  Logout
                </span>
              </button>
              <div className="pt-0.5 flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <Link
                  to="/terms"
                  className="hover:underline hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Terms
                </Link>
                <span aria-hidden="true">•</span>
                <Link
                  to="/privacy"
                  className="hover:underline hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Privacy
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Content - with left padding for sidebar */}
        <main
          ref={mainRef}
          className="flex-1 min-h-0 bg-white dark:bg-slate-900 overflow-y-auto xl:pt-0 xl:pl-64">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
