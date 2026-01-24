import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserCryptoProvider } from '../providers/crypto.js';
import { createBrowserStorage } from '../providers/storage.js';

describe('BrowserCryptoProvider', () => {
  const crypto = new BrowserCryptoProvider();

  it('should generate random bytes', async () => {
    const bytes = await crypto.randomBytes(32);

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(32);
  });

  it('should compute SHA-256 hash', async () => {
    const hash = await crypto.sha256('hello');

    expect(hash).toBeInstanceOf(Uint8Array);
    expect(hash.length).toBe(32);
  });

  it('should generate code verifier', async () => {
    const verifier = await crypto.generateCodeVerifier();

    expect(typeof verifier).toBe('string');
    expect(verifier.length).toBeGreaterThanOrEqual(43);
  });

  it('should generate code challenge from verifier', async () => {
    const verifier = await crypto.generateCodeVerifier();
    const challenge = await crypto.generateCodeChallenge(verifier);

    expect(typeof challenge).toBe('string');
    expect(challenge.length).toBeGreaterThan(0);
  });
});

describe('createBrowserStorage', () => {
  beforeEach(() => {
    // Clear storage before each test
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('memory storage', () => {
    it('should store and retrieve values', async () => {
      const storage = createBrowserStorage({ storage: 'memory' });

      await storage.set('key', 'value');
      const result = await storage.get('key');

      expect(result).toBe('value');
    });

    it('should remove values', async () => {
      const storage = createBrowserStorage({ storage: 'memory' });

      await storage.set('key', 'value');
      await storage.remove('key');
      const result = await storage.get('key');

      expect(result).toBeNull();
    });

    it('should get all values', async () => {
      const storage = createBrowserStorage({ storage: 'memory' });

      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      const all = await storage.getAll!();

      expect(all).toEqual({ key1: 'value1', key2: 'value2' });
    });

    it('should clear all values', async () => {
      const storage = createBrowserStorage({ storage: 'memory' });

      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      await storage.clear!();
      const all = await storage.getAll!();

      expect(all).toEqual({});
    });
  });
});
