import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MessageSquarePlus,
  Calendar,
  MoreVertical,
  Edit,
  Copy,
  Share2,
  Trash2,
  Loader2,
  X,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import useListStore from '@/stores/listStore';
import { SavedGroceryList } from '@/services/groceryListService';

interface ListSidebarProps {
  className?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  onStartNewChat: () => void;
  onDeleteList?: (list: SavedGroceryList) => void;
}

// Individual list card component
const ListCard = React.memo(({
  list,
  isSelected,
  onSelect,
  onDelete,
  onRename,
}: {
  list: SavedGroceryList;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  onRename?: (newName: string) => void;
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(list.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleSaveRename = useCallback(() => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== list.name) {
      onRename?.(trimmed);
    }
    setIsRenaming(false);
  }, [renameValue, list.name, onRename]);

  const handleCancelRename = useCallback(() => {
    setRenameValue(list.name);
    setIsRenaming(false);
  }, [list.name]);

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected
          ? 'ring-2 ring-green-500 bg-green-50/50 dark:bg-green-900/20'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-1 pt-3 flex flex-row items-start justify-between">
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <Input
              ref={inputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleSaveRename(); }
                if (e.key === 'Escape') { e.preventDefault(); handleCancelRename(); }
              }}
              onBlur={handleSaveRename}
              onClick={(e) => e.stopPropagation()}
              className="h-7 text-sm font-medium"
              autoComplete="off"
            />
          ) : (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="text-sm font-medium truncate pr-2">{list.name}</CardTitle>
                </TooltipTrigger>
                <TooltipContent side="right" align="start">
                  <p>{list.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <CardDescription className="flex items-center gap-1 text-xs mt-0.5">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(list.createdAt)}</span>
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-2 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setRenameValue(list.name);
                // Delay so Radix dropdown finishes its focus restoration before we show the input
                setTimeout(() => setIsRenaming(true), 50);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            {onDelete && (
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <span className="text-xs text-muted-foreground">
          {list.items.length} item{list.items.length !== 1 ? 's' : ''}
        </span>
      </CardContent>
    </Card>
  );
});

ListCard.displayName = 'ListCard';

export function ListSidebar({
  className,
  isMobileOpen,
  onMobileClose,
  onStartNewChat,
  onDeleteList,
}: ListSidebarProps) {
  const {
    lists,
    isLoadingLists,
    selectedListId,
    selectList,
    fetchLists,
    renameList,
  } = useListStore();

  const { toast } = useToast();

  // Fetch lists on mount
  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleSelectList = (list: SavedGroceryList) => {
    selectList(list.id);
    // Close mobile sidebar on selection
    onMobileClose?.();
  };

  const handleRenameList = async (list: SavedGroceryList, newName: string) => {
    try {
      await renameList(list.id, newName);
      toast({ description: 'List renamed', duration: 2000 });
    } catch {
      toast({ variant: 'destructive', description: 'Failed to rename list', duration: 3000 });
    }
  };

  const handleNewChat = () => {
    onStartNewChat();
    onMobileClose?.();
  };

  // Sidebar content - shared between desktop and mobile
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          My Lists
        </h2>
        {isMobileOpen && onMobileClose && (
          <Button variant="ghost" size="icon" onClick={onMobileClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button
          onClick={handleNewChat}
          className="w-full bg-green-500 hover:bg-green-600 text-white"
          size="sm"
        >
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* List Items */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoadingLists ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-green-500" />
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No lists yet</p>
            <p className="text-xs mt-1">Start a chat to create your first list</p>
          </div>
        ) : (
          <div className="space-y-2">
            {lists.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                isSelected={selectedListId === list.id}
                onSelect={() => handleSelectList(list)}
                onRename={(newName) => handleRenameList(list, newName)}
                onDelete={onDeleteList ? () => onDeleteList(list) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Desktop sidebar - fixed width
  const desktopSidebar = (
    <aside
      className={cn(
        'hidden lg:flex flex-col w-72 h-full border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800',
        className
      )}
    >
      {sidebarContent}
    </aside>
  );

  // Mobile sidebar - overlay
  const mobileSidebar = isMobileOpen ? (
    <div className="lg:hidden fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onMobileClose}
      />
      {/* Sidebar panel */}
      <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-slate-800 shadow-xl animate-in slide-in-from-left duration-300">
        {sidebarContent}
      </div>
    </div>
  ) : null;

  return (
    <>
      {desktopSidebar}
      {mobileSidebar}
    </>
  );
}

export default ListSidebar;
