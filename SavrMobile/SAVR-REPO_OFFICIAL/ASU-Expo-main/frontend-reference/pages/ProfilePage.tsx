import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import storeService from '../services/storeService';
import AddressAutocomplete, { type ParsedAddress } from '@/components/AddressAutocomplete';
import { PROVINCE_NAME_TO_CODE, formatPostalCode } from '@/lib/addressUtils';

// Google icon component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// Common dietary restrictions
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
  "High Protein"
];

// Validation functions
const validatePostalCode = (postalCode: string): boolean => {
  // Canadian postal code format: A1A 1A1
  const regex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
  return regex.test(postalCode);
};

const validatePhoneNumber = (phoneNumber: string): boolean => {
  // North American phone number format
  const regex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return regex.test(phoneNumber);
};

type TabType = 'profile' | 'account' | 'preferences' | 'dietary';

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Form state
  const [email, setEmail] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [street, setStreet] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [province, setProvince] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  // Validation states
  const [_postalCodeError, setPostalCodeError] = useState<string | null>(null);
  const [phoneNumberError, setPhoneNumberError] = useState<string | null>(null);
  
  // New sections
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [newDietaryRestriction, setNewDietaryRestriction] = useState<string>('');
  const [likedBrands, setLikedBrands] = useState<{[key: string]: string}>({});
  const [dislikedBrands, setDislikedBrands] = useState<{[key: string]: string}>({});
  const [newLikedCategory, setNewLikedCategory] = useState<string>('');
  const [newLikedBrand, setNewLikedBrand] = useState<string>('');
  const [newDislikedCategory, setNewDislikedCategory] = useState<string>('');
  const [newDislikedBrand, setNewDislikedBrand] = useState<string>('');

  // Google linking state
  const [googleLinkLoading, setGoogleLinkLoading] = useState<boolean>(false);
  const [hasGoogleLinked, setHasGoogleLinked] = useState<boolean>(false);

  // Address autocomplete state
  const [addressDisplay, setAddressDisplay] = useState<string>('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Location detection state
  const [locationLoading, setLocationLoading] = useState<boolean>(false);

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const needsPassword = !hasGoogleLinked;
  const [deletePassword, setDeletePassword] = useState<string>('');
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Define fetchUserProfile function to be used in both useEffect and handleSubmit
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const user = await authService.getProfile();
      
      
      // Basic profile info
      setEmail(user.email || '');
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      
      // Address information
      if (user.address) {
        setStreet(user.address.street || '');
        setCity(user.address.city || '');
        setProvince(user.address.province || '');
        setPostalCode(user.address.postalCode || '');
        setPhoneNumber(user.address.phoneNumber || '');
        // Build display string for autocomplete input
        const parts = [user.address.street, user.address.city, user.address.province, user.address.postalCode].filter(Boolean);
        if (parts.length > 0) setAddressDisplay(parts.join(', '));
      }
      
      // Handle dietary restrictions (try both camelCase and snake_case formats)
      const restrictions = user.dietaryRestrictions || user.dietary_restrictions || [];
      
      // Ensure restrictions is always an array, even if it's not in the database
      if (Array.isArray(restrictions)) {
        setDietaryRestrictions(restrictions);
      } else {
        console.warn('Unexpected format for dietary restrictions:', restrictions);
        setDietaryRestrictions([]);
      }
      
      // Handle brand preferences (try both formats)
      if (user.brandPreferences || user.brand_preferences) {
        const prefs = user.brandPreferences || user.brand_preferences;
        
        if (prefs && typeof prefs === 'object') {
          if (prefs.liked && prefs.disliked) {
            // New format with liked/disliked structure
            setLikedBrands(
              typeof prefs.liked === 'object' && prefs.liked !== null
                ? (prefs.liked as { [key: string]: string })
                : {}
            );
            
            setDislikedBrands(
              typeof prefs.disliked === 'object' && prefs.disliked !== null
                ? (prefs.disliked as { [key: string]: string })
                : {}
            );
            
          } else if (!('liked' in prefs) && !('disliked' in prefs)) {
            // Old format (flat object of categories to brands)
            setLikedBrands(prefs as { [key: string]: string });
            setDislikedBrands({});
          } else {
            // Fallback to empty objects
            console.warn('Unexpected structure in brand preferences:', prefs);
            setLikedBrands({});
            setDislikedBrands({});
          }
        } else {
          console.warn('Brand preferences is not an object:', prefs);
          setLikedBrands({});
          setDislikedBrands({});
        }
      } else {
        // No preferences at all
        setLikedBrands({});
        setDislikedBrands({});
      }
      
      // Check if Google account is linked
      setHasGoogleLinked(user.google_linked === true);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:');
      setError('Failed to load your profile information');
      setLoading(false);
    }
  };
  
  // Load user data
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Keep this page in sync with profile updates made elsewhere in-app.
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
          setLikedBrands(((prefs as any).liked || {}) as { [key: string]: string });
          setDislikedBrands(
            ((prefs as any).disliked || {}) as { [key: string]: string },
          );
        } else {
          setLikedBrands(prefs as { [key: string]: string });
          setDislikedBrands({});
        }
      }
    };

    const storageHandler = (e: StorageEvent) => {
      if (e.key !== "user" || !e.newValue) return;
      try {
        handler(
          new CustomEvent("auth-profile-updated", { detail: JSON.parse(e.newValue) }),
        );
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
  
  // Renamed this function to avoid conflict with react-hook-form
  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Basic form validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
      return;
    }
    if (!street.trim()) {
      setError('Street address is required');
      return;
    }
    if (!city.trim()) {
      setError('City is required');
      return;
    }
    if (!province.trim()) {
      setError('Province is required');
      return;
    }
    if (!postalCode.trim()) {
      setError('Postal code is required');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }
    
    // Validate postal code and phone number format
    if (!validatePostalCode(postalCode)) {
      setError('Please enter a valid Canadian postal code (format: A1A 1A1)');
      return;
    }
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const formattedPostalCode = postalCode.trim().toUpperCase();
      const formattedPhoneNumber = phoneNumber.trim();

      // Get current state from React state, not from potentially stale 'data' argument if manual validation is kept
      const currentDietaryRestrictions = [...dietaryRestrictions]; 
      const currentLikedBrands = {...likedBrands};
      const currentDislikedBrands = {...dislikedBrands};
      
      const profileData = {
        email,
        first_name: firstName,
        last_name: lastName,
        bio: '', // Assuming bio is not provided in the form
        address: {
          street,
          city,
          province,
          postalCode: formattedPostalCode,
          phoneNumber: formattedPhoneNumber
        },
        dietaryRestrictions: currentDietaryRestrictions,
        brandPreferences: {
          liked: currentLikedBrands,
          disliked: currentDislikedBrands
        }
      };
      
      
      const updatedUser = await authService.updateProfile(profileData);
      
      setSuccess('Your profile has been updated successfully');
      
      // Update state based on the validated data sent
      setEmail(updatedUser.email || '');
      setFirstName(updatedUser.first_name || '');
      setLastName(updatedUser.last_name || '');
      setStreet(updatedUser.address?.street || '');
      setCity(updatedUser.address?.city || '');
      setProvince(updatedUser.address?.province || '');
      setPostalCode(formattedPostalCode);
      setPhoneNumber(formattedPhoneNumber);
      // Keep local state for restrictions/prefs as they were sent
      setDietaryRestrictions(currentDietaryRestrictions);
      setLikedBrands(currentLikedBrands);
      setDislikedBrands(currentDislikedBrands);

      // Update localStorage
      try {
        localStorage.setItem('user', JSON.stringify({
          ...updatedUser, // Use response for ID, etc.
          ...profileData, // Ensure sent data overrides response where needed
          address: profileData.address, // Ensure address is updated
          dietaryRestrictions: currentDietaryRestrictions, // Ensure these are persisted
          brandPreferences: profileData.brandPreferences // Ensure these are persisted
        }));
      } catch (err) {
        console.error('Error updating localStorage:');
      }
      
      setSaving(false);
    } catch (error: any) {
        console.error('Error updating profile:');
        let errorMessage = 'Failed to update your profile';
        if (error.response) {
            const detail = error.response.data?.detail;
            if (typeof detail === 'string') {
              errorMessage = detail;
            } else if (Array.isArray(detail)) {
              errorMessage = detail.map((err: any) => 
                err.loc && err.msg ? `Error at ${err.loc.join('.')}: ${err.msg}` : JSON.stringify(err)
              ).join('\n');
            } else if (typeof detail === 'object' && detail !== null) {
              errorMessage = Object.entries(detail).map(([key, value]) => `${key}: ${value}`).join('\n');
            } else if (detail) {
              errorMessage = String(detail);
            } else if (typeof error.response.data === 'string') {
                errorMessage = error.response.data;
            }
        } else if (error.message) {
          errorMessage = error.message;
        }
        setError(`Update failed: ${errorMessage}`);
        setSaving(false);
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    if (value && !validatePhoneNumber(value)) {
      setPhoneNumberError('Please enter a valid phone number');
    } else {
      setPhoneNumberError(null);
    }
  };

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLocationLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      const { latitude, longitude } = position.coords;
      const address = await storeService.reverseGeocode(latitude, longitude);

      const provinceCode = PROVINCE_NAME_TO_CODE[address.province?.toLowerCase() ?? ''] || address.province || '';
      const postal = formatPostalCode(address.postalCode || '');

      setStreet(address.street || '');
      setCity(address.city || '');
      setProvince(provinceCode);
      setPostalCode(postal);
      setPostalCodeError(null);
      // Update autocomplete display and proximity coords
      const parts = [address.street, address.city, address.province, postal].filter(Boolean);
      setAddressDisplay(parts.join(', '));
      setUserCoords({ lat: latitude, lon: longitude });
    } catch (err: any) {
      if (err?.code === 1) {
        setError('Location access was denied. To enable it, click the lock icon in your browser\'s address bar, set Location to "Allow", then try again.');
      } else if (err?.code === 2) {
        setError('Could not determine your location. Please enter your address manually.');
      } else if (err?.code === 3) {
        setError('Location request timed out. Please enter your address manually.');
      } else {
        setError(`Could not auto-detect address: ${err?.message || 'unknown error'}. Please enter it manually.`);
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const addDietaryRestriction = () => {
    if (newDietaryRestriction && !dietaryRestrictions.includes(newDietaryRestriction)) {
      // Check that it's not already in the common restrictions list with different capitalization
      const normalizedNewRestriction = newDietaryRestriction.toLowerCase().trim();
      const alreadyExists = COMMON_DIETARY_RESTRICTIONS.some(
        restriction => restriction.toLowerCase() === normalizedNewRestriction
      );
      
      if (!alreadyExists) {
        setDietaryRestrictions([...dietaryRestrictions, newDietaryRestriction]);
        setNewDietaryRestriction('');
      } else {
        // Optionally show an error or just select the existing checkbox
        setError(`"${newDietaryRestriction}" is already in the common restrictions list.`);
        setTimeout(() => setError(null), 3000); // Clear error after 3 seconds
        setNewDietaryRestriction('');
      }
    }
  };

  const removeDietaryRestriction = (restriction: string) => {
    setDietaryRestrictions(dietaryRestrictions.filter(r => r !== restriction));
  };

  const addBrand = (type: 'liked' | 'disliked') => {
    if (type === 'liked' && newLikedCategory && newLikedBrand) {
      setLikedBrands({
        ...likedBrands,
        [newLikedCategory]: newLikedBrand
      });
      setNewLikedCategory('');
      setNewLikedBrand('');
    } else if (type === 'disliked' && newDislikedCategory && newDislikedBrand) {
      setDislikedBrands({
        ...dislikedBrands,
        [newDislikedCategory]: newDislikedBrand
      });
      setNewDislikedCategory('');
      setNewDislikedBrand('');
    }
  };

  const removeBrand = (type: 'liked' | 'disliked', category: string) => {
    if (type === 'liked') {
      const updatedPreferences = { ...likedBrands };
      delete updatedPreferences[category];
      setLikedBrands(updatedPreferences);
    } else {
      const updatedPreferences = { ...dislikedBrands };
      delete updatedPreferences[category];
      setDislikedBrands(updatedPreferences);
    }
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    
    // Password validation logic
    if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
    } else if (!/[A-Z]/.test(value)) {
      setPasswordError('Password must contain at least one uppercase letter');
    } else if (!/[a-z]/.test(value)) {
      setPasswordError('Password must contain at least one lowercase letter');
    } else if (!/[0-9]/.test(value)) {
      setPasswordError('Password must contain at least one number');
    } else if (!/[^A-Za-z0-9]/.test(value)) {
      setPasswordError('Password must contain at least one special character');
    } else {
      setPasswordError(null);
    }
    
    // Update confirm password error if confirm password exists
    if (confirmPassword) {
      if (confirmPassword !== value) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError(null);
      }
    }
  };
  
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    if (value !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError(null);
    }
  };
  
  const handlePasswordReset = async () => {
    if (currentPassword && newPassword && confirmPassword && !passwordError && !confirmPasswordError) {
      try {
        setSaving(true);
        setError(null);
        setSuccess(null);

        // Call the API to update the password
        await authService.updatePassword(currentPassword, newPassword);

        // Reset form and show success message
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('Your password has been updated successfully');
        setSaving(false);
      } catch (error: any) {
        console.error('Error updating password:');
        setError(error.message || 'Failed to update your password');
        setSaving(false);
      }
    }
  };

  // Handle Google account linking
  const handleLinkGoogle = async () => {
    setError(null);
    setGoogleLinkLoading(true);

    try {
      const authUrl = await authService.getGoogleAuthUrl();
      // Store a flag indicating we want to link (not login)
      sessionStorage.setItem('google_action', 'link');
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Google linking.');
      setGoogleLinkLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setDeleteError(null);

    // Validate confirmation text
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account deletion');
      return;
    }

    // Validate password
    if (!deletePassword) {
      setDeleteError('Please enter your password');
      return;
    }

    try {
      setDeleteLoading(true);
      await authService.deleteAccount(deletePassword, deleteConfirmText);
      // Redirect to login page after successful deletion
      navigate('/login');
    } catch (err: any) {
      console.error('Account deletion error:');
      setDeleteError(err.message || 'Failed to delete account. Please try again.');
      setDeleteLoading(false);
    }
  };

  const fieldClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500";
  const sectionClass =
    "rounded-2xl border border-slate-200/80 bg-slate-50/65 p-4 sm:p-5 dark:border-slate-700/80 dark:bg-slate-800/35";
  const tabButtonClass = (tab: TabType) =>
    `flex-shrink-0 rounded-xl border px-3 sm:px-4 py-2.5 text-sm font-semibold transition ${
      activeTab === tab
        ? "border-green-400/70 bg-green-50 text-green-700 shadow-sm dark:border-green-500/40 dark:bg-green-500/15 dark:text-green-300"
        : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
    }`;

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900">
        <div className="mx-auto flex h-[55vh] w-full max-w-5xl items-center justify-center px-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary/60 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            Loading profile information
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-900 relative">
      {/* Background with gradient blobs and food doodles from SVG - only visible in light mode */}
      <div className="pointer-events-none fixed inset-0 z-0 dark:hidden overflow-hidden">
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
        <div
          className="absolute inset-0 opacity-100 animate-[scrollHorizontal_50s_linear_infinite]"
          style={{
            backgroundImage: "url(/food-pattern.svg)",
            backgroundSize: "500px 500px",
            backgroundRepeat: "repeat",
            filter: "brightness(0) invert(1) drop-shadow(0 0 2px rgba(255,255,255,0.3))",
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
      <div className="relative z-10 mx-auto w-full max-w-5xl px-3 pb-10 pt-5 sm:px-6 sm:pt-8 lg:px-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8 text-center sm:text-left">
            <span className="inline-flex items-center rounded-full border border-green-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-green-700 shadow-sm dark:border-green-500/30 dark:bg-slate-900/70 dark:text-green-300">
              Account
            </span>
            <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl" style={{ fontFamily: '"Caprasimo", system-ui, sans-serif' }}>Profile Settings</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Manage your account details, dietary preferences, and brand picks.</p>
          </div>

          {/* Main Form Container */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-200/60 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-none">
            {/* Header inside form */}
            <div className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50/90 via-white to-emerald-50/70 px-4 py-4 sm:px-6 sm:py-5 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-md shadow-green-500/25 sm:h-11 sm:w-11">
                  <svg className="h-5 w-5 text-white sm:h-5.5 sm:w-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white sm:text-xl">Your Profile</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Update your account information</p>
                </div>
              </div>
            </div>
            
            {/* Error and Success Messages */}
            {error && (
              <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 dark:border-red-700/60 dark:bg-red-950/30 sm:mx-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}
            
            {success && (
              <div className="mx-4 mt-4 rounded-xl border border-green-200 bg-green-50/90 px-4 py-3 dark:border-green-700/60 dark:bg-green-950/30 sm:mx-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-green-700 dark:text-green-300 text-sm font-medium">{success}</p>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="border-b border-slate-200/80 bg-slate-50/70 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/30 sm:px-6">
              <div className="-mx-3 overflow-x-auto px-3 scrollbar-hide sm:mx-0 sm:px-0" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                <nav className="flex w-max min-w-full gap-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={tabButtonClass('profile')}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="hidden sm:inline">User Details</span>
                    <span className="sm:hidden">Profile</span>
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('account')}
                  className={tabButtonClass('account')}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Account
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('dietary')}
                  className={tabButtonClass('dietary')}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="hidden sm:inline">Dietary</span>
                    <span className="sm:hidden">Diet</span>
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={tabButtonClass('preferences')}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4z" />
                    </svg>
                    <span className="hidden sm:inline">Brands</span>
                    <span className="sm:hidden">Brands</span>
                  </span>
                </button>
                </nav>
              </div>
            </div>
            
            {/* Form Content */}
            <form onSubmit={handleProfileSubmit} className="p-4 sm:p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">User Details</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Manage your email and password settings.</p>
                  </div>
                  
                  {/* Email Section */}
                  <div className={sectionClass}>
                    <div className="mb-6">
                      <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        className={fieldClass}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Password Section */}
                  <div className={sectionClass}>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Password Settings
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Current Password
                        </label>
                        <input
                          id="currentPassword"
                          type="password"
                          className={fieldClass}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          New Password
                        </label>
                        <input
                          id="newPassword"
                          type="password"
                          className={`${fieldClass} ${
                            passwordError 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                              : ''
                          }`}
                          value={newPassword}
                          onChange={handleNewPasswordChange}
                          placeholder="Enter a new password"
                        />
                        {passwordError && (
                          <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {passwordError}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          id="confirmPassword"
                          type="password"
                          className={`${fieldClass} ${
                            confirmPasswordError 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                              : ''
                          }`}
                          value={confirmPassword}
                          onChange={handleConfirmPasswordChange}
                          placeholder="Confirm your new password"
                        />
                        {confirmPasswordError && (
                          <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {confirmPasswordError}
                          </p>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={handlePasswordReset}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-green-600/20 transition hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        disabled={!currentPassword || !newPassword || !confirmPassword || passwordError !== null || confirmPasswordError !== null}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  {/* Connected Accounts Section */}
              <div className={sectionClass}>
                <h4 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">Connected Accounts</h4>
                <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                  Link your accounts for faster sign-in.
                </p>

                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center space-x-3">
                    <GoogleIcon />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Google</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {hasGoogleLinked
                          ? 'Your Google account is connected'
                          : 'Sign in faster with your Google account'}
                      </p>
                    </div>
                  </div>
                  {hasGoogleLinked ? (
                    <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-800 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-300">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Connected
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLinkGoogle}
                      disabled={googleLinkLoading}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      {googleLinkLoading ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Account Information</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Update your personal information and address details.</p>
              </div>
              
              <div className={sectionClass}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                <div>
                  <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    className={fieldClass}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    className={fieldClass}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            
              <div className="mb-2 mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white">Address Information</h4>
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={locationLoading}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {locationLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Detecting...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        Use my location
                      </>
                    )}
                  </button>
                </div>

                <div className="mb-4">
                  <label htmlFor="addressAutocomplete" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Address
                  </label>
                  <AddressAutocomplete
                    id="addressAutocomplete"
                    value={addressDisplay}
                    onChange={(v) => setAddressDisplay(v)}
                    onSelect={(parsed: ParsedAddress) => {
                      setStreet(parsed.street);
                      setCity(parsed.city);
                      setProvince(parsed.province);
                      setPostalCode(parsed.postalCode);
                      setPostalCodeError(null);
                      setUserCoords({ lat: parsed.latitude, lon: parsed.longitude });
                    }}
                    proximityLat={userCoords?.lat}
                    proximityLon={userCoords?.lon}
                    className={fieldClass}
                    placeholder="Start typing your address..."
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Phone Number
                  </label>
                  <input
                    id="phoneNumber"
                    className={`${fieldClass} ${phoneNumberError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    placeholder="(123) 456-7890"
                  />
                  {phoneNumberError && (
                    <p className="mt-1 text-xs text-red-500">{phoneNumberError}</p>
                  )}
                </div>
              </div>
              </div>

              {/* Delete Account Section - Accordion */}
              <div className="pt-2">
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                  {/* Accordion Header */}
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                    className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800"
                  >
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Permanently remove my personal data</span>
                    <svg
                      className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${showDeleteConfirm ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Accordion Content */}
                  {showDeleteConfirm && (
                    <div className="border-t border-slate-200 p-4 dark:border-slate-700">
                      <div className="rounded-xl border border-red-200 bg-red-50/90 p-4 dark:border-red-600/40 dark:bg-red-900/20">
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="font-semibold text-red-800 dark:text-red-300">Warning: This action is permanent</span>
                          </div>
                          <p className="mb-2 text-sm text-red-700 dark:text-red-300">
                            Deleting your account will permanently remove:
                          </p>
                          <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-red-700 dark:text-red-300">
                            <li>Your profile and personal information</li>
                            <li>All grocery lists and saved items</li>
                            <li>Chat history and conversations</li>
                            <li>Price check history and preferences</li>
                          </ul>
                        </div>

                        {deleteError && (
                          <div className="mb-4 rounded border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-700 dark:border-red-600 dark:bg-red-950/40 dark:text-red-300">
                            {deleteError}
                          </div>
                        )}

                        <div className="space-y-4">
                          {needsPassword && (
                            <div>
                              <label htmlFor="deletePassword" className="mb-1.5 block text-sm font-medium text-red-800 dark:text-red-300">
                                Enter your password to confirm
                              </label>
                              <input
                                id="deletePassword"
                                type="password"
                                className="w-full rounded-xl border border-red-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder-slate-400 transition focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-red-500/40 dark:bg-slate-900 dark:text-white"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="Your current password"
                                disabled={deleteLoading}
                              />
                            </div>
                          )}

                          <div>
                            <label htmlFor="deleteConfirmText" className="mb-1.5 block text-sm font-medium text-red-800 dark:text-red-300">
                              Type <span className="font-bold text-red-600">DELETE</span> to confirm
                            </label>
                            <input
                              id="deleteConfirmText"
                              type="text"
                              className="w-full rounded-xl border border-red-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder-slate-400 transition focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-red-500/40 dark:bg-slate-900 dark:text-white"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              placeholder="Type DELETE"
                              disabled={deleteLoading}
                            />
                          </div>

                          <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                              type="button"
                              onClick={() => {
                                setShowDeleteConfirm(false);
                                setDeletePassword('');
                                setDeleteConfirmText('');
                                setDeleteError(null);
                              }}
                              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                              disabled={deleteLoading}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleDeleteAccount}
                              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={deleteLoading || deleteConfirmText !== 'DELETE' || (needsPassword && !deletePassword)}
                            >
                              {deleteLoading ? 'Deleting...' : 'Permanently Delete Account'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Dietary Restrictions Tab */}
          {activeTab === 'dietary' && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Dietary Preferences</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Select your dietary preferences and add any custom notes.</p>
              </div>
              
              {/* Common Dietary Restrictions Section */}
              <div className={sectionClass}>
                <h4 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Common Dietary Preferences</h4>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {COMMON_DIETARY_RESTRICTIONS.map((restriction) => {
                    const isSelected = dietaryRestrictions.includes(restriction);
                    return (
                      <label
                        key={restriction}
                        htmlFor={`restriction-${restriction}`}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition ${
                          isSelected
                            ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-500/50 dark:bg-green-500/15 dark:text-green-300'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800'
                        }`}>
                        <input
                          type="checkbox"
                          id={`restriction-${restriction}`}
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDietaryRestrictions([...dietaryRestrictions, restriction]);
                            } else {
                              setDietaryRestrictions(dietaryRestrictions.filter(r => r !== restriction));
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-300 accent-green-600"
                        />
                        <span className={`${isSelected ? 'font-semibold' : ''}`}>
                          {restriction}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Selected restrictions: {dietaryRestrictions.length ? dietaryRestrictions.join(', ') : 'None'}
                </div>
              </div>
              
              <div className={sectionClass}>
                <h4 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Custom Dietary Preferences</h4>
                
                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Your custom preferences
                  </label>
                  
                  {dietaryRestrictions.filter(r => !COMMON_DIETARY_RESTRICTIONS.includes(r)).length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No custom dietary preferences added.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {dietaryRestrictions
                        .filter(r => !COMMON_DIETARY_RESTRICTIONS.includes(r))
                        .map((restriction, index) => (
                          <li key={index} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60">
                            <span className="text-sm text-slate-700 dark:text-slate-200">{restriction}</span>
                            <button 
                              type="button" 
                              onClick={() => removeDietaryRestriction(restriction)}
                              className="text-sm font-medium text-red-500 transition hover:text-red-700"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
                
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Add a custom dietary restriction"
                    className={`${fieldClass} flex-1`}
                    value={newDietaryRestriction}
                    onChange={(e) => setNewDietaryRestriction(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={addDietaryRestriction}
                    className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!newDietaryRestriction}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Brand Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Brand Preferences</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Add preferred and avoided brands by category.</p>
              </div>
              
              {/* Brands You Like Section */}
              <div className={sectionClass}>
                <h4 className="mb-3 text-base font-semibold text-green-700 dark:text-green-300">Brands You Like</h4>
                
                <div className="mb-4">
                  {Object.keys(likedBrands).length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No preferred brands added yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {Object.entries(likedBrands).map(([category, brand], index) => (
                        <li key={index} className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50/50 px-3 py-2 dark:border-green-500/40 dark:bg-green-500/10">
                          <span className="text-sm text-slate-700 dark:text-slate-200">
                            <strong>{category}:</strong> {brand}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => removeBrand('liked', category)}
                            className="text-sm font-medium text-red-500 transition hover:text-red-700"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div className="mb-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Category (e.g., Pasta Sauce)"
                    className={fieldClass}
                    value={newLikedCategory}
                    onChange={(e) => setNewLikedCategory(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Brand Name"
                    className={fieldClass}
                    value={newLikedBrand}
                    onChange={(e) => setNewLikedBrand(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => addBrand('liked')}
                  className="mb-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!newLikedCategory || !newLikedBrand}
                >
                  Add Preferred Brand
                </button>
              </div>
              
              {/* Brands You Dislike Section */}
              <div className={sectionClass}>
                <h4 className="mb-3 text-base font-semibold text-red-700 dark:text-red-300">Brands You Dislike</h4>
                
                <div className="mb-4">
                  {Object.keys(dislikedBrands).length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No disliked brands added yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {Object.entries(dislikedBrands).map(([category, brand], index) => (
                        <li key={index} className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50/60 px-3 py-2 dark:border-red-500/40 dark:bg-red-500/10">
                          <span className="text-sm text-slate-700 dark:text-slate-200">
                            <strong>{category}:</strong> {brand}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => removeBrand('disliked', category)}
                            className="text-sm font-medium text-red-500 transition hover:text-red-700"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div className="mb-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Category (e.g., Cookies)"
                    className={fieldClass}
                    value={newDislikedCategory}
                    onChange={(e) => setNewDislikedCategory(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Brand Name"
                    className={fieldClass}
                    value={newDislikedBrand}
                    onChange={(e) => setNewDislikedBrand(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => addBrand('disliked')}
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!newDislikedCategory || !newDislikedBrand}
                >
                  Add Disliked Brand
                </button>
              </div>
            </div>
          )}
                
              {/* Action Buttons */}
              <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 dark:border-slate-700 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    className="w-full rounded-xl border border-slate-300 px-6 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 sm:w-auto"
                    onClick={() => navigate(-1)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  
                  <button 
                    type="submit" 
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-2.5 font-semibold text-white shadow-lg shadow-green-600/20 transition hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
              </div>
            </form>
          </div>
        </div>
      </div>
  );
};

export default ProfilePage; 
