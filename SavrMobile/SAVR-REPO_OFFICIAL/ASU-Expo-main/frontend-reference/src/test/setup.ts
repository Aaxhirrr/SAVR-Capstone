import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import matchers from '@testing-library/jest-dom/matchers'
import '@testing-library/jest-dom'

// Extend Vitest's expect method with jest-dom matchers
expect.extend(matchers)

// Clean up after each test
afterEach(() => {
  cleanup()
})

// Mock localStorage for testing environments like Vitest/Jest
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }

  // Add missing Storage properties/methods
  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return index >= 0 && index < keys.length ? keys[index] : null;
  }
}

// Mock localStorage globally
global.localStorage = new LocalStorageMock()

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {
    // Intentionally empty
  }

  observe() {
    return null
  }

  unobserve() {
    return null
  }

  disconnect() {
    return null
  }
} as any 