import {
  array,
  parseChat,
  parseDeals,
  parseHistory,
  parseList,
  parseProfile,
  parseSession,
  parseStores,
} from '../models/domain.ts';
import type { KnownStore, Profile, Signup } from '../models/domain.ts';
import { ApiClient } from './api.ts';

export class SavrService {
  private readonly api: ApiClient;
  constructor(api: ApiClient) {
    this.api = api;
  }
  async login(username: string, password: string) {
    const form = new FormData();
    form.append('username', username.trim());
    form.append('password', password);
    return parseSession(
      await this.api.request('auth/login', { method: 'POST', body: form }),
    );
  }
  async signup(input: Signup) {
    const body: Record<string, unknown> = {
      email: input.email.trim(),
      password: input.password,
    };
    for (const [key, value] of Object.entries({
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone,
    }))
      if (value.trim()) body[key] = value.trim();
    const address = Object.fromEntries(
      Object.entries({
        street: input.street,
        city: input.city,
        province: input.province,
        postal_code: input.postal,
      })
        .filter(([, value]) => value.trim())
        .map(([key, value]) => [key, value.trim()]),
    );
    if (Object.keys(address).length) body.address = address;
    return parseSession(
      await this.api.request('auth/signup', { method: 'POST', body }),
    );
  }
  async profile() {
    return parseProfile(await this.api.request('auth/profile'));
  }
  async saveProfile(p: Profile) {
    await this.api.request('auth/profile', {
      method: 'PUT',
      body: {
        first_name: p.firstName,
        last_name: p.lastName,
        phone: p.phone,
        address: { street: p.address },
        dietary_restrictions: p.dietary,
        brand_preferences: { liked: p.likedBrands, disliked: p.dislikedBrands },
      },
    });
  }
  async changePassword(current: string, password: string) {
    await this.api.request('auth/change-password', {
      method: 'POST',
      body: { current_password: current, new_password: password },
    });
  }
  async deleteAccount() {
    await this.api.request('auth/account', { method: 'DELETE' });
  }
  async lists(signal?: AbortSignal) {
    return array(await this.api.request('grocery-lists/all', { signal })).map(
      parseList,
    );
  }
  async list(id: string, signal?: AbortSignal) {
    return parseList(
      await this.api.request(`grocery-lists/${encodeURIComponent(id)}`, {
        signal,
      }),
    );
  }
  async deleteList(id: string) {
    await this.api.request(`grocery-lists/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
  async sendMessage(message: string, sessionId?: string) {
    return parseChat(
      await this.api.request('chat/message', {
        method: 'POST',
        body: { message, ...(sessionId ? { sessionId } : {}) },
      }),
    );
  }
  async history(sessionId: string) {
    return parseHistory(
      await this.api.request(`chat/history/${encodeURIComponent(sessionId)}`),
    );
  }
  async deals(brand: string, search = '', page = 1, signal?: AbortSignal) {
    return parseDeals(
      await this.api.request('flyers', {
        query: { store_brand: brand, search, page, page_size: 30 },
        signal,
      }),
    );
  }
  async addDeals(dealIds: string[], listId: string) {
    if (!listId || !dealIds.length)
      throw new Error('Choose a grocery list and at least one deal.');
    await this.api.request('flyers/add-to-list', {
      method: 'POST',
      body: { deal_ids: dealIds, list_id: listId },
    });
  }
  async stores(signal?: AbortSignal) {
    return parseStores(
      await this.api.request('user/selected_stores', { signal }),
    );
  }
  async addStore(store: KnownStore) {
    await this.api.request('user/selected_stores', {
      method: 'POST',
      body: {
        store_name: store.name,
        address: store.address,
        postal_code: store.postalCode,
        latitude: store.latitude,
        longitude: store.longitude,
        brand: store.brand,
      },
    });
  }
  async removeStore(id: string) {
    await this.api.request(`user/selected_stores/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
}
