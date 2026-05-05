import { describe, it, expect, beforeEach } from "vitest";
import { webcrypto } from "node:crypto";
import { BrowserCryptoProvider } from "../providers/crypto.js";
import { createBrowserStorage } from "../providers/storage.js";

function createFakeIndexedDB(): IDBFactory {
  const stores = new Map<string, Map<IDBValidKey, unknown>>();

  function createRequest<T>(operation: () => T): IDBRequest<T> {
    const request = {
      result: undefined as T,
      error: null as DOMException | null,
      onsuccess: null as ((this: IDBRequest<T>, ev: Event) => unknown) | null,
      onerror: null as ((this: IDBRequest<T>, ev: Event) => unknown) | null,
    };

    queueMicrotask(() => {
      try {
        request.result = operation();
        request.onsuccess?.call(request as unknown as IDBRequest<T>, new Event("success"));
      } catch (error) {
        request.error = error as DOMException;
        request.onerror?.call(request as unknown as IDBRequest<T>, new Event("error"));
      }
    });

    return request as unknown as IDBRequest<T>;
  }

  function createDatabase(): IDBDatabase {
    return {
      objectStoreNames: {
        contains: (storeName: string) => stores.has(storeName),
      },
      createObjectStore: (storeName: string) => {
        if (!stores.has(storeName)) {
          stores.set(storeName, new Map());
        }
        return {};
      },
      transaction: (storeName: string) => {
        const store = stores.get(storeName);
        if (!store) {
          throw new Error(`Missing object store: ${storeName}`);
        }
        return {
          objectStore: () => ({
            get: (key: IDBValidKey) => createRequest(() => store.get(key)),
            put: (value: unknown, key: IDBValidKey) =>
              createRequest(() => {
                store.set(key, value);
                return key;
              }),
            delete: (key: IDBValidKey) =>
              createRequest(() => {
                store.delete(key);
                return undefined;
              }),
          }),
        };
      },
      close: () => {},
    } as unknown as IDBDatabase;
  }

  return {
    open: () => {
      const isNew = stores.size === 0;
      const request = {
        result: undefined as unknown as IDBDatabase,
        error: null,
        onsuccess: null as ((this: IDBOpenDBRequest, ev: Event) => unknown) | null,
        onerror: null as ((this: IDBOpenDBRequest, ev: Event) => unknown) | null,
        onupgradeneeded: null as
          | ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => unknown)
          | null,
      };

      queueMicrotask(() => {
        request.result = createDatabase();
        if (isNew) {
          request.onupgradeneeded?.call(
            request as unknown as IDBOpenDBRequest,
            new Event("upgradeneeded") as IDBVersionChangeEvent,
          );
        }
        request.onsuccess?.call(request as unknown as IDBOpenDBRequest, new Event("success"));
      });

      return request as unknown as IDBOpenDBRequest;
    },
  } as unknown as IDBFactory;
}

describe("BrowserCryptoProvider", () => {
  const crypto = new BrowserCryptoProvider();

  it("should generate random bytes", async () => {
    const bytes = await crypto.randomBytes(32);

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(32);
  });

  it("should compute SHA-256 hash", async () => {
    const hash = await crypto.sha256("hello");

    expect(hash).toBeInstanceOf(Uint8Array);
    expect(hash.length).toBe(32);
  });

  it("should generate code verifier", async () => {
    const verifier = await crypto.generateCodeVerifier();

    expect(typeof verifier).toBe("string");
    expect(verifier.length).toBeGreaterThanOrEqual(43);
  });

  it("should generate code challenge from verifier", async () => {
    const verifier = await crypto.generateCodeVerifier();
    const challenge = await crypto.generateCodeChallenge(verifier);

    expect(typeof challenge).toBe("string");
    expect(challenge.length).toBeGreaterThan(0);
  });

  it("should persist and preflight a scoped browser DPoP key", async () => {
    const indexedDB = createFakeIndexedDB();
    const provider = new BrowserCryptoProvider({
      issuer: "https://auth.example.com",
      clientId: "client-a",
      crypto: webcrypto as unknown as Crypto,
      indexedDB,
    });

    const preflight = await provider.preflightDPoPKeyPersistence();
    const keyPair = await provider.getDPoPKeyPair();

    expect(preflight.ok).toBe(true);
    expect(preflight.thumbprint).toBe(keyPair?.thumbprint);
    expect(keyPair?.publicKeyJwk.d).toBeUndefined();
  });

  it("should report unavailable IndexedDB in browser DPoP preflight", async () => {
    const provider = new BrowserCryptoProvider({
      crypto: webcrypto as unknown as Crypto,
      indexedDB: null,
    });

    const preflight = await provider.preflightDPoPKeyPersistence();

    expect(preflight).toMatchObject({
      ok: false,
      reason: "indexeddb_unavailable",
    });
  });
});

describe("createBrowserStorage", () => {
  beforeEach(() => {
    // Clear storage before each test
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.clear();
    }
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  describe("memory storage", () => {
    it("should use memory storage by default", async () => {
      const storage = createBrowserStorage();

      await storage.set("key", "value");

      expect(await storage.get("key")).toBe("value");
      expect(sessionStorage.getItem("authrim:key")).toBeNull();
    });

    it("should store and retrieve values", async () => {
      const storage = createBrowserStorage({ storage: "memory" });

      await storage.set("key", "value");
      const result = await storage.get("key");

      expect(result).toBe("value");
    });

    it("should remove values", async () => {
      const storage = createBrowserStorage({ storage: "memory" });

      await storage.set("key", "value");
      await storage.remove("key");
      const result = await storage.get("key");

      expect(result).toBeNull();
    });

    it("should get all values", async () => {
      const storage = createBrowserStorage({ storage: "memory" });

      await storage.set("key1", "value1");
      await storage.set("key2", "value2");
      const all = await storage.getAll!();

      expect(all).toEqual({ key1: "value1", key2: "value2" });
    });

    it("should clear all values", async () => {
      const storage = createBrowserStorage({ storage: "memory" });

      await storage.set("key1", "value1");
      await storage.set("key2", "value2");
      await storage.clear!();
      const all = await storage.getAll!();

      expect(all).toEqual({});
    });
  });
});
