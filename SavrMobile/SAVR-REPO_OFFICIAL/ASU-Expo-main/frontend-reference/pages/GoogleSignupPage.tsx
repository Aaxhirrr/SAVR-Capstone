import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import authService from '../services/authService';
import { onboardingChatService } from '../services/chatService';
import storeService from '../services/storeService';
import AddressAutocomplete, { type ParsedAddress } from '@/components/AddressAutocomplete';
import { PROVINCE_NAME_TO_CODE, formatPostalCode, formatPhoneNumber } from '@/lib/addressUtils';

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
  const [phoneNumber, setPhoneNumber] = useState('');

  // Address autocomplete state
  const [addressDisplay, setAddressDisplay] = useState('');
  const [addressParsed, setAddressParsed] = useState<ParsedAddress | null>(null);

  // Proximity coords for biasing autocomplete results
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

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
      console.error('Error parsing Google data:');
      navigate('/login');
    }
  }, [navigate]);

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

    if (!googleData) {
      setError('Google authentication data is missing. Please try again.');
      return;
    }

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

    setLoading(true);

    try {
      // Complete Google signup
      await authService.completeGoogleSignup({
        google_id: googleData.google_id,
        email: googleData.email,
        first_name: firstName,
        last_name: lastName,
        phone: phoneNumber ? phoneNumber.replace(/\D/g, '') : undefined,
        address: {
          street: addressParsed.street,
          city: addressParsed.city,
          province: addressParsed.province,
          postalCode: addressParsed.postalCode,
          phoneNumber,
        }
      });

      // Clear the session storage
      sessionStorage.removeItem('google_signup_data');

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

      // Claim onboarding session if exists
      const onboardingSessionId = localStorage.getItem('onboarding-session-id');
      if (onboardingSessionId) {
        try {
          await onboardingChatService.claimSession(onboardingSessionId);
        } catch (claimError) {
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
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden h-full relative">
      <Helmet>
        <title>Complete Sign Up - Savr</title>
        <meta name="description" content="Complete your Savr account setup with Google." />
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

        {/* Food doodle pattern from SVG - scrolling horizontally */}
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
        {loading && (
          <div className="fixed inset-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
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
    </div>
  );
};

export default GoogleSignupPage;
