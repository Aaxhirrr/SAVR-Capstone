import api, { apiClient } from './api';

export interface UserCredentials {
  email: string;
  password: string;
  roles?: string[];
}

export interface CanadianAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  phoneNumber: string;
}

export interface SignupData extends UserCredentials {
  first_name: string;
  last_name: string;
  phone?: string;
  address?: CanadianAddress;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  requires_email_verification?: boolean;
}

export interface GoogleCallbackResponse {
  // If user exists and is logged in
  access_token?: string;
  token_type?: string;
  user_id?: string;
  // If new user needs to complete signup
  needs_signup?: boolean;
  google_id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  // If existing email user needs to link accounts
  needs_link?: boolean;
  message?: string;
}

export interface GoogleSignupData {
  google_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: CanadianAddress;
}

export interface GoogleLinkData {
  email: string;
  password: string;
  google_id: string;
}

export interface User {
  id?: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  address?: CanadianAddress;
  dietaryRestrictions?: string[];
  dietary_restrictions?: string[];
  brandPreferences?: {
    liked?: { [key: string]: string };
    disliked?: { [key: string]: string };
  } | { [key: string]: string };
  brand_preferences?: {
    liked?: { [key: string]: string };
    disliked?: { [key: string]: string };
  } | { [key: string]: string };
  roles?: string[];
  google_linked?: boolean;
  auth_provider?: string;
  is_email_verified?: boolean;
}

const authService = {
  /**
   * Login a user
   */
  login: async (credentials: UserCredentials): Promise<AuthResponse> => {
    try {
      // Convert to form data for OAuth2 compatibility
      const formData = new FormData();
      formData.append('username', credentials.email);  // API expects email in username field
      formData.append('password', credentials.password);
      
      const response = await api.post<AuthResponse>('/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Save token in localStorage
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user_id', response.data.user_id);

      // Track email verification requirement
      if (response.data.requires_email_verification) {
        localStorage.setItem('requires_email_verification', 'true');
      } else {
        localStorage.removeItem('requires_email_verification');
      }

      // Push user ID to GTM for cross-device tracking
      if (window.dataLayer) {
        window.dataLayer.push({
          'event': 'user_login',
          'user_id': response.data.user_id
        });
      }

      // Fetch and save user profile data
      try {
        // Use direct API call to avoid circular dependency
        const profileResponse = await api.get<User>('/auth/profile');
        
        // Make sure the profile data is complete before saving to localStorage
        if (!profileResponse.data.dietaryRestrictions && !profileResponse.data.dietary_restrictions) {
        }
        
        if (!profileResponse.data.brandPreferences && !profileResponse.data.brand_preferences) {
        }
        
        // Save to localStorage, but don't override any existing complete profile data if the response is incomplete
        const existingUserData = localStorage.getItem('user');
        if (existingUserData) {
          try {
            // If we have existing data in localStorage, use it as a base and only update basic fields
            const existingUser = JSON.parse(existingUserData);
            
            // Create a merged profile - the new data gets priority for basic fields,
            // but we keep existing preferences if the new response doesn't have them
            const mergedProfile = {
              ...existingUser,  // Start with existing data as base
              ...profileResponse.data,  // Override with new basic profile data
              
              // Preserve dietary restrictions if missing in new data
              dietaryRestrictions: profileResponse.data.dietaryRestrictions || 
                                   profileResponse.data.dietary_restrictions ||
                                   existingUser.dietaryRestrictions ||
                                   existingUser.dietary_restrictions ||
                                   [],
              
              // Preserve brand preferences if missing in new data
              brandPreferences: profileResponse.data.brandPreferences || 
                               profileResponse.data.brand_preferences ||
                               existingUser.brandPreferences ||
                               existingUser.brand_preferences ||
                               { liked: {}, disliked: {} }
            };
            
            // Store the merged profile
            localStorage.setItem('user', JSON.stringify(mergedProfile));
          } catch (e) {
            // If parsing fails, just use the new data
            localStorage.setItem('user', JSON.stringify(profileResponse.data));
          }
        } else {
          // If no existing data, just save the new profile
          localStorage.setItem('user', JSON.stringify(profileResponse.data));
        }
      } catch (profileError) {
        console.error('Error fetching user profile after login:', profileError);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Login error:');
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },
  
  /**
   * Register a new user
   */
  signup: async (data: SignupData): Promise<AuthResponse> => {
    try {
      
      const response = await api.post<AuthResponse>('/auth/signup', data);


      // Save token in localStorage
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user_id', response.data.user_id);

      // Track email verification requirement
      if (response.data.requires_email_verification) {
        localStorage.setItem('requires_email_verification', 'true');
      }

      // Push user ID to GTM for cross-device tracking (new user signup)
      if (window.dataLayer) {
        window.dataLayer.push({
          'event': 'user_signup',
          'user_id': response.data.user_id
        });
      }

      // Fetch and save user profile data
      try {
        // Use direct API call to avoid circular dependency
        const profileResponse = await api.get<User>('/auth/profile');
        
        // Make sure the profile data is complete before saving to localStorage
        if (!profileResponse.data.dietaryRestrictions && !profileResponse.data.dietary_restrictions) {
        }
        
        if (!profileResponse.data.brandPreferences && !profileResponse.data.brand_preferences) {
        }
        
        // Save to localStorage, but don't override any existing complete profile data if the response is incomplete
        const existingUserData = localStorage.getItem('user');
        if (existingUserData) {
          try {
            // If we have existing data in localStorage, use it as a base and only update basic fields
            const existingUser = JSON.parse(existingUserData);
            
            // Create a merged profile - the new data gets priority for basic fields,
            // but we keep existing preferences if the new response doesn't have them
            const mergedProfile = {
              ...existingUser,  // Start with existing data as base
              ...profileResponse.data,  // Override with new basic profile data
              
              // Preserve dietary restrictions if missing in new data
              dietaryRestrictions: profileResponse.data.dietaryRestrictions || 
                                  profileResponse.data.dietary_restrictions ||
                                  existingUser.dietaryRestrictions ||
                                  existingUser.dietary_restrictions ||
                                  [],
              
              // Preserve brand preferences if missing in new data
              brandPreferences: profileResponse.data.brandPreferences || 
                              profileResponse.data.brand_preferences ||
                              existingUser.brandPreferences ||
                              existingUser.brand_preferences ||
                              { liked: {}, disliked: {} }
            };
            
            // Store the merged profile
            localStorage.setItem('user', JSON.stringify(mergedProfile));
          } catch (e) {
            // If parsing fails, just use the new data
            localStorage.setItem('user', JSON.stringify(profileResponse.data));
          }
        } else {
          // If no existing data, just save the new profile
          localStorage.setItem('user', JSON.stringify(profileResponse.data));
        }
      } catch (profileError) {
        console.error('Error fetching user profile after signup:', profileError);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Signup error:');
      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection to server timed out. Please check your internet connection and try again.');
      }
      throw new Error(error.response?.data?.detail || 'Signup failed. Please check your information and try again.');
    }
  },
  
  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    try {
      const response = await api.get<User>('/auth/profile');
      
      // Check if we have locally stored user data that might have more complete information
      const localUserData = localStorage.getItem('user');
      let localUser: User | null = null;
      
      if (localUserData) {
        try {
          localUser = JSON.parse(localUserData);
        } catch (e) {
          console.error('Error parsing local user data:');
        }
      } else {
      }
      
      // Create a merged profile using the server response as the base,
      // but prioritizing locally stored dietary restrictions and brand preferences
      const enhancedProfile = {
        ...response.data,
        // Override with local data for critical fields
        dietaryRestrictions: (
          localUser?.dietaryRestrictions || 
          localUser?.dietary_restrictions || 
          response.data.dietaryRestrictions ||
          response.data.dietary_restrictions ||
          []
        ),
        brandPreferences: (
          localUser?.brandPreferences || 
          localUser?.brand_preferences || 
          response.data.brandPreferences ||
          response.data.brand_preferences ||
          { liked: {}, disliked: {} }
        )
      };
      
      
      // Update local storage with the enhanced data to ensure consistency
      localStorage.setItem('user', JSON.stringify(enhancedProfile));
      
      return enhancedProfile;
    } catch (error) {
      console.error('Error getting user profile:');
      
      // If API call fails, try to use cached data as fallback
      const cachedData = localStorage.getItem('user');
      if (cachedData) {
        try {
          return JSON.parse(cachedData) as User;
        } catch (e) {
          console.error('Error parsing cached data:');
        }
      }
      
      throw error;
    }
  },
  
  /**
   * Logout the current user
   */
  logout: () => {
    try {
      // Clear token from storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('requires_email_verification');
      // Note: chatSessionId is now user-scoped, so we don't need to clear it here
      // as it will be automatically isolated per user

      // Also clear any Zustand persisted stores
      localStorage.removeItem('savr-chat-storage');
      
      // Clear any other app-related local storage items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('savr-') || key.includes('chat-'))) {
          keysToRemove.push(key);
        }
      }
      
      // Remove collected keys
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      
      // Return success status
      return true;
    } catch (error) {
      console.error('Error during logout:');
      return false;
    }
  },
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
  },
  
  // Add this alias
  isLoggedIn: (): boolean => {
    return localStorage.getItem('token') !== null;
  },

  /**
   * Get current user's ID
   */
  getUserId: (): string | null => {
    return localStorage.getItem('user_id');
  },

  /**
   * Get authentication token
   */
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  /**
   * Update user profile information
   */
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    try {
      // Create a clean copy of the data to send to the server
      const cleanData = {
        ...userData,
        // Ensure we only send dietaryRestrictions (not dietary_restrictions)
        dietaryRestrictions: userData.dietaryRestrictions || userData.dietary_restrictions,
        // Ensure we only send brandPreferences (not brand_preferences)
        brandPreferences: userData.brandPreferences || userData.brand_preferences
      };
      
      // Remove duplicate fields if they exist
      if ('dietary_restrictions' in cleanData) {
        delete cleanData.dietary_restrictions;
      }
      
      if ('brand_preferences' in cleanData) {
        delete cleanData.brand_preferences;
      }
      
      // Log the data being sent for debugging
      
      // Make the API call
      const response = await api.put<User>('/auth/profile', cleanData);
      
      // Instead of just returning the server response directly, combine the server response
      // with what we sent to ensure all fields are preserved, even if the server didn't return them
      const mergedResponse = {
        ...response.data,
        // Keep these fields consistent with what we sent if they're missing in the response
        dietaryRestrictions: response.data.dietaryRestrictions || response.data.dietary_restrictions || cleanData.dietaryRestrictions,
        brandPreferences: response.data.brandPreferences || response.data.brand_preferences || cleanData.brandPreferences
      };
      
      // Update the local storage user data with merged data
      localStorage.setItem('user', JSON.stringify(mergedResponse));

      // Allow UI surfaces (profile page, in-chat dialogs, dropdowns) to stay in sync
      // without requiring a full page reload.
      try {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("auth-profile-updated", { detail: mergedResponse }),
          );
        }
      } catch {
        // No-op: event dispatch is a best-effort UX enhancement.
      }
      
      return mergedResponse;
    } catch (error: any) {
      console.error('Profile update failed');
      throw error;
    }
  },

  /**
   * Update user password
   */
  updatePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      // Use the endpoint that appears in the backend logs
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
    } catch (error: any) {
      console.error('Password update failed');
      throw error;
    }
  },

  /**
   * Refresh user profile from the server
   */
  refreshProfile: async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('Cannot refresh profile: not authenticated');
        // It's important to not clear the user from localStorage here,
        // as an intermittent network issue shouldn't log the user out.
        return false;
      }

      const response = await apiClient.get<User>('/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Merge with existing local data to preserve preferences if not in response
      const localUserData = localStorage.getItem('user');
      let localUser: User | null = null;
      if (localUserData) {
        try {
          localUser = JSON.parse(localUserData);
        } catch (e) { console.error('Error parsing local user data during refresh:'); }
      }

      const mergedProfile = {
        ...response.data, // Start with fresh data from server
        dietaryRestrictions: response.data.dietaryRestrictions || response.data.dietary_restrictions || localUser?.dietaryRestrictions || localUser?.dietary_restrictions || [],
        brandPreferences: response.data.brandPreferences || response.data.brand_preferences || localUser?.brandPreferences || localUser?.brand_preferences || { liked: {}, disliked: {} },
      };

      localStorage.setItem('user', JSON.stringify(mergedProfile));
      return true;
    } catch (error) {
      console.error('Failed to refresh profile:');
      // Do not clear user from localStorage on failed refresh to prevent logout on temporary errors
      return false;
    }
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        return JSON.parse(userJson) as User;
      } catch (error) {
        console.error('Error parsing user from localStorage:');
        localStorage.removeItem('user'); // Remove corrupted data
        return null;
      }
    }
    return null;
  },

  // ==================== Google OAuth Methods ====================

  /**
   * Get Google OAuth authorization URL
   */
  getGoogleAuthUrl: async (): Promise<string> => {
    try {
      // Use nip.io domain for Google OAuth (Google doesn't allow raw IP addresses)
      const hostname = window.location.hostname;
      let redirectOrigin = window.location.origin;

      // If using an IP address, convert to nip.io domain
      if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        const nipDomain = hostname.replace(/\./g, '-') + '.nip.io';
        redirectOrigin = `${window.location.protocol}//${nipDomain}`;
      }

      const redirectUri = `${redirectOrigin}/auth/google/callback`;

      const response = await api.get<{ auth_url: string }>('/auth/google', {
        params: { redirect_uri: redirectUri }
      });
      return response.data.auth_url;
    } catch (error: any) {
      console.error('Error getting Google auth URL:');
      throw new Error(error.response?.data?.detail || 'Failed to initiate Google login');
    }
  },

  /**
   * Handle Google OAuth callback - exchange code for tokens/user info
   */
  handleGoogleCallback: async (code: string): Promise<GoogleCallbackResponse> => {
    try {
      // Use nip.io domain for Google OAuth (must match the redirect URI used in getGoogleAuthUrl)
      const hostname = window.location.hostname;
      let redirectOrigin = window.location.origin;

      // If using an IP address, convert to nip.io domain
      if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        const nipDomain = hostname.replace(/\./g, '-') + '.nip.io';
        redirectOrigin = `${window.location.protocol}//${nipDomain}`;
      }

      const redirectUri = `${redirectOrigin}/auth/google/callback`;
      const response = await api.post<GoogleCallbackResponse>('/auth/google/callback', null, {
        params: { code, redirect_uri: redirectUri }
      });

      // If we got an access token, the user is logged in
      if (response.data.access_token && response.data.user_id) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user_id', response.data.user_id);

        // Fetch and save user profile
        try {
          const profileResponse = await api.get<User>('/auth/profile');
          localStorage.setItem('user', JSON.stringify(profileResponse.data));
        } catch (profileError) {
          console.error('Error fetching profile after Google login:', profileError);
        }
      }

      return response.data;
    } catch (error: any) {
      console.error('Google callback error:');
      throw new Error(error.response?.data?.detail || 'Google authentication failed');
    }
  },

  /**
   * Complete signup for a new Google user
   */
  completeGoogleSignup: async (data: GoogleSignupData): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/google/complete-signup', data);

      // Save token and user info
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user_id', response.data.user_id);

      // Fetch and save user profile
      try {
        const profileResponse = await api.get<User>('/auth/profile');
        localStorage.setItem('user', JSON.stringify(profileResponse.data));
      } catch (profileError) {
        console.error('Error fetching profile after Google signup:', profileError);
      }

      return response.data;
    } catch (error: any) {
      console.error('Google signup completion error:');
      throw new Error(error.response?.data?.detail || 'Failed to complete Google signup');
    }
  },

  /**
   * Link Google account to existing email account (requires password)
   */
  linkGoogleAccount: async (data: GoogleLinkData): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/google/link', data);

      // Save new token
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user_id', response.data.user_id);

      // Fetch and save updated user profile
      try {
        const profileResponse = await api.get<User>('/auth/profile');
        localStorage.setItem('user', JSON.stringify(profileResponse.data));
      } catch (profileError) {
        console.error('Error fetching profile after linking:', profileError);
      }

      return response.data;
    } catch (error: any) {
      console.error('Google account linking error:');
      throw new Error(error.response?.data?.detail || 'Failed to link Google account');
    }
  },

  /**
   * Link Google account for already authenticated users
   */
  linkGoogleAccountAuthenticated: async (googleId: string): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/google/link-authenticated', {
        google_id: googleId
      });

      // Update token
      localStorage.setItem('token', response.data.access_token);

      return response.data;
    } catch (error: any) {
      console.error('Google account linking error:');
      throw new Error(error.response?.data?.detail || 'Failed to link Google account');
    }
  },

  /**
   * Verify email address using token from verification link
   */
  verifyEmail: async (token: string): Promise<{ message: string; verified: boolean }> => {
    try {
      const response = await api.get<{ message: string; verified: boolean }>('/auth/verify-email', {
        params: { token },
      });
      // Email is now verified — clear the flag
      localStorage.removeItem('requires_email_verification');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Email verification failed');
    }
  },

  /**
   * Resend email verification link (requires auth)
   */
  resendVerification: async (): Promise<{ message: string }> => {
    try {
      const response = await api.post<{ message: string }>('/auth/resend-verification');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to resend verification email');
    }
  },

  /**
   * Check if current user needs email verification
   */
  needsEmailVerification: (): boolean => {
    return localStorage.getItem('requires_email_verification') === 'true';
  },

  /**
   * Delete user account permanently
   * Requires password verification and explicit confirmation text "DELETE"
   */
  deleteAccount: async (password: string, confirmationText: string): Promise<void> => {
    try {
      await api.delete('/auth/account', {
        data: { password, confirmationText }
      });
      // Clear all local storage after successful deletion
      authService.logout();
    } catch (error: any) {
      console.error('Account deletion error:');
      throw new Error(error.response?.data?.detail || 'Failed to delete account');
    }
  }
};

export default authService; 
