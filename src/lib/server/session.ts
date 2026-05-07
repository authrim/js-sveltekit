/**
 * Server Session Manager
 *
 * Cookie を完全に抽象化するレイヤー
 */

import type { RequestEvent } from "@sveltejs/kit";
import type { Session, User } from "@authrim/core";

/**
 * サーバー側の認証コンテキスト
 */
export interface ServerAuthContext {
  session: Session;
  user: User;
}

/**
 * ServerSessionManager のオプション
 */
export interface ServerSessionManagerOptions {
  /** Cookie 名 (default: 'authrim_session') */
  cookieName?: string;
  /** SameSite 設定 (default: 'lax') */
  sameSite?: "strict" | "lax" | "none";
  /** Secure フラグ (default: true in production) */
  secure?: boolean;
  /** Path (default: '/') */
  path?: string;
  /** 有効期限（秒）(default: 7 days) */
  maxAge?: number;
  /** HttpOnly フラグ (default: true) */
  httpOnly?: boolean;
  /**
   * Secret used to encrypt and authenticate the server session cookie.
   *
   * Required for setting or reading Authrim server sessions. Use at least
   * 32 bytes of high-entropy material and keep it server-side only.
   */
  sessionSecret?: string | Uint8Array | CryptoKey;
}

/**
 * Cookie API を隠す抽象化レイヤー
 */
export interface ServerSessionManager {
  get(event: RequestEvent): Promise<ServerAuthContext | null>;
  set(event: RequestEvent, context: ServerAuthContext): Promise<void>;
  clear(event: RequestEvent): void;
}

const DEFAULT_COOKIE_NAME = "authrim_session";
const DEFAULT_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
const ENCRYPTED_COOKIE_VALUE_VERSION = "v2";
const SIGNED_COOKIE_VALUE_VERSION = "v1";
const MIN_SECRET_BYTES = 32;
const AES_GCM_IV_BYTES = 12;

interface SignedSessionPayload {
  context: ServerAuthContext;
  iat: number;
  exp: number;
}

/**
 * ServerSessionManager ファクトリ
 */
export function createServerSessionManager(
  options?: ServerSessionManagerOptions,
): ServerSessionManager {
  const cookieName = options?.cookieName ?? DEFAULT_COOKIE_NAME;
  const sameSite = options?.sameSite ?? "lax";
  const secure = options?.secure ?? process.env.NODE_ENV === "production";
  const path = options?.path ?? "/";
  const maxAge = options?.maxAge ?? DEFAULT_MAX_AGE;
  const httpOnly = options?.httpOnly ?? true;
  const signingSecret = options?.sessionSecret;

  return {
    async get(event: RequestEvent): Promise<ServerAuthContext | null> {
      const cookie = event.cookies.get(cookieName);
      if (!cookie) {
        return null;
      }

      if (!signingSecret) {
        event.cookies.delete(cookieName, { path });
        return null;
      }

      try {
        const payload = await decodeSessionCookie(cookie, signingSecret);
        if (!payload || !isValidAuthContext(payload.context)) {
          event.cookies.delete(cookieName, { path });
          return null;
        }

        const now = Date.now();
        if (payload.exp <= now || isSessionExpired(payload.context.session, now)) {
          event.cookies.delete(cookieName, { path });
          return null;
        }

        return payload.context;
      } catch {
        event.cookies.delete(cookieName, { path });
        return null;
      }
    },

    async set(event: RequestEvent, context: ServerAuthContext): Promise<void> {
      if (!signingSecret) {
        throw new Error(
          "Authrim server sessions require ServerSessionManagerOptions.sessionSecret",
        );
      }
      if (!isValidAuthContext(context)) {
        throw new Error("Invalid Authrim server session context");
      }

      const now = Date.now();
      const value = await encryptSessionCookie(
        {
          context,
          iat: now,
          exp: now + maxAge * 1000,
        },
        signingSecret,
      );
      event.cookies.set(cookieName, value, {
        path,
        sameSite,
        secure,
        httpOnly,
        maxAge,
      });
    },

    clear(event: RequestEvent): void {
      event.cookies.delete(cookieName, { path });
    },
  };
}

async function encryptSessionCookie(
  payload: SignedSessionPayload,
  secret: string | Uint8Array | CryptoKey,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_BYTES));
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const key = await getAesGcmKey(secret);
  const ciphertext = await getSubtleCrypto().encrypt(
    { name: "AES-GCM", iv },
    key,
    payloadBytes,
  );
  return `${ENCRYPTED_COOKIE_VALUE_VERSION}.${base64UrlEncode(iv)}.${base64UrlEncode(
    new Uint8Array(ciphertext),
  )}`;
}

async function decodeSessionCookie(
  cookie: string,
  secret: string | Uint8Array | CryptoKey,
): Promise<SignedSessionPayload | null> {
  const parts = cookie.split(".");
  if (parts.length !== 3) {
    return null;
  }

  if (parts[0] === ENCRYPTED_COOKIE_VALUE_VERSION) {
    return decryptSessionCookie(parts[1], parts[2], secret);
  }
  if (parts[0] === SIGNED_COOKIE_VALUE_VERSION) {
    return verifySignedSessionCookie(parts[1], parts[2], secret);
  }

  return null;
}

async function decryptSessionCookie(
  encodedIv: string,
  encodedCiphertext: string,
  secret: string | Uint8Array | CryptoKey,
): Promise<SignedSessionPayload | null> {
  if (!encodedIv || !encodedCiphertext) {
    return null;
  }

  try {
    const iv = Uint8Array.from(base64UrlDecode(encodedIv));
    const ciphertext = Uint8Array.from(base64UrlDecode(encodedCiphertext));
    if (iv.byteLength !== AES_GCM_IV_BYTES) {
      return null;
    }

    const key = await getAesGcmKey(secret);
    const plaintext = await getSubtleCrypto().decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );
    return parseSignedSessionPayload(new TextDecoder().decode(plaintext));
  } catch {
    return null;
  }
}

async function verifySignedSessionCookie(
  encodedPayload: string,
  encodedSignature: string,
  secret: string | Uint8Array | CryptoKey,
): Promise<SignedSessionPayload | null> {
  if (!encodedPayload || !encodedSignature) {
    return null;
  }

  const actualSignature = await hmacSha256(encodedPayload, secret);
  const expectedSignature = base64UrlDecode(encodedSignature);
  if (!constantTimeEqual(actualSignature, expectedSignature)) {
    return null;
  }

  return parseSignedSessionPayload(
    new TextDecoder().decode(base64UrlDecode(encodedPayload)),
  );
}

function parseSignedSessionPayload(payloadText: string): SignedSessionPayload | null {
  const payload = JSON.parse(payloadText) as SignedSessionPayload;
  if (
    !payload ||
    typeof payload.iat !== "number" ||
    typeof payload.exp !== "number" ||
    !payload.context
  ) {
    return null;
  }

  return payload;
}

async function getAesGcmKey(secret: string | Uint8Array | CryptoKey): Promise<CryptoKey> {
  if (isCryptoKey(secret)) {
    if (secret.algorithm.name !== "AES-GCM") {
      throw new Error("Authrim sessionSecret CryptoKey must use AES-GCM");
    }
    return secret;
  }

  const rawSecret = normalizeSecret(secret);
  const derivedKey = await getSubtleCrypto().digest("SHA-256", rawSecret);
  return getSubtleCrypto().importKey(
    "raw",
    derivedKey,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

async function hmacSha256(
  message: string,
  secret: string | Uint8Array | CryptoKey,
): Promise<Uint8Array> {
  const key =
    isCryptoKey(secret)
      ? secret
      : await getSubtleCrypto().importKey(
          "raw",
          normalizeSecret(secret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"],
        );
  const signature = await getSubtleCrypto().sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return new Uint8Array(signature);
}

function isCryptoKey(secret: unknown): secret is CryptoKey {
  return typeof CryptoKey !== "undefined" && secret instanceof CryptoKey;
}

function getSubtleCrypto(): SubtleCrypto {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Authrim server sessions require Web Crypto support");
  }
  return globalThis.crypto.subtle;
}

function normalizeSecret(secret: string | Uint8Array): ArrayBuffer {
  const bytes =
    typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
  if (bytes.byteLength < MIN_SECRET_BYTES) {
    throw new Error("Authrim sessionSecret must be at least 32 bytes");
  }
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function base64UrlEncode(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  const base64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(bytes).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  if (typeof atob === "function") {
    return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  }
  return new Uint8Array(Buffer.from(padded, "base64"));
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.byteLength; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

function isValidAuthContext(value: unknown): value is ServerAuthContext {
  const context = value as ServerAuthContext | undefined;
  return Boolean(
    context &&
      context.session &&
      typeof context.session.id === "string" &&
      typeof context.session.userId === "string" &&
      typeof context.session.expiresAt === "string" &&
      context.user &&
      typeof context.user.id === "string",
  );
}

function isSessionExpired(session: Session, now: number): boolean {
  const expiresAt = new Date(session.expiresAt).getTime();
  return !Number.isFinite(expiresAt) || expiresAt <= now;
}
