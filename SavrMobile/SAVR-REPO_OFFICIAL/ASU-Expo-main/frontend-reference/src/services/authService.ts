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
        console.log('Fetching profile after login...');
        const profileResponse = await api.get<User>('/auth/profile');
        console.log('Profile response after login:', JSON.stringify(profileResponse.data, null, 2));
        
        // Make sure the profile data is complete before saving to localStorage
        if (!profileResponse.data.dietaryRestrictions && !profileResponse.data.dietary_restrictions) {
          console.log('No dietary restrictions found in login profile response, this might indicate incomplete data');
        }
        
        if (!profileResponse.data.brandPreferences && !profileResponse.data.brand_preferences) {
          console.log('No brand preferences found in login profile response, this might indicate incomplete data');
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
            console.log('Saved merged profile to localStorage after login');
          } catch (e) {
            // If parsing fails, just use the new data
            localStorage.setItem('user', JSON.stringify(profileResponse.data));
            console.log('Error merging with existing profile, using new profile data only');
          }
        } else {
          // If no existing data, just save the new profile
          localStorage.setItem('user', JSON.stringify(profileResponse.data));
          console.log('No existing profile found, saved new profile to localStorage');
        }
      } catch (profileError) {
        console.error('Error fetching user profile after login:', profileError);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },
  
  /**
   * Register a new user
   */
  signup: async (data: SignupData): Promise<AuthResponse> => {
    try {
      console.log('Sending signup data:', JSON.stringify(data, null, 2));
      
      const response = await api.post<AuthResponse>('/auth/signup', data);
      
      console.log('Signup successful:', response.data);
      
      // Save token in localStorage
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user_id', response.data.user_id);

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
        console.log('Fetching profile after signup...');
        const profileResponse = await api.get<User>('/auth/profile');
        console.log('Profile response after signup:', JSON.stringify(profileResponse.data, null, 2));
        
        // Make sure the profile data is complete before saving to localStorage
        if (!profileResponse.data.dietaryRestrictions && !profileResponse.data.dietary_restrictions) {
          console.log('No dietary restrictions found in signup profile response, this might indicate incomplete data');
        }
        
        if (!profileResponse.data.brandPreferences && !profileResponse.data.brand_preferences) {
          console.log('No brand preferences found in signup profile response, this might indicate incomplete data');
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
            console.log('Saved merged profile to localStorage after signup');
          } catch (e) {
            // If parsing fails, just use the new data
            localStorage.setItem('user', JSON.stringify(profileResponse.data));
            console.log('Error merging with existing profile, using new profile data only');
          }
        } else {
          // If no existing data, just save the new profile
          localStorage.setItem('user', JSON.stringify(profileResponse.data));
          console.log('No existing profile found, saved new profile to localStorage');
        }
      } catch (profileError) {
        console.error('Error fetching user profile after signup:', profileError);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Signup error:', error);
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
      console.log('Fetching user profile from server...');
      const response = await api.get<User>('/auth/profile');
      
      // Check if we have locally stored user data that might have more complete information
      console.log('Checking localStorage for user data...');
      const localUserData = localStorage.getItem('user');
      let localUser: User | null = null;
      
      if (localUserData) {
        try {
          localUser = JSON.parse(localUserData);
          console.log('Found user data in localStorage:', JSON.stringify(localUser, null, 2));
        } catch (e) {
          console.error('Error parsing local user data:', e);
        }
      } else {
        console.log('No user data found in localStorage');
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
      
      console.log('Enhanced profile with local data:', JSON.stringify(enhancedProfile, null, 2));
      
      // Update local storage with the enhanced data to ensure consistency
      localStorage.setItem('user', JSON.stringify(enhancedProfile));
      
      return enhancedProfile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      
      // If API call fails, try to use cached data as fallback
      const cachedData = localStorage.getItem('user');
      if (cachedData) {
        console.log('Using cached profile data due to API error');
        try {
          return JSON.parse(cachedData) as User;
        } catch (e) {
          console.error('Error parsing cached data:', e);
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
        console.log('Removing localStorage key on logout:', key);
        localStorage.removeItem(key);
      });

      console.log('User logged out successfully, localStorage cleared');
      
      // Return success status
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  },
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    console.log('authService.isAuthenticated() called, token exists:', !!token);
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
      console.log('Update profile request data:', JSON.stringify(cleanData, null, 2));
      
      // Make the API call
      const response = await api.put<User>('/auth/profile', cleanData);
      console.log('Profile update success response:', JSON.stringify(response.data, null, 2));
      
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
      
      console.log('Merged profile data for UI:', JSON.stringify(mergedResponse, null, 2));
      return mergedResponse;
    } catch (error: any) {
      // Log detailed error information
      console.error('Profile update error:', error.response?.data || error.message);
      if (error.response?.data) {
        console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  },

  /**
   * Update user password
   */
  updatePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      console.log('Attempting to update password');
      // Use the endpoint that appears in the backend logs
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      console.log('Password updated successfully');
    } catch (error: any) {
      console.error('Password update failed:', error);
      // Log detailed error information
      if (error.response?.data) {
        console.error('Full error response:', JSON.stringify(error.response.data));
      }
      throw error;
    }
  },

  /**
   * Refresh user profile from the server
   */
  refreshProfile: async (): Promise<boolean> => {
    try {
      console.log('Refreshing user profile...');
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('Cannot refresh profile: No authentication token found');
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
        } catch (e) { console.error('Error parsing local user data during refresh:', e); }
      }

      const mergedProfile = {
        ...response.data, // Start with fresh data from server
        dietaryRestrictions: response.data.dietaryRestrictions || response.data.dietary_restrictions || localUser?.dietaryRestrictions || localUser?.dietary_restrictions || [],
        brandPreferences: response.data.brandPreferences || response.data.brand_preferences || localUser?.brandPreferences || localUser?.brand_preferences || { liked: {}, disliked: {} },
      };

      localStorage.setItem('user', JSON.stringify(mergedProfile));
      console.log('Profile refreshed and merged successfully');
      return true;
    } catch (error) {
      console.error('Failed to refresh profile:', error);
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
        console.error('Error parsing user from localStorage:', error);
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
      console.log('Google OAuth redirect URI:', redirectUri);

      const response = await api.get<{ auth_url: string }>('/auth/google', {
        params: { redirect_uri: redirectUri }
      });
      return response.data.auth_url;
    } catch (error: any) {
      console.error('Error getting Google auth URL:', error);
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
      console.error('Google callback error:', error);
      throw new Error(error.response?.data?.detail || 'Google authentication failed');
    }
  },

  /**
   * Complete signup for a new Google user
   */
  completeGoogleSignup: async (data: GoogleSignupData): Promise<AuthResponse> => {
    try {
      console.log('Completing Google signup:', JSON.stringify(data, null, 2));
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
      console.error('Google signup completion error:', error);
      throw new Error(error.response?.data?.detail || 'Failed to complete Google signup');
    }
  },

  /**
   * Link Google account to existing email account (requires password)
   */
  linkGoogleAccount: async (data: GoogleLinkData): Promise<AuthResponse> => {
    try {
      console.log('Linking Google account for:', data.email);
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
      console.error('Google account linking error:', error);
      throw new Error(error.response?.data?.detail || 'Failed to link Google account');
    }
  },

  /**
   * Link Google account for already authenticated users
   */
  linkGoogleAccountAuthenticated: async (googleId: string): Promise<AuthResponse> => {
    try {
      console.log('Linking Google account for authenticated user');
      const response = await api.post<AuthResponse>('/auth/google/link-authenticated', {
        google_id: googleId
      });

      // Update token
      localStorage.setItem('token', response.data.access_token);

      return response.data;
    } catch (error: any) {
      console.error('Google account linking error:', error);
      throw new Error(error.response?.data?.detail || 'Failed to link Google account');
    }
  },

  /**
   * Delete user account permanently
   * Requires password verification and explicit confirmation text "DELETE"
   */
  deleteAccount: async (password: string | null, confirmationText: string): Promise<void> => {
    try {
      console.log('Requesting account deletion...');
      await api.delete('/auth/account', {
        data: { password: password || undefined, confirmationText }
      });
      console.log('Account deleted successfully');
      // Clear all local storage after successful deletion
      authService.logout();
    } catch (error: any) {
      console.error('Account deletion error:', error);
      throw new Error(error.response?.data?.detail || 'Failed to delete account');
    }
  }
};

export default authService; 