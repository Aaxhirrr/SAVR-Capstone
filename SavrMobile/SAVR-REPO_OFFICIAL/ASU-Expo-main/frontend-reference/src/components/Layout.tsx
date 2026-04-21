import { useEffect, useState, useCallback, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  MessageSquarePlus,
  MapPin,
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
  Shield,
} from "lucide-react";
import authService, { User } from "@/services/authService";
import useThemeStore from "../stores/themeStore";
import useListStore from "@/stores/listStore";
import useChatStore, { setUserScopedSessionId } from "@/stores/chatStore";
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
import { PreferencesDropdown } from "@/components/PreferencesDropdown";

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
        "group relative p-3 rounded-lg cursor-pointer transition-all duration-200",
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
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-opacity"
            >
              <MoreVertical className="h-4 w-4 text-slate-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
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
  console.log("Layout component rendered");
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { getTheme } = useThemeStore();
  const theme = getTheme();
  const { toast } = useToast();
  const [hideMobileHeader, setHideMobileHeader] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
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
    console.log("Layout component mounted");

    // Check if user is authenticated
    const token = localStorage.getItem("token");
    console.log("Auth token exists:", !!token);

    // Check if user data exists
    const userJson = localStorage.getItem("user");
    console.log("User data exists:", !!userJson);

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
      console.log("Layout component unmounted");
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
        const delta = currentY - lastScrollY;
        // Always show at very top or when sidebar is open
        if (sidebarOpen || currentY < 8) {
          if (hideMobileHeader) setHideMobileHeader(false);
          if (!isAtTop) setIsAtTop(true);
          if (isScrollingUp) setIsScrollingUp(false);
        } else {
          if (isAtTop) setIsAtTop(false);
          if (delta > 2) {
            // scrolling down
            if (!hideMobileHeader) setHideMobileHeader(true);
            if (isScrollingUp) setIsScrollingUp(false);
          } else if (delta < -2) {
            // scrolling up
            if (hideMobileHeader) setHideMobileHeader(false);
            if (!isScrollingUp) setIsScrollingUp(true);
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
  }, [hideMobileHeader, lastScrollY, sidebarOpen, location.pathname, isAtTop, isScrollingUp]);

  console.log("Current location:", location.pathname);

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
    console.log("Logging out...");
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
      useChatStore.getState().clearChat();
      
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

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-900">
      {/* Mobile Header - Fixed only on mobile */}
      <header className={`py-4 px-4 fixed lg:relative top-0 left-0 right-0 z-40 lg:hidden transition-transform duration-200 ${hideMobileHeader ? "-translate-y-full" : "translate-y-0"} ${isAtTop ? "bg-white dark:bg-slate-900" : isScrollingUp ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-700/60" : "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md"}`}>
        <div className="flex justify-between items-center">
          {/* Left side: hamburger + logo */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
              aria-label="Toggle navigation menu">
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link to="/" className="flex items-center">
              <img
                src="/assets/savr-logo(primary).svg"
                alt="Savr Logo"
                className="h-6"
              />
            </Link>
          </div>

          {/* Right side: Chat action buttons - only on /chat route */}
          {location.pathname === '/chat' && (
            <div className="flex items-center space-x-1">
              <button
                onClick={async () => {
                  // Note: We intentionally do NOT call clearCurrentSessionList here.
                  // The list should keep its chat_session_id so users can return to the
                  // chat history later by selecting the list.
                  setUserScopedSessionId(null);
                  localStorage.removeItem('savr-chat-storage');
                  useChatStore.getState().clearChat();
                  useListStore.getState().selectList(null);
                  useListStore.getState().setDrawerState('collapsed');
                  window.location.reload();
                }}
                className="flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
                title="New Chat"
              >
                <MessageSquarePlus size={20} />
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-store-selector'))}
                className="flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
                title="Select Stores"
              >
                <MapPin size={20} />
              </button>
              <PreferencesDropdown variant="mobile" />
            </div>
          )}
        </div>
      </header>

      {/* Mobile/Tablet Overlay Sidebar */}
      <div
        className="fixed inset-0 z-50 lg:hidden"
        style={{ pointerEvents: sidebarOpen ? "auto" : "none" }}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-150"
          style={{ opacity: sidebarOpen ? 1 : 0 }}
          onClick={() => setSidebarOpen(false)}
        />
        {/* Sidebar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-72 max-w-[75vw] bg-white dark:bg-slate-800 transform transition-transform duration-150 ease-out"
          style={{
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          }}>
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-6 pt-8 pb-4 flex items-center justify-between gap-3">
              <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center">
                <img
                  src="/assets/savr-logo(primary).svg"
                  alt="Savr Logo"
                  className="h-6"
                />
              </Link>
              <button
                onClick={() => {
                  handleNewChat();
                  setSidebarOpen(false);
                }}
                disabled={isCreatingNewChat}
                className="flex items-center justify-center h-11 w-11 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="Start new chat"
              >
                {isCreatingNewChat ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus size={24} />}
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
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 group ${
                        isActive(item.path)
                          ? "text-green-700"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      }`}>
                      <span
                        className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-300 ${
                          isActive(item.path)
                            ? "bg-green-500/10 text-green-600"
                            : "bg-slate-100 text-slate-500 group-hover:text-slate-700"
                        }`}>
                        {item.icon}
                      </span>
                      <span
                        className={`text-sm font-medium leading-tight ${
                          isActive(item.path)
                            ? "text-green-700"
                            : "text-slate-700 group-hover:text-slate-900"
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
                    className="w-full flex items-center justify-between gap-3 px-3 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                        <ShoppingCart size={20} />
                      </span>
                      <span className="text-sm font-medium leading-tight">
                        My Lists
                      </span>
                    </div>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform duration-200 ${
                        listsExpanded ? 'rotate-180' : 'rotate-0'
                      }`}
                    />
                  </button>
                </li>
              </ul>
            </nav>

            {/* My Lists Content - Mobile (Collapsible) */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              listsExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="px-6 pb-4">
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
                  <div className="space-y-1 max-h-64 overflow-y-auto">
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

            {/* Spacer to push footer to bottom */}
            <div className="flex-1"></div>


            {/* Footer */}
            <div className="px-6 py-6 border-t border-slate-200 space-y-3">
              {/* Admin Portal Link - mobile */}
              {(user as any)?.is_admin === true && (
                <Link
                  to="/admin"
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 group ${
                    isActive("/admin")
                      ? "bg-gradient-to-r from-green-500/15 to-green-600/15 text-green-700"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}>
                  <span
                    className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-300 ${
                      isActive("/admin")
                        ? "bg-green-500/10 text-green-600"
                        : "bg-slate-100 text-slate-500 group-hover:text-slate-700"
                    }`}
                  >
                    <Shield size={18} />
                  </span>
                  <span
                    className={`text-sm font-medium leading-tight ${
                      isActive("/admin")
                        ? "text-green-700"
                        : "text-slate-700 group-hover:text-slate-900"
                    }`}
                  >
                    Admin Portal
                  </span>
                </Link>
              )}
              {/* Profile Link */}
              <Link
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 group ${
                  isActive("/profile")
                    ? "bg-gradient-to-r from-green-500/15 to-green-600/15 text-green-700"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}>
                <span
                  className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-300 ${
                    isActive("/profile")
                      ? "bg-green-500/10 text-green-600"
                      : "bg-slate-100 text-slate-500 group-hover:text-slate-700"
                  }`}
                >
                  <UserCircle size={18} />
                </span>
                <span
                  className={`text-sm font-medium leading-tight ${
                    isActive("/profile")
                      ? "text-green-700"
                      : "text-slate-700 group-hover:text-slate-900"
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
                className="w-full flex items-center gap-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-300 font-medium group"
              >
                <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-500 group-hover:text-slate-700">
                  <LogOut size={16} className="transition-transform duration-300 group-hover:scale-110" />
                </span>
                <span className="text-sm leading-tight">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="flex flex-1 min-h-0">
        <nav 
          className={`hidden lg:block bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out ${
            sidebarHovered ? 'w-64' : 'w-20'
          }`}
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="bg-white dark:bg-slate-800 flex-shrink-0 h-16 lg:h-20 flex items-center justify-center px-2">
              <Link to="/" className="flex items-center justify-center group w-full">
                <img
                  src="/assets/savr-logo(primary).svg"
                  alt="Savr Logo"
                  className="h-6 group-hover:scale-105 transition-transform duration-300"
                />
              </Link>
            </div>

            {/* Navigation */}
            <div className="px-3 py-4">
              <ul className="space-y-2">
                {/* New Chat Button */}
                <li>
                  <button
                    onClick={handleNewChat}
                    disabled={isCreatingNewChat}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700 transition-colors flex-shrink-0">
                      {isCreatingNewChat ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Plus size={20} />
                      )}
                    </span>
                    <span 
                      className={`font-medium text-sm transition-all duration-300 ${
                        sidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                      } text-slate-700 group-hover:text-slate-900`}
                    >
                      New Chat
                    </span>
                  </button>
                </li>
                
                {desktopNavItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group ${
                        isActive(item.path)
                          ? "bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-700"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span
                        className={`flex items-center justify-center h-8 w-8 rounded-lg transition-colors flex-shrink-0 ${
                          isActive(item.path)
                            ? 'bg-green-500/20 text-green-600'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span 
                        className={`font-medium text-sm transition-all duration-300 ${
                          sidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                        } ${
                          isActive(item.path)
                            ? "text-green-700"
                            : "text-slate-700 group-hover:text-slate-900"
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
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex-shrink-0">
                        <ShoppingCart size={20} />
                      </span>
                      <span 
                        className={`font-medium text-sm transition-all duration-300 ${
                          sidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                        }`}
                      >
                        My Lists
                      </span>
                    </div>
                    <ChevronDown 
                      className={`h-4 w-4 transition-all duration-300 ${
                        sidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                      } ${
                        listsExpanded ? 'rotate-180' : 'rotate-0'
                      }`}
                    />
                  </button>
                </li>
              </ul>
            </div>

            {/* Lists Content - Desktop (appears on hover and when expanded) */}
            <div className={`flex-1 min-h-0 overflow-hidden transition-all duration-300 ease-in-out ${
              sidebarHovered && listsExpanded ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="h-full overflow-y-auto px-3 pb-3">
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

            {/* Profile & Logout - Fixed at bottom */}
            <div className="bg-white dark:bg-slate-800 flex-shrink-0 space-y-2 px-3 py-4 border-t border-slate-200 dark:border-slate-700">
              {/* Admin Portal Link - desktop */}
              {(user as any)?.is_admin === true && (
                <Link
                  to="/admin"
                  title="Admin Portal"
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group ${
                    isActive("/admin")
                      ? "bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-700"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center h-8 w-8 rounded-lg transition-colors flex-shrink-0 ${
                      isActive("/admin")
                        ? 'bg-green-500/20 text-green-600'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                    }`}
                  >
                    <Shield size={18} />
                  </span>
                  <span
                    className={`font-medium text-sm transition-all duration-300 ${
                      sidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                    } ${
                      isActive("/admin")
                        ? "text-green-700"
                        : "text-slate-700 group-hover:text-slate-900"
                    }`}
                  >
                    Admin Portal
                  </span>
                </Link>
              )}
              <Link
                to="/profile"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group ${
                  isActive("/profile")
                    ? "bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-700"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span
                  className={`flex items-center justify-center h-8 w-8 rounded-lg transition-colors flex-shrink-0 ${
                    isActive("/profile")
                      ? 'bg-green-500/20 text-green-600'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                  }`}
                >
                  <UserCircle size={18} />
                </span>
                <span 
                  className={`font-medium text-sm transition-all duration-300 ${
                    sidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                  } ${
                    isActive("/profile")
                      ? "text-green-700"
                      : "text-slate-700 group-hover:text-slate-900"
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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300 font-medium group"
              >
                <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700 transition-colors flex-shrink-0">
                  <LogOut size={16} />
                </span>
                <span 
                  className={`text-sm transition-all duration-300 ${
                    sidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                  }`}
                >
                  Logout
                </span>
              </button>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main
          ref={mainRef}
          className="flex-1 min-h-0 bg-white dark:bg-slate-900 overflow-y-auto lg:pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
