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
        postalCode: input.postal,
      })
        .filter(([, value]) => value.trim())
        .map(([key, value]) => [key, value.trim()]),
    );
    if (Object.keys(address).length) {
      if (
        !input.street.trim() ||
        !input.city.trim() ||
        !input.province.trim() ||
        !input.postal.trim()
      )
        throw new Error(
          'Enter street, city, province and postal code, or leave the address empty.',
        );
      body.address = address;
    }
    return parseSession(
      await this.api.request('auth/signup', { method: 'POST', body }),
    );
  }
  async profile(signal?: AbortSignal) {
    return parseProfile(await this.api.request('auth/profile', { signal }));
  }
  async saveProfile(p: Profile) {
    if (
      p.address.trim() &&
      (!p.city?.trim() || !p.province?.trim() || !p.postalCode?.trim())
    )
      throw new Error(
        'Enter city, province and postal code with your street address.',
      );
    return parseProfile(
      await this.api.request('auth/profile', {
        method: 'PUT',
        body: {
          first_name: p.firstName,
          last_name: p.lastName,
          address: p.address.trim()
            ? {
                street: p.address.trim(),
                city: p.city?.trim(),
                province: p.province?.trim(),
                postalCode: p.postalCode?.trim(),
                phoneNumber: p.addressPhone || null,
              }
            : null,
          dietaryRestrictions: p.dietary,
          brandPreferences: {
            liked: p.likedBrands,
            disliked: p.dislikedBrands,
          },
        },
      }),
    );
  }
  async changePassword(current: string, password: string) {
    await this.api.request('auth/change-password', {
      method: 'POST',
      body: { current_password: current, new_password: password },
    });
  }
  async deleteAccount() {
    await this.api.request('auth/account', {
      method: 'DELETE',
      body: { confirmationText: 'DELETE' },
    });
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
  async renameList(id: string, name: string) {
    if (!name.trim()) throw new Error('Enter a list name.');
    return parseList(
      await this.api.request(`grocery-lists/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: { name: name.trim() },
      }),
    );
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
  async addDeals(itemNames: string[], listId: string) {
    if (
      !listId ||
      !itemNames.length ||
      itemNames.some((name) => !name.trim())
    )
      throw new Error('Choose a grocery list and at least one deal.');
    await this.api.request('flyers/add-to-list', {
      method: 'POST',
      body: { item_names: itemNames, list_id: listId },
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
