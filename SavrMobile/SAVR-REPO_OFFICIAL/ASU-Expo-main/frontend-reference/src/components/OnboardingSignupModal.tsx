import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import authService from '@/services/authService';
import { onboardingChatService } from '@/services/chatService';
import storeService from '@/services/storeService';
import { byDistanceAsc } from '@/lib/stores';

// Google icon component
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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

// Canadian provinces
const PROVINCES = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" }
];

interface OnboardingSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  anonymousSessionId: string;
}

export default function OnboardingSignupModal({
  isOpen,
  onClose,
  anonymousSessionId,
}: OnboardingSignupModalProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Address fields
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const formatPostalCode = (input: string) => {
    let formatted = input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (formatted.length > 3) {
      formatted = `${formatted.slice(0, 3)} ${formatted.slice(3, 6)}`;
    }
    return formatted.slice(0, 7);
  };

  const formatPhoneNumber = (input: string) => {
    const digitsOnly = input.replace(/\D/g, '');
    if (digitsOnly.length <= 3) {
      return digitsOnly;
    } else if (digitsOnly.length <= 6) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    } else {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
    }
  };

  const autoSelectStores = async () => {
    try {
      const addressString = `${street}, ${city}, ${province}, ${postalCode}, Canada`;
      const coordinates = await storeService.getCoordinatesFromAddress(addressString);
      const nearbyStores = await storeService.getNearbyStores({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        radius: 5000,
        provider: 'mapbox'
      });
      const orderedByDistance = [...nearbyStores].sort(byDistanceAsc);

      const ALLOWED_STORE_BRANDS = [
        'loblaw', 'loblaws',
        'no frills', 'nofrills',
        'independent grocer', 'your independent', 'yig', 'independent',
        'superstore', 'real canadian superstore', 'rcss',
        'food basics', 'foodbasics',
        'walmart', 'wal-mart',
        'sobeys', "sobey's", "sobey's", 'safeway', 'sobeys extra', 'sobeys urban fresh', 'urban fresh'
      ];

      const isAllowedStore = (storeName: string): boolean => {
        const lowerName = storeName.toLowerCase();
        return ALLOWED_STORE_BRANDS.some(brand => lowerName.includes(brand));
      };

      const extractPostal = (address: string) => {
        const match = address.match(/[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d/);
        return match ? match[0].replace(' ', '') : '';
      };

      const filteredStores = orderedByDistance
        .filter(store => isAllowedStore(store.name))
        .slice(0, 2);

      for (const store of filteredStores) {
        try {
          const postal = extractPostal(store.address);
          await storeService.addUserSelectedStore({
            store_name: store.name,
            address: store.address,
            postal_code: postal,
            image_url: store.image_url,
          });
        } catch (storeError) {
          console.log('Failed to auto-select store:', store.name, storeError);
        }
      }
    } catch (storeError) {
      console.log('Failed to auto-select stores:', storeError);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      // Store session ID so it can be claimed after OAuth callback
      if (anonymousSessionId) {
        localStorage.setItem('onboarding-session-id', anonymousSessionId);
      }
      const authUrl = await authService.getGoogleAuthUrl();
      window.location.href = authUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Google sign-up.');
      setGoogleLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreedToTerms) {
      setError('Please agree to the Privacy Policy and Terms of Service to continue.');
      return;
    }

    // Validate postal code format
    const postalCodeRegex = /^[A-Z]\d[A-Z] \d[A-Z]\d$/;
    if (!postalCodeRegex.test(postalCode)) {
      setError('Please enter a valid postal code (e.g., A1A 1A1)');
      return;
    }

    // Validate phone number has 10 digits
    const phoneDigits = phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up
      const address = {
        street,
        city,
        province,
        postalCode,
        phoneNumber
      };

      await authService.signup({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone: phoneNumber.replace(/\D/g, ''),
        address
      });

      // 2. Auto-select nearby stores
      await autoSelectStores();

      // 3. Claim the onboarding session
      try {
        await onboardingChatService.claimSession(anonymousSessionId);
      } catch (claimErr) {
        console.warn('Session claim failed (non-blocking):', claimErr);
      }

      // 4. Clean up and navigate
      localStorage.removeItem('onboarding-session-id');
      navigate('/chat');
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Signup failed. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm';
  const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <img
            src="/assets/savr-logo(primary).svg"
            alt="Savr"
            className="h-8 mx-auto mb-3"
          />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Your list is ready!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sign up free to compare prices across stores
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Google Sign-Up */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={loading || googleLoading}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-2.5 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <GoogleIcon />
          {googleLoading ? 'Connecting...' : 'Sign up with Google'}
        </button>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-600"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-slate-800 px-2 text-slate-400">Or sign up with email</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-3">
          <div>
            <label className={labelClass}>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
              placeholder="you@email.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className={inputClass}
                placeholder="First"
              />
            </div>
            <div>
              <label className={labelClass}>Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className={inputClass}
                placeholder="Last"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={inputClass}
              placeholder="Min 6 characters"
            />
          </div>

          <div>
            <label className={labelClass}>Confirm Password *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={inputClass}
              placeholder="Confirm password"
            />
          </div>

          <div className="border-t border-slate-200 dark:border-slate-600 pt-3 mt-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Canadian Address</p>
          </div>

          <div>
            <label className={labelClass}>Street Address *</label>
            <input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              required
              className={inputClass}
              placeholder="123 Main St"
            />
          </div>

          <div>
            <label className={labelClass}>City *</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className={inputClass}
              placeholder="Toronto"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Province *</label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                required
                className={inputClass}
              >
                <option value="" disabled>Select</option>
                {PROVINCES.map(p => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Postal Code *</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(formatPostalCode(e.target.value))}
                required
                maxLength={7}
                className={inputClass}
                placeholder="A1A 1A1"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Phone Number *</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
              required
              className={inputClass}
              placeholder="(123) 456-7890"
            />
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2 pt-1">
            <input
              id="onboarding-terms"
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
            />
            <label htmlFor="onboarding-terms" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              I agree to the{' '}
              <Link to="/privacy" target="_blank" className="text-green-600 dark:text-green-400 underline">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link to="/terms" target="_blank" className="text-green-600 dark:text-green-400 underline">
                Terms of Service
              </Link>
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading || googleLoading || !agreedToTerms}
            className="w-full h-11 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating account...
              </>
            ) : (
              'Create Account & Compare Prices'
            )}
          </Button>
        </form>

        <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-4">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-green-600 dark:text-green-400 hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
