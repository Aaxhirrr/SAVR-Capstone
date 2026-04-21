import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import { onboardingChatService } from '../services/chatService';
import storeService from '../services/storeService';

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

interface GoogleSignupData {
  google_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

const GoogleSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [googleData, setGoogleData] = useState<GoogleSignupData | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get Google data from session storage
    const storedData = sessionStorage.getItem('google_signup_data');
    if (!storedData) {
      // No Google data - redirect to login
      navigate('/login');
      return;
    }

    try {
      const data = JSON.parse(storedData) as GoogleSignupData;
      setGoogleData(data);
      // Pre-fill name from Google
      if (data.first_name) setFirstName(data.first_name);
      if (data.last_name) setLastName(data.last_name);
    } catch (e) {
      console.error('Error parsing Google data:', e);
      navigate('/login');
    }
  }, [navigate]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!googleData) {
      setError('Google authentication data is missing. Please try again.');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the Privacy Policy and Terms of Service to continue.');
      return;
    }

    setLoading(true);

    try {
      // Validate postal code format
      const postalCodeRegex = /^[A-Z]\d[A-Z] \d[A-Z]\d$/;
      if (!postalCodeRegex.test(postalCode)) {
        throw new Error('Please enter a valid postal code (e.g., A1A 1A1)');
      }

      // Validate phone number has 10 digits
      const phoneDigits = phoneNumber.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      // Complete Google signup
      await authService.completeGoogleSignup({
        google_id: googleData.google_id,
        email: googleData.email,
        first_name: firstName,
        last_name: lastName,
        phone: phoneDigits,
        address: {
          street,
          city,
          province,
          postalCode,
          phoneNumber
        }
      });

      // Clear the session storage
      sessionStorage.removeItem('google_signup_data');

      // Auto-select the 2 closest stores after successful signup
      try {
        const addressString = `${street}, ${city}, ${province}, ${postalCode}, Canada`;
        const coordinates = await storeService.getCoordinatesFromAddress(addressString);
        // Use our curated database instead of Mapbox
        const nearbyStores = await storeService.getNearbyStoresFromDB({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          radius: 5000, // 5km
        });

        // Database already returns stores sorted by distance and only contains allowed brands
        const topStores = nearbyStores.slice(0, 2);

        for (const store of topStores) {
          try {
            await storeService.addUserSelectedStore({
              store_name: store.name,
              address: store.address,
              postal_code: store.postal_code || '',
              image_url: store.image_url,
              latitude: store.coordinates?.lat,
              longitude: store.coordinates?.lon,
            });
          } catch (storeError) {
            console.log('Failed to auto-select store:', store.name, storeError);
          }
        }
      } catch (storeError) {
        console.log('Failed to auto-select stores:', storeError);
      }

      // Claim onboarding session if exists
      const onboardingSessionId = localStorage.getItem('onboarding-session-id');
      if (onboardingSessionId) {
        try {
          await onboardingChatService.claimSession(onboardingSessionId);
        } catch (claimError) {
          console.log('Failed to claim onboarding session:', claimError);
        }
        localStorage.removeItem('onboarding-session-id');
      }

      navigate('/chat');
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!googleData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:via-emerald-900 dark:to-green-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:via-emerald-900 dark:to-green-900 flex items-center justify-center">
          <div className="text-center flex flex-col items-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-600 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-lg font-medium text-slate-700 dark:text-slate-300 animate-pulse">
              Creating account...
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div className="flex justify-center mb-4">
          <img
            src="/assets/savr-logo(primary).svg"
            alt="Savr Logo"
            className="h-16 w-auto"
          />
        </div>
        <div className="text-center">
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Complete your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Signing up as <span className="font-medium">{googleData.email}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-lg font-medium text-gray-900">Canadian Address</h3>
            </div>

            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                id="street"
                name="street"
                type="text"
                autoComplete="street-address"
                required
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                placeholder="123 Main St"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                autoComplete="address-level2"
                required
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                placeholder="Toronto"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
                  Province
                </label>
                <select
                  id="province"
                  name="province"
                  required
                  className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                >
                  <option value="" disabled>Select Province</option>
                  {PROVINCES.map(p => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="postal-code" className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  id="postal-code"
                  name="postalCode"
                  type="text"
                  autoComplete="postal-code"
                  required
                  className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                  placeholder="A1A 1A1"
                  value={postalCode}
                  onChange={(e) => setPostalCode(formatPostalCode(e.target.value))}
                  maxLength={7}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phone-number"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                required
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                placeholder="(123) 456-7890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
              />
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="agree-terms" className="text-gray-700 cursor-pointer">
                I have read and agree to the{" "}
                <Link
                  to="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-green-600 hover:text-green-500 underline">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  to="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-green-600 hover:text-green-500 underline">
                  Terms of Service
                </Link>
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-400 disabled:cursor-not-allowed transition duration-150"
            >
              {loading ? 'Creating account...' : 'Complete Sign up'}
            </button>
          </div>

          <div className="text-sm text-center mt-4">
            <p>
              <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
                Cancel and return to login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoogleSignupPage;
