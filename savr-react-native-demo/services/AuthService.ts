import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://localhost:8000/api/';

const ACCESS_TOKEN_KEY = 'auth.accessToken';
const USER_ID_KEY = 'auth.userId';

export interface AuthSession {
  accessToken: string;
  userID: number;
}

interface LoginResponse {
  access_token: string;
  user_id: number;
}

interface UserProfileResponse {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  address?: {
    street?: string | null;
    city?: string | null;
    province?: string | null;
    postal_code?: string | null;
  } | null;
}

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  } | null;
}

export class APIError extends Error {
  public readonly statusCode: number;
  public readonly responseBody?: string;
  public readonly requestURL: string;
  public readonly method: string;

  constructor(params: {
    statusCode: number;
    message: string;
    responseBody?: string;
    requestURL: string;
    method: string;
  }) {
    super(params.message);
    this.name = 'APIError';
    this.statusCode = params.statusCode;
    this.responseBody = params.responseBody;
    this.requestURL = params.requestURL;
    this.method = params.method;
  }
}

class AuthTokenStore {
  async save(accessToken: string, userID: number): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(USER_ID_KEY, String(userID));
  }

  async loadSession(): Promise<AuthSession | null> {
    const [accessToken, userIDRaw] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(USER_ID_KEY),
    ]);

    if (!accessToken || !userIDRaw) {
      return null;
    }

    const userID = Number(userIDRaw);
    if (!Number.isFinite(userID)) {
      return null;
    }

    return { accessToken, userID };
  }

  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_ID_KEY),
    ]);
  }
}

export class AuthService {
  private readonly baseUrl: string;
  private readonly tokenStore: AuthTokenStore;

  constructor(baseUrl: string = API_BASE_URL, tokenStore: AuthTokenStore = new AuthTokenStore()) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    this.tokenStore = tokenStore;
  }

  async login(username: string, password: string): Promise<AuthSession> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await this.request<LoginResponse>('auth/login', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: formData,
    });

    const session: AuthSession = {
      accessToken: response.access_token,
      userID: response.user_id,
    };

    await this.tokenStore.save(session.accessToken, session.userID);
    return session;
  }

  async restoreSession(): Promise<AuthSession | null> {
    return this.tokenStore.loadSession();
  }

  async fetchProfile(): Promise<UserProfile> {
    const session = await this.tokenStore.loadSession();
    if (!session) {
      throw new APIError({
        statusCode: 401,
        message: 'You are not signed in.',
        requestURL: this.url('auth/profile'),
        method: 'GET',
      });
    }

    const response = await this.request<UserProfileResponse>('auth/profile', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: 'application/json',
      },
    });

    return {
      id: response.id,
      email: response.email,
      firstName: response.first_name ?? '',
      lastName: response.last_name ?? '',
      phone: response.phone ?? '',
      address: response.address
        ? {
            street: response.address.street ?? '',
            city: response.address.city ?? '',
            province: response.address.province ?? '',
            postalCode: response.address.postal_code ?? '',
          }
        : null,
    };
  }

  async signup(params: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    street?: string;
    city?: string;
    province?: string;
    postal?: string;
  }): Promise<AuthSession> {
    const body: Record<string, unknown> = {
      email: params.email,
      password: params.password,
    };

    if (params.firstName?.trim()) body.first_name = params.firstName.trim();
    if (params.lastName?.trim()) body.last_name = params.lastName.trim();
    if (params.phone?.trim()) body.phone = params.phone.trim();

    const hasAddress = [params.street, params.city, params.province, params.postal].some(
      (v) => !!v?.trim()
    );

    if (hasAddress) {
      const address: Record<string, string> = {};
      if (params.street?.trim()) address.street = params.street.trim();
      if (params.city?.trim()) address.city = params.city.trim();
      if (params.province?.trim()) address.province = params.province.trim();
      if (params.postal?.trim()) address.postal_code = params.postal.trim();
      body.address = address;
    }

    const response = await this.request<LoginResponse>('auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    const session: AuthSession = {
      accessToken: response.access_token,
      userID: response.user_id,
    };

    await this.tokenStore.save(session.accessToken, session.userID);
    return session;
  }

  async logout(): Promise<void> {
    await this.tokenStore.clear();
  }

  private url(path: string): string {
    return new URL(path, this.baseUrl).toString();
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const requestURL = this.url(path);
    const method = (init.method ?? 'GET').toUpperCase();

    const res = await fetch(requestURL, init);
    const text = await res.text();

    if (!res.ok) {
      const message = this.extractErrorMessage(text) || `Request failed with status ${res.status}`;
      throw new APIError({
        statusCode: res.status,
        message,
        responseBody: text || undefined,
        requestURL,
        method,
      });
    }

    if (!text) {
      return {} as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new APIError({
        statusCode: res.status,
        message: 'Expected JSON response but received invalid JSON.',
        responseBody: text,
        requestURL,
        method,
      });
    }
  }

  private extractErrorMessage(responseBody: string): string | null {
    if (!responseBody) return null;

    try {
      const parsed = JSON.parse(responseBody) as
        | { detail?: string; message?: string; error?: string }
        | undefined;
      return parsed?.detail ?? parsed?.message ?? parsed?.error ?? null;
    } catch {
      return responseBody;
    }
  }
}
