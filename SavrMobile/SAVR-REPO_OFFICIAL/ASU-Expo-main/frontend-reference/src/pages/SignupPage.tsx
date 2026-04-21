import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import storeService from '../services/storeService';
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

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
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

  const formatPostalCode = (input: string) => {
    // Remove all spaces and non-alphanumeric characters
    let formatted = input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Format as A1A 1A1 if length is at least 4
    if (formatted.length > 3) {
      formatted = `${formatted.slice(0, 3)} ${formatted.slice(3, 6)}`;
    }
    
    return formatted.slice(0, 7); // Limit to 7 chars (including space)
  };

  const formatPhoneNumber = (input: string) => {
    // Keep only digits
    const digitsOnly = input.replace(/\D/g, '');

    // Format as (123) 456-7890
    if (digitsOnly.length <= 3) {
      return digitsOnly;
    } else if (digitsOnly.length <= 6) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    } else {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const authUrl = await authService.getGoogleAuthUrl();
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Google sign-up.');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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

      // Validate password match
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Create address object
      const address = {
        street,
        city,
        province,
        postalCode,
        phoneNumber
      };

      await authService.signup({
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        phone: phoneNumber.replace(/\D/g, ''),
        address
      });

      // Auto-select the 2 closest stores after successful signup
      try {
        // Format the address for geocoding
        const addressString = `${street}, ${city}, ${province}, ${postalCode}, Canada`;
        
        // Get coordinates from address
        const coordinates = await storeService.getCoordinatesFromAddress(addressString);
        
        // Get nearby stores using coordinates
        const nearbyStores = await storeService.getNearbyStores({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          radius: 5000, // 5km radius
          provider: 'mapbox'
        });
        const orderedByDistance = [...nearbyStores].sort(byDistanceAsc);

        // Define allowed store brands for filtering
        const ALLOWED_STORE_BRANDS = [
          'loblaw', 'loblaws',
          'no frills', 'nofrills', 
          'independent grocer', 'your independent', 'yig', 'independent',
          'superstore', 'real canadian superstore', 'rcss',
          'food basics', 'foodbasics',
          'walmart', 'wal-mart',
          // Empire (Sobeys family)
          'sobeys', "sobey's", "sobey’s", 'safeway', 'sobeys extra', 'sobeys urban fresh', 'urban fresh'
        ];

        // Helper function to check if a store is from an allowed brand
        const isAllowedStore = (storeName: string): boolean => {
          const lowerName = storeName.toLowerCase();
          return ALLOWED_STORE_BRANDS.some(brand => lowerName.includes(brand));
        };

        // Helper to extract postal code from address string
        const extractPostal = (address: string) => {
          const match = address.match(/[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d/);
          return match ? match[0].replace(' ', '') : '';
        };

        // Filter stores to only include allowed brands and get the 2 closest
        const filteredStores = orderedByDistance
          .filter(store => isAllowedStore(store.name))
          .slice(0, 2); // Take only the first 2 stores

        // Auto-select these stores
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
            // Silently fail for individual store selection errors
            console.log('Failed to auto-select store:', store.name, storeError);
          }
        }
      } catch (storeError) {
        // Silently fail for store auto-selection errors
        console.log('Failed to auto-select stores:', storeError);
      }
      
      navigate('/chat'); // Redirect to chat page after successful signup
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:via-emerald-900 dark:to-green-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Loading Overlay */}
      {(loading || googleLoading) && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:via-emerald-900 dark:to-green-900 flex items-center justify-center">
          <div className="text-center flex flex-col items-center">
            {/* Spinning circle */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-600 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
            </div>

            <p className="mt-6 text-lg font-medium text-slate-700 dark:text-slate-300 animate-pulse">
              {googleLoading ? "Connecting to Google..." : "Creating account..."}
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
            style={{ maxHeight: '64px' }}
          />
        </div>
        <div className="text-center">
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Create your Savr account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Save on groceries with personalized recommendations
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Google Sign-Up Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading || googleLoading}
            className="group relative flex w-full justify-center items-center rounded-md border border-gray-300 bg-white py-2.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-100 disabled:cursor-not-allowed transition duration-150"
          >
            <GoogleIcon />
            {googleLoading ? "Connecting..." : "Sign up with Google"}
          </button>
        </div>

        {/* Divider */}
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Or sign up with email</span>
          </div>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
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
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
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
              disabled={loading || googleLoading || !agreedToTerms}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-400 disabled:cursor-not-allowed transition duration-150"
            >
              {loading ? 'Creating account...' : 'Sign up with Email'}
            </button>
          </div>

          <div className="text-sm text-center mt-4">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage; 
