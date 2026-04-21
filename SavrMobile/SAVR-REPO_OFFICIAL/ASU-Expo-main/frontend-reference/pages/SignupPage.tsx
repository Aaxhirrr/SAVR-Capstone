import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import authService from '../services/authService';
import storeService from '../services/storeService';
import AddressAutocomplete, { type ParsedAddress } from '@/components/AddressAutocomplete';
import { PROVINCE_NAME_TO_CODE, formatPostalCode, formatPhoneNumber } from '@/lib/addressUtils';

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

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Address autocomplete state
  const [addressDisplay, setAddressDisplay] = useState('');
  const [addressParsed, setAddressParsed] = useState<ParsedAddress | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Proximity coords for biasing autocomplete results
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

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

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLocationLoading(true);
    setError('');

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
      const parts = [address.street, address.city, address.province, postal].filter(Boolean);
      setAddressDisplay(parts.join(', '));
      setAddressParsed({
        street: address.street || '',
        city: address.city || '',
        province: provinceCode,
        postalCode: postal,
        latitude,
        longitude,
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreedToTerms) {
      setError('Please agree to the Privacy Policy and Terms of Service to continue.');
      return;
    }

    if (!addressParsed) {
      setError('Please select an address from the suggestions.');
      return;
    }

    // Validate phone number if provided
    if (phoneNumber) {
      const phoneDigits = phoneNumber.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const address = {
        street: addressParsed.street,
        city: addressParsed.city,
        province: addressParsed.province,
        postalCode: addressParsed.postalCode,
        phoneNumber,
      };

      await authService.signup({
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        phone: phoneNumber ? phoneNumber.replace(/\D/g, '') : undefined,
        address,
      });

      // Auto-select the 2 closest stores using coordinates from parsed address
      try {
        const lat = addressParsed.latitude;
        const lon = addressParsed.longitude;

        let coordinates = { latitude: lat, longitude: lon };
        // Fall back to forward geocode only if we have no coordinates
        if (!lat && !lon) {
          const addressString = `${addressParsed.street}, ${addressParsed.city}, ${addressParsed.province}, ${addressParsed.postalCode}, Canada`;
          coordinates = await storeService.getCoordinatesFromAddress(addressString);
        }

        // Use local DB — already sorted by distance with only valid brands
        const nearbyStores = await storeService.getNearbyStoresFromDB({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          radius: 5000,
        });

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
              brand: store.brand,
              retailer_store_id: store.retailer_store_id,
            });
          } catch (storeError) {
          }
        }
      } catch (storeError) {
      }

      // If email verification is required, go to pending page directly
      if (authService.needsEmailVerification()) {
        navigate('/verify-email-pending');
      } else {
        navigate('/chat');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden h-full relative">
      <Helmet>
        <title>Sign Up Free - Savr</title>
        <meta name="description" content="Create your free Savr account and start comparing grocery prices across Canadian stores. Save money on every grocery trip." />
        <link rel="canonical" href="https://savr.app/signup" />
        <meta property="og:title" content="Sign Up Free - Savr" />
        <meta property="og:description" content="Create your free Savr account and start comparing grocery prices across Canadian stores." />
        <meta property="og:url" content="https://savr.app/signup" />
      </Helmet>
      {/* Background with gradient blobs and food doodles from SVG - Only visible in light mode */}
      <div className="pointer-events-none fixed inset-0 z-0 dark:hidden overflow-hidden">
        {/* Gradient blobs */}
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

        {/* Food doodle pattern from SVG - scrolling horizontally - more visible */}
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

      <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Loading Overlay */}
        {(loading || googleLoading) && (
          <div className="fixed inset-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
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
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Canadian Address</h3>
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
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <AddressAutocomplete
                  id="address"
                  value={addressDisplay}
                  onChange={(v) => {
                    setAddressDisplay(v);
                    // Clear parsed address when user edits the text manually
                    if (addressParsed) setAddressParsed(null);
                  }}
                  onSelect={(parsed) => {
                    setAddressParsed(parsed);
                    setUserCoords({ lat: parsed.latitude, lon: parsed.longitude });
                  }}
                  proximityLat={userCoords?.lat}
                  proximityLon={userCoords?.lon}
                  className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="phone-number"
                  name="phoneNumber"
                  type="tel"
                  autoComplete="tel"
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
    </div>
  );
};

export default SignupPage;
