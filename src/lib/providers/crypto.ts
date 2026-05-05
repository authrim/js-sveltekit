/**
 * Browser Crypto Provider
 *
 * Web Crypto API を使用したプラットフォーム実装
 */

import type {
  CryptoProvider,
  DPoPAlgorithm,
  DPoPKeyPair,
  JWK,
} from "@authrim/core";
import { base64urlEncode } from "@authrim/core";

const DPOP_DB_NAME = "authrim-dpop-keys";
const DPOP_STORE_NAME = "keys";
const DPOP_DB_VERSION = 1;

export interface BrowserCryptoProviderOptions {
  issuer?: string;
  clientId?: string;
  crypto?: Crypto | null;
  indexedDB?: IDBFactory | null;
  dpopDatabaseName?: string;
}

export interface BrowserDPoPPreflightResult {
  ok: boolean;
  reason?:
    | "webcrypto_unavailable"
    | "indexeddb_unavailable"
    | "unsupported_algorithm"
    | "key_generation_failed"
    | "private_key_extractable"
    | "persistence_failed"
    | "signing_failed";
  message?: string;
  thumbprint?: string;
}

interface StoredDPoPKeyPair {
  algorithm: DPoPAlgorithm;
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicKeyJwk: JWK;
  thumbprint: string;
  createdAt: number;
}

export class BrowserCryptoProvider implements CryptoProvider {
  private readonly issuer?: string;
  private readonly clientId?: string;
  private readonly cryptoImpl?: Crypto;
  private readonly indexedDBImpl?: IDBFactory;
  private readonly dpopDatabaseName: string;

  constructor(options: BrowserCryptoProviderOptions = {}) {
    this.issuer = options.issuer;
    this.clientId = options.clientId;
    this.cryptoImpl =
      "crypto" in options ? (options.crypto ?? undefined) : globalThis.crypto;
    this.indexedDBImpl =
      "indexedDB" in options
        ? (options.indexedDB ?? undefined)
        : globalThis.indexedDB;
    this.dpopDatabaseName = options.dpopDatabaseName ?? DPOP_DB_NAME;
  }

  async randomBytes(length: number): Promise<Uint8Array> {
    const bytes = new Uint8Array(length);
    this.requireCrypto().getRandomValues(bytes);
    return bytes;
  }

  async sha256(data: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(data);
    const hash = await this.requireSubtle().digest("SHA-256", bytes);
    return new Uint8Array(hash);
  }

  async generateCodeVerifier(): Promise<string> {
    const bytes = await this.randomBytes(32);
    return base64urlEncode(bytes);
  }

  async generateCodeChallenge(verifier: string): Promise<string> {
    const hash = await this.sha256(verifier);
    return base64urlEncode(hash);
  }

  async generateDPoPKeyPair(
    algorithm: DPoPAlgorithm = "ES256",
  ): Promise<DPoPKeyPair> {
    if (algorithm !== "ES256") {
      throw new Error(`Browser DPoP only supports ES256, got ${algorithm}`);
    }

    const crypto = this.requireSubtle();
    const keyPair = await crypto.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign", "verify"],
    );

    if (keyPair.privateKey.extractable) {
      throw new Error("Generated DPoP private key is unexpectedly extractable");
    }

    const publicKeyJwk = await this.exportPublicJwk(keyPair.publicKey);
    const thumbprint = await this.calculateJwkThumbprint(publicKeyJwk);
    const stored: StoredDPoPKeyPair = {
      algorithm,
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      publicKeyJwk,
      thumbprint,
      createdAt: Date.now(),
    };

    await this.putStoredDPoPKeyPair(stored);
    return this.toDPoPKeyPair(stored);
  }

  async getDPoPKeyPair(): Promise<DPoPKeyPair | null> {
    const stored = await this.getStoredDPoPKeyPair();
    return stored ? this.toDPoPKeyPair(stored) : null;
  }

  async clearDPoPKeyPair(): Promise<void> {
    if (!this.indexedDBImpl) {
      return;
    }
    await this.deleteStoredDPoPKeyPair();
  }

  async preflightDPoPKeyPersistence(
    algorithm: DPoPAlgorithm = "ES256",
  ): Promise<BrowserDPoPPreflightResult> {
    if (!this.cryptoImpl?.subtle) {
      return {
        ok: false,
        reason: "webcrypto_unavailable",
        message: "WebCrypto subtle crypto is unavailable",
      };
    }
    if (!this.indexedDBImpl) {
      return {
        ok: false,
        reason: "indexeddb_unavailable",
        message: "IndexedDB is unavailable for persistent DPoP key storage",
      };
    }
    if (algorithm !== "ES256") {
      return {
        ok: false,
        reason: "unsupported_algorithm",
        message: `Browser DPoP only supports ES256, got ${algorithm}`,
      };
    }

    let keyPair: DPoPKeyPair;
    try {
      keyPair =
        (await this.getDPoPKeyPair()) ??
        (await this.generateDPoPKeyPair(algorithm));
    } catch (error) {
      return {
        ok: false,
        reason: "key_generation_failed",
        message: error instanceof Error ? error.message : "DPoP key generation failed",
      };
    }

    try {
      await keyPair.sign(new TextEncoder().encode("authrim-dpop-preflight"));
    } catch (error) {
      return {
        ok: false,
        reason: "signing_failed",
        message: error instanceof Error ? error.message : "DPoP signing failed",
      };
    }

    try {
      const reloaded = await this.getDPoPKeyPair();
      if (!reloaded || reloaded.thumbprint !== keyPair.thumbprint) {
        return {
          ok: false,
          reason: "persistence_failed",
          message: "DPoP key could not be reloaded after persistence",
        };
      }
      await reloaded.sign(new TextEncoder().encode("authrim-dpop-reload"));
      return { ok: true, thumbprint: reloaded.thumbprint };
    } catch (error) {
      return {
        ok: false,
        reason: "persistence_failed",
        message: error instanceof Error ? error.message : "DPoP persistence check failed",
      };
    }
  }

  private requireCrypto(): Crypto {
    if (!this.cryptoImpl) {
      throw new Error("WebCrypto is unavailable");
    }
    return this.cryptoImpl;
  }

  private requireSubtle(): SubtleCrypto {
    const subtle = this.requireCrypto().subtle;
    if (!subtle) {
      throw new Error("WebCrypto subtle crypto is unavailable");
    }
    return subtle;
  }

  private getDPoPStoreKey(): string {
    const issuer = this.issuer ? new URL(this.issuer).origin : "default-issuer";
    const clientId = this.clientId ?? "default-client";
    return `${issuer}|${clientId}`;
  }

  private openDPoPDatabase(): Promise<IDBDatabase> {
    if (!this.indexedDBImpl) {
      return Promise.reject(new Error("IndexedDB is unavailable"));
    }

    return new Promise((resolve, reject) => {
      const request = this.indexedDBImpl!.open(
        this.dpopDatabaseName,
        DPOP_DB_VERSION,
      );
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to open DPoP key DB"));
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DPOP_STORE_NAME)) {
          db.createObjectStore(DPOP_STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
    });
  }

  private async withDPoPStore<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const db = await this.openDPoPDatabase();
    try {
      return await new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(DPOP_STORE_NAME, mode);
        const request = operation(transaction.objectStore(DPOP_STORE_NAME));
        request.onerror = () =>
          reject(request.error ?? new Error("DPoP key store operation failed"));
        request.onsuccess = () => resolve(request.result);
      });
    } finally {
      db.close();
    }
  }

  private async getStoredDPoPKeyPair(): Promise<StoredDPoPKeyPair | null> {
    const stored = await this.withDPoPStore<StoredDPoPKeyPair | undefined>(
      "readonly",
      (store) =>
        store.get(this.getDPoPStoreKey()) as IDBRequest<
          StoredDPoPKeyPair | undefined
        >,
    );
    return stored ?? null;
  }

  private async putStoredDPoPKeyPair(stored: StoredDPoPKeyPair): Promise<void> {
    await this.withDPoPStore<IDBValidKey>("readwrite", (store) =>
      store.put(stored, this.getDPoPStoreKey()),
    );
  }

  private async deleteStoredDPoPKeyPair(): Promise<void> {
    await this.withDPoPStore<undefined>("readwrite", (store) =>
      store.delete(this.getDPoPStoreKey()) as IDBRequest<undefined>,
    );
  }

  private async exportPublicJwk(publicKey: CryptoKey): Promise<JWK> {
    const rawJwk = (await this.requireSubtle().exportKey("jwk", publicKey)) as JWK;
    return {
      kty: rawJwk.kty,
      crv: rawJwk.crv,
      x: rawJwk.x,
      y: rawJwk.y,
    };
  }

  private async calculateJwkThumbprint(jwk: JWK): Promise<string> {
    if (jwk.kty !== "EC" || jwk.crv !== "P-256" || !jwk.x || !jwk.y) {
      throw new Error("Invalid EC public JWK for DPoP thumbprint");
    }
    const canonical = JSON.stringify({
      crv: jwk.crv,
      kty: jwk.kty,
      x: jwk.x,
      y: jwk.y,
    });
    const digest = await this.sha256(canonical);
    return base64urlEncode(digest);
  }

  private toDPoPKeyPair(stored: StoredDPoPKeyPair): DPoPKeyPair {
    return {
      algorithm: stored.algorithm,
      publicKeyJwk: stored.publicKeyJwk,
      thumbprint: stored.thumbprint,
      sign: async (data: Uint8Array): Promise<Uint8Array> => {
        const input = data.buffer.slice(
          data.byteOffset,
          data.byteOffset + data.byteLength,
        ) as ArrayBuffer;
        const signature = await this.requireSubtle().sign(
          { name: "ECDSA", hash: "SHA-256" },
          stored.privateKey,
          input,
        );
        return new Uint8Array(signature);
      },
    };
  }
}
