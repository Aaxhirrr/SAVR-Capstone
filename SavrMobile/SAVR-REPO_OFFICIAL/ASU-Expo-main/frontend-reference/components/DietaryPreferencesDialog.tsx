import { useEffect, useMemo, useState } from "react";
import { Check, Plus, X } from "lucide-react";

import authService from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const COMMON_DIETARY_RESTRICTIONS = [
  "Gluten Free",
  "Dairy Free",
  "Nut Allergy",
  "Peanut Allergy",
  "Shellfish Allergy",
  "Vegetarian",
  "Vegan",
  "Kosher",
  "Halal",
  "Keto",
  "Paleo",
  "Diabetic",
  "Low Sodium",
  "Low FODMAP",
  "Weight Watchers",
  "Celiac Disease",
  "Pescatarian",
  "Soy Allergy",
  "Egg Allergy",
  "Low Carb",
] as const;

type BrandMap = Record<string, string>;

export function DietaryPreferencesDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();

  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [newRestriction, setNewRestriction] = useState("");
  const [likedBrands, setLikedBrands] = useState<BrandMap>({});
  const [dislikedBrands, setDislikedBrands] = useState<BrandMap>({});
  const [newLikedCategory, setNewLikedCategory] = useState("");
  const [newLikedBrand, setNewLikedBrand] = useState("");
  const [newDislikedCategory, setNewDislikedCategory] = useState("");
  const [newDislikedBrand, setNewDislikedBrand] = useState("");
  const [saving, setSaving] = useState(false);

  const sortedRestrictions = useMemo(() => {
    return [...dietaryRestrictions].sort((a, b) => a.localeCompare(b));
  }, [dietaryRestrictions]);

  const sortedLikedBrands = useMemo(
    () =>
      Object.entries(likedBrands).sort(([a], [b]) => a.localeCompare(b)),
    [likedBrands],
  );

  const sortedDislikedBrands = useMemo(
    () =>
      Object.entries(dislikedBrands).sort(([a], [b]) => a.localeCompare(b)),
    [dislikedBrands],
  );

  const normalizeBrandMap = (value: unknown): BrandMap => {
    if (!value || typeof value !== "object") return {};
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([k, v]) => !!k?.trim() && typeof v === "string" && !!v.trim())
        .map(([k, v]) => [k.trim(), (v as string).trim()]),
    );
  };

  const syncFromUser = (userLike: any) => {
    const restrictions =
      userLike?.dietaryRestrictions || userLike?.dietary_restrictions || [];
    if (Array.isArray(restrictions)) setDietaryRestrictions(restrictions);

    const prefs = userLike?.brandPreferences || userLike?.brand_preferences;
    if (prefs && typeof prefs === "object") {
      if ("liked" in prefs || "disliked" in prefs) {
        setLikedBrands(normalizeBrandMap((prefs as any).liked));
        setDislikedBrands(normalizeBrandMap((prefs as any).disliked));
      } else {
        setLikedBrands(normalizeBrandMap(prefs));
        setDislikedBrands({});
      }
    } else {
      setLikedBrands({});
      setDislikedBrands({});
    }
  };

  // Initialize from current user when opened.
  useEffect(() => {
    if (!isOpen) return;
    try {
      syncFromUser(authService.getCurrentUser() as any);
    } catch {
      // ignore
    }
  }, [isOpen]);

  // Live-sync with updates from other surfaces (Profile page, dropdown, etc).
  useEffect(() => {
    const handler = (e: Event) =>
      syncFromUser((e as CustomEvent).detail as any);

    const storageHandler = (e: StorageEvent) => {
      if (e.key !== "user" || !e.newValue) return;
      try {
        syncFromUser(JSON.parse(e.newValue));
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

  const persistDietary = async (next: string[]) => {
    setDietaryRestrictions(next);
    setSaving(true);
    try {
      await authService.updateProfile({ dietaryRestrictions: next });
    } catch {
      toast({
        title: "Save failed",
        description: "Could not update dietary preferences.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const persistBrands = async (
    nextLiked: BrandMap,
    nextDisliked: BrandMap,
  ) => {
    setLikedBrands(nextLiked);
    setDislikedBrands(nextDisliked);
    setSaving(true);
    try {
      await authService.updateProfile({
        brandPreferences: { liked: nextLiked, disliked: nextDisliked },
      });
    } catch {
      toast({
        title: "Save failed",
        description: "Could not update brand preferences.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCommon = async (restriction: string) => {
    const exists = dietaryRestrictions.includes(restriction);
    const next = exists
      ? dietaryRestrictions.filter((r) => r !== restriction)
      : [...dietaryRestrictions, restriction];
    await persistDietary(next);
  };

  const addCustom = async () => {
    const trimmed = newRestriction.trim();
    if (!trimmed) return;
    if (dietaryRestrictions.includes(trimmed)) {
      setNewRestriction("");
      return;
    }
    await persistDietary([...dietaryRestrictions, trimmed]);
    setNewRestriction("");
  };

  const removeRestriction = async (restriction: string) => {
    await persistDietary(dietaryRestrictions.filter((r) => r !== restriction));
  };

  const addBrand = async (type: "liked" | "disliked") => {
    const category =
      type === "liked"
        ? newLikedCategory.trim()
        : newDislikedCategory.trim();
    const brand = type === "liked" ? newLikedBrand.trim() : newDislikedBrand.trim();
    if (!category || !brand) return;

    if (type === "liked") {
      const nextLiked = { ...likedBrands, [category]: brand };
      await persistBrands(nextLiked, dislikedBrands);
      setNewLikedCategory("");
      setNewLikedBrand("");
      return;
    }

    const nextDisliked = { ...dislikedBrands, [category]: brand };
    await persistBrands(likedBrands, nextDisliked);
    setNewDislikedCategory("");
    setNewDislikedBrand("");
  };

  const removeBrand = async (type: "liked" | "disliked", category: string) => {
    if (type === "liked") {
      const nextLiked = { ...likedBrands };
      delete nextLiked[category];
      await persistBrands(nextLiked, dislikedBrands);
      return;
    }

    const nextDisliked = { ...dislikedBrands };
    delete nextDisliked[category];
    await persistBrands(likedBrands, nextDisliked);
  };

  const handleSavePreferences = () => {
    toast({
      title: "Preferences saved",
      description: "Your dietary preferences are up to date.",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl h-[100svh] md:h-[90vh] p-0 flex flex-col overflow-hidden gap-0">
        <DialogHeader className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3 border-b border-slate-200/70 dark:border-slate-700/60 flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg">
            Dietary Preferences
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Manage your dietary and brand preferences.
          </p>
        </DialogHeader>

        <div className="flex-1 px-5 sm:px-6 py-4 overflow-y-auto space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Common
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_DIETARY_RESTRICTIONS.map((r) => {
                const selected = dietaryRestrictions.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleCommon(r)}
                    disabled={saving}
                    className={[
                      "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                      selected
                        ? "border-emerald-300/80 bg-emerald-50 text-emerald-900 dark:border-emerald-700/70 dark:bg-emerald-900/20 dark:text-emerald-200"
                        : "border-slate-200/70 bg-white hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-900 dark:hover:bg-slate-800",
                      saving ? "opacity-70" : "",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-5 w-5 items-center justify-center rounded-md border",
                        selected
                          ? "border-emerald-300/80 bg-emerald-200/60 dark:border-emerald-700/70 dark:bg-emerald-800/40"
                          : "border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-900",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      {selected && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0 truncate">{r}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Add Custom
            </h3>
            <div className="flex gap-2">
              <Input
                value={newRestriction}
                onChange={(e) => setNewRestriction(e.target.value)}
                placeholder="Add a restriction..."
                className="h-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void addCustom();
                  }
                }}
                disabled={saving}
              />
              <Button
                type="button"
                onClick={() => void addCustom()}
                className="h-10 w-10 p-0"
                disabled={saving || !newRestriction.trim()}
                aria-label="Add restriction"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Selected
            </h3>
            {sortedRestrictions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No restrictions selected.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sortedRestrictions.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <span className="max-w-[70vw] sm:max-w-[280px] truncate">
                      {r}
                    </span>
                    <button
                      type="button"
                      onClick={() => void removeRestriction(r)}
                      disabled={saving}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                      aria-label={`Remove ${r}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200/70 dark:border-slate-700/60 pt-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Brand Preferences
            </h3>

            <div className="space-y-3">
              <h4 className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Liked Brands
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                <Input
                  value={newLikedCategory}
                  onChange={(e) => setNewLikedCategory(e.target.value)}
                  placeholder="Category (e.g., yogurt)"
                  className="h-10"
                  disabled={saving}
                />
                <Input
                  value={newLikedBrand}
                  onChange={(e) => setNewLikedBrand(e.target.value)}
                  placeholder="Brand"
                  className="h-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void addBrand("liked");
                    }
                  }}
                  disabled={saving}
                />
                <Button
                  type="button"
                  onClick={() => void addBrand("liked")}
                  className="h-10 sm:w-10 sm:p-0"
                  disabled={saving || !newLikedCategory.trim() || !newLikedBrand.trim()}
                  aria-label="Add liked brand"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              {sortedLikedBrands.length === 0 ? (
                <p className="text-sm text-muted-foreground">No liked brands added.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sortedLikedBrands.map(([category, brand]) => (
                    <span
                      key={`liked-${category}`}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200"
                    >
                      <span className="max-w-[70vw] sm:max-w-[300px] truncate">
                        {category}: {brand}
                      </span>
                      <button
                        type="button"
                        onClick={() => void removeBrand("liked", category)}
                        disabled={saving}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-800/40"
                        aria-label={`Remove liked brand for ${category}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Disliked Brands
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                <Input
                  value={newDislikedCategory}
                  onChange={(e) => setNewDislikedCategory(e.target.value)}
                  placeholder="Category (e.g., cereal)"
                  className="h-10"
                  disabled={saving}
                />
                <Input
                  value={newDislikedBrand}
                  onChange={(e) => setNewDislikedBrand(e.target.value)}
                  placeholder="Brand"
                  className="h-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void addBrand("disliked");
                    }
                  }}
                  disabled={saving}
                />
                <Button
                  type="button"
                  onClick={() => void addBrand("disliked")}
                  className="h-10 sm:w-10 sm:p-0"
                  disabled={
                    saving ||
                    !newDislikedCategory.trim() ||
                    !newDislikedBrand.trim()
                  }
                  aria-label="Add disliked brand"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              {sortedDislikedBrands.length === 0 ? (
                <p className="text-sm text-muted-foreground">No disliked brands added.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sortedDislikedBrands.map(([category, brand]) => (
                    <span
                      key={`disliked-${category}`}
                      className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-sm text-rose-900 dark:bg-rose-900/20 dark:text-rose-200"
                    >
                      <span className="max-w-[70vw] sm:max-w-[300px] truncate">
                        {category}: {brand}
                      </span>
                      <button
                        type="button"
                        onClick={() => void removeBrand("disliked", category)}
                        disabled={saving}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-rose-100 dark:hover:bg-rose-800/40"
                        aria-label={`Remove disliked brand for ${category}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 border-t border-slate-200/70 dark:border-slate-700/60 px-5 sm:px-6 py-3 bg-white/95 dark:bg-slate-900/95">
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSavePreferences}
              disabled={saving}
              className="min-w-[150px]"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DietaryPreferencesDialog;
