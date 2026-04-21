import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from './api';

const TOKEN_KEY = 'savr_access_token';
const USER_ID_KEY = 'savr_user_id';

export interface LoginResponse {
  access_token: string;
  user_id: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);

  const response = await axios.post<LoginResponse>(
    `${API_BASE_URL}/auth/login`,
    params.toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
    }
  );

  const { access_token, user_id } = response.data;
  await AsyncStorage.setItem(TOKEN_KEY, access_token);
  await AsyncStorage.setItem(USER_ID_KEY, String(user_id));

  return response.data;
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_ID_KEY);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getUserId(): Promise<string | null> {
  return AsyncStorage.getItem(USER_ID_KEY);
}

export async function isLoggedIn(): Promise<boolean> {
  const token = await getToken();
  return token !== null;
}
