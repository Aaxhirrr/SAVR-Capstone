import axios from 'axios';
import { API_BASE_URL } from './api';
import { getToken } from './auth';

export type UserProfile = {
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
  dietaryRestrictions?: string[];
  dietary_restrictions?: string[];
  brandPreferences?: {
    liked?: Record<string, string>;
    disliked?: Record<string, string>;
  };
  brand_preferences?: {
    liked?: Record<string, string>;
    disliked?: Record<string, string>;
  };
};

export type ProfileUpdate = {
  dietaryRestrictions?: string[];
  brandPreferences?: {
    liked?: Record<string, string>;
    disliked?: Record<string, string>;
  };
};

async function getAuthHeaders() {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getProfile(): Promise<UserProfile> {
  const headers = await getAuthHeaders();
  const response = await axios.get<UserProfile>(`${API_BASE_URL}/auth/profile`, {
    headers,
    timeout: 8000,
  });
  return response.data;
}

export async function updateProfile(data: ProfileUpdate): Promise<UserProfile> {
  const headers = await getAuthHeaders();
  const response = await axios.put<UserProfile>(
    `${API_BASE_URL}/auth/profile`,
    data,
    { headers, timeout: 8000 }
  );
  return response.data;
}

/** Display name: "First Last" or email or username or fallback */
export function getDisplayName(profile: UserProfile | null): string {
  if (!profile) return 'User';
  const first = profile.first_name?.trim();
  const last = profile.last_name?.trim();
  if (first || last) return [first, last].filter(Boolean).join(' ');
  if (profile.email) return profile.email;
  if (profile.username) return profile.username;
  return 'User';
}
