import { useState, useEffect } from 'react';
import { Heart, Plus, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import authService from '@/services/authService';

interface PreferencesDropdownProps {
  variant?: 'desktop' | 'mobile';
}

export function PreferencesDropdown({ variant = 'desktop' }: PreferencesDropdownProps) {
  const { toast } = useToast();

  // Preferences UI state
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [newDietaryRestriction, setNewDietaryRestriction] = useState('');
  const [likedBrands, setLikedBrands] = useState<{ [key: string]: string }>({});
  const [dislikedBrands, setDislikedBrands] = useState<{ [key: string]: string }>({});
  const [newLikedCategory, setNewLikedCategory] = useState('');
  const [newLikedBrand, setNewLikedBrand] = useState('');
  const [newDislikedCategory, setNewDislikedCategory] = useState('');
  const [newDislikedBrand, setNewDislikedBrand] = useState('');

  // Initialize preferences from current user
  useEffect(() => {
    try {
      const user = authService.getCurrentUser() as any;
      if (user) {
        const restrictions = user.dietaryRestrictions || user.dietary_restrictions || [];
        if (Array.isArray(restrictions)) {
          setDietaryRestrictions(restrictions as string[]);
        }
        const prefs = user.brandPreferences || user.brand_preferences;
        if (prefs && typeof prefs === 'object') {
          if ('liked' in prefs && 'disliked' in prefs) {
            setLikedBrands(((prefs as any).liked || {}) as Record<string, string>);
            setDislikedBrands(((prefs as any).disliked || {}) as Record<string, string>);
          } else {
            setLikedBrands(prefs as Record<string, string>);
            setDislikedBrands({});
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load user preferences');
    }
  }, []);

  // Keep in sync with updates from other surfaces (e.g., Profile page or in-chat dialog).
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as any;
      if (!detail) return;

      const restrictions =
        detail.dietaryRestrictions || detail.dietary_restrictions || [];
      if (Array.isArray(restrictions)) {
        setDietaryRestrictions(restrictions as string[]);
      }

      const prefs = detail.brandPreferences || detail.brand_preferences;
      if (prefs && typeof prefs === "object") {
        if ("liked" in prefs && "disliked" in prefs) {
          setLikedBrands(((prefs as any).liked || {}) as Record<string, string>);
          setDislikedBrands(
            ((prefs as any).disliked || {}) as Record<string, string>,
          );
        } else {
          setLikedBrands(prefs as Record<string, string>);
          setDislikedBrands({});
        }
      }
    };

    const storageHandler = (e: StorageEvent) => {
      if (e.key !== "user" || !e.newValue) return;
      try {
        handler(new CustomEvent("auth-profile-updated", { detail: JSON.parse(e.newValue) }));
      } catch {
        // ignore
      }
    };

    window.addEventListener("auth-profile-updated", handler);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener("auth-profile-updated", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const addDietaryRestriction = async () => {
    if (newDietaryRestriction && !dietaryRestrictions.includes(newDietaryRestriction)) {
      const updated = [...dietaryRestrictions, newDietaryRestriction];
      setDietaryRestrictions(updated);
      setNewDietaryRestriction('');
      try {
        await authService.updateProfile({ dietaryRestrictions: updated });
        toast({ title: 'Restriction added', description: 'Your dietary restriction has been saved.' });
      } catch (e) {
        toast({ title: 'Save failed', description: 'Could not save dietary restriction.', variant: 'destructive' });
      }
    }
  };

  const removeDietaryRestriction = async (restriction: string) => {
    const updated = dietaryRestrictions.filter(r => r !== restriction);
    setDietaryRestrictions(updated);
    try {
      await authService.updateProfile({ dietaryRestrictions: updated });
      toast({ title: 'Restriction removed', description: 'Your dietary restrictions have been updated.' });
    } catch (e) {
      toast({ title: 'Save failed', description: 'Could not update dietary restrictions.', variant: 'destructive' });
    }
  };

  const addBrand = async (type: 'liked' | 'disliked') => {
    if (type === 'liked' && newLikedCategory && newLikedBrand) {
      const next = { ...likedBrands, [newLikedCategory]: newLikedBrand };
      setLikedBrands(next);
      setNewLikedCategory('');
      setNewLikedBrand('');
      try {
        await authService.updateProfile({ brandPreferences: { liked: next, disliked: dislikedBrands } });
        toast({ title: 'Brand added', description: 'Your liked brand has been saved.' });
      } catch (e) {
        toast({ title: 'Save failed', description: 'Could not save brand preference.', variant: 'destructive' });
      }
    } else if (type === 'disliked' && newDislikedCategory && newDislikedBrand) {
      const next = { ...dislikedBrands, [newDislikedCategory]: newDislikedBrand };
      setDislikedBrands(next);
      setNewDislikedCategory('');
      setNewDislikedBrand('');
      try {
        await authService.updateProfile({ brandPreferences: { liked: likedBrands, disliked: next } });
        toast({ title: 'Brand added', description: 'Your disliked brand has been saved.' });
      } catch (e) {
        toast({ title: 'Save failed', description: 'Could not save brand preference.', variant: 'destructive' });
      }
    }
  };

  const removeBrand = async (type: 'liked' | 'disliked', category: string) => {
    if (type === 'liked') {
      const next = { ...likedBrands };
      delete next[category];
      setLikedBrands(next);
      try {
        await authService.updateProfile({ brandPreferences: { liked: next, disliked: dislikedBrands } });
        toast({ title: 'Brand removed', description: 'Your liked brands have been updated.' });
      } catch (e) {
        toast({ title: 'Save failed', description: 'Could not update brand preferences.', variant: 'destructive' });
      }
    } else {
      const next = { ...dislikedBrands };
      delete next[category];
      setDislikedBrands(next);
      try {
        await authService.updateProfile({ brandPreferences: { liked: likedBrands, disliked: next } });
        toast({ title: 'Brand removed', description: 'Your disliked brands have been updated.' });
      } catch (e) {
        toast({ title: 'Save failed', description: 'Could not update brand preferences.', variant: 'destructive' });
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'mobile' ? (
          <button
            className="flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
            title="Preferences"
          >
            <Heart size={20} />
          </button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 dark:border-slate-600 h-9 px-3 sm:h-8 sm:px-2 md:h-9 md:px-3"
            title="Preferences"
          >
            <Heart className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 sm:mr-1 md:mr-2" />
            <span className="hidden sm:inline text-xs md:text-sm">Preferences</span>
            <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 ml-0.5 sm:ml-1" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-4">
        <div className="space-y-4">
          {/* Dietary Restrictions */}
          <div>
            <h3 className="text-sm font-heading font-semibold text-slate-900 dark:text-white mb-2">Dietary Restrictions</h3>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  placeholder="Add restriction..."
                  value={newDietaryRestriction}
                  onChange={(e) => setNewDietaryRestriction(e.target.value)}
                  className="text-base h-8 font-body"
                  onKeyPress={(e) => e.key === 'Enter' && addDietaryRestriction()}
                />
                <Button size="sm" onClick={addDietaryRestriction} className="h-8 px-2">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {dietaryRestrictions.map((restriction) => (
                  <div key={restriction} className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                    <span className="text-slate-700 dark:text-slate-300">{restriction}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDietaryRestriction(restriction)}
                      className="h-5 w-5 p-0 hover:bg-slate-200 dark:hover:bg-slate-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DropdownMenuSeparator />
          {/* Brand Preferences */}
          <div>
            <h3 className="text-sm font-heading font-semibold text-slate-900 dark:text-white mb-2">Brand Preferences</h3>
            <div className="space-y-2 mb-3">
              <h4 className="text-xs font-body font-medium text-slate-600 dark:text-slate-400">Liked Brands</h4>
              <div className="flex space-x-2">
                <Input placeholder="Category" value={newLikedCategory} onChange={(e) => setNewLikedCategory(e.target.value)} className="text-base h-8 font-body" />
                <Input placeholder="Brand" value={newLikedBrand} onChange={(e) => setNewLikedBrand(e.target.value)} className="text-base h-8 font-body" onKeyPress={(e) => e.key === 'Enter' && addBrand('liked')} />
                <Button size="sm" onClick={() => addBrand('liked')} className="h-8 px-2">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1 max-h-16 overflow-y-auto">
                {Object.entries(likedBrands as Record<string, string>).map(([category, brand]) => (
                  <div key={category} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-xs">
                    <span className="text-slate-700 dark:text-slate-300">{category}: {brand as string}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeBrand('liked', category)} className="h-5 w-5 p-0 hover:bg-green-100 dark:hover:bg-green-800/30">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-body font-medium text-slate-600 dark:text-slate-400">Disliked Brands</h4>
              <div className="flex space-x-2">
                <Input placeholder="Category" value={newDislikedCategory} onChange={(e) => setNewDislikedCategory(e.target.value)} className="text-base h-8 font-body" />
                <Input placeholder="Brand" value={newDislikedBrand} onChange={(e) => setNewDislikedBrand(e.target.value)} className="text-base h-8 font-body" onKeyPress={(e) => e.key === 'Enter' && addBrand('disliked')} />
                <Button size="sm" onClick={() => addBrand('disliked')} className="h-8 px-2">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1 max-h-16 overflow-y-auto">
                {Object.entries(dislikedBrands as Record<string, string>).map(([category, brand]) => (
                  <div key={category} className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-xs">
                    <span className="text-slate-700 dark:text-slate-300">{category}: {brand as string}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeBrand('disliked', category)} className="h-5 w-5 p-0 hover:bg-red-100 dark:hover:bg-red-800/30">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default PreferencesDropdown;
