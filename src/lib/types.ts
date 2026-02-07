/**
 * Authrim Svelte SDK Type Definitions
 */

import type { Readable } from "svelte/store";
import type {
  Session,
  User,
  SocialProvider,
  PasskeyLoginOptions,
  PasskeySignUpOptions,
  PasskeyRegisterOptions,
  PasskeyCredential,
  EmailCodeSendOptions,
  EmailCodeSendResult,
  EmailCodeVerifyOptions,
  SocialLoginOptions,
  DirectAuthLogoutOptions,
  NextAction,
} from "@authrim/core";
import type {
  AuthLoadingState,
  AuthError as StoreAuthError,
} from "./stores/auth.js";

// =============================================================================
// Configuration Types
// =============================================================================

export type StorageType = "memory" | "sessionStorage" | "localStorage";

export interface StorageOptions {
  prefix?: string;
  storage?: StorageType;
}

export interface AuthrimConfig {
  issuer: string;
  clientId: string;
  storage?: StorageOptions;
  /**
   * Enable OAuth 2.0 / OpenID Connect flows
   * Default: false
   */
  enableOAuth?: boolean;
  /**
   * Silent login redirect URI (for OAuth callback)
   * Default: {origin}/callback.html
   */
  silentLoginRedirectUri?: string;
}

// =============================================================================
// Response Types (Discriminated Union)
// =============================================================================

export interface AuthError {
  code: string;
  error: string;
  message: string;
  retryable: boolean;
  severity: "info" | "warn" | "error" | "critical";
  cause?: unknown;
}

export type AuthResponse<T> =
  | { data: T; error: null }
  | { data: null; error: AuthError };

export interface AuthSessionData {
  session: Session;
  user: User;
  nextAction?: NextAction;
  /** Validated redirect path from social login state (relative path only) */
  redirectTo?: string;
}

// =============================================================================
// Event Types
// =============================================================================

export type AuthEventName =
  | "session:changed"
  | "session:expired"
  | "auth:login"
  | "auth:logout"
  | "auth:error"
  | "token:refreshed";

export interface AuthEventPayloads {
  "session:changed": { session: Session | null; user: User | null };
  "session:expired": { reason: "timeout" | "revoked" | "logout" };
  "auth:login": {
    session: Session;
    user: User;
    method: "passkey" | "emailCode" | "social";
  };
  "auth:logout": { redirectUri?: string };
  "auth:error": { error: AuthError };
  "token:refreshed": { session: Session };
}

export type AuthEventHandler<E extends AuthEventName> = (
  payload: AuthEventPayloads[E],
) => void;

// =============================================================================
// Namespace Types
// =============================================================================

export interface PasskeyNamespace {
  login(options?: PasskeyLoginOptions): Promise<AuthResponse<AuthSessionData>>;
  signUp(options: PasskeySignUpOptions): Promise<AuthResponse<AuthSessionData>>;
  register(
    options?: PasskeyRegisterOptions,
  ): Promise<AuthResponse<PasskeyCredential>>;
  isSupported(): boolean;
  isConditionalUIAvailable(): Promise<boolean>;
  cancelConditionalUI(): void;
}

export interface EmailCodeNamespace {
  send(
    email: string,
    options?: EmailCodeSendOptions,
  ): Promise<AuthResponse<EmailCodeSendResult>>;
  verify(
    email: string,
    code: string,
    options?: EmailCodeVerifyOptions,
  ): Promise<AuthResponse<AuthSessionData>>;
  hasPendingVerification(email: string): boolean;
  getRemainingTime(email: string): number;
  clearPendingVerification(email: string): void;
}

export interface SocialNamespace {
  loginWithPopup(
    provider: SocialProvider,
    options?: SocialLoginOptions,
  ): Promise<AuthResponse<AuthSessionData>>;
  loginWithRedirect(
    provider: SocialProvider,
    options?: SocialLoginOptions,
  ): Promise<void>;
  handleCallback(): Promise<AuthResponse<AuthSessionData>>;
  hasCallbackParams(): boolean;
  getSupportedProviders(): SocialProvider[];
}

export interface SessionNamespace {
  get(): Promise<AuthResponse<AuthSessionData | null>>;
  validate(): Promise<boolean>;
  getUser(): Promise<User | null>;
  refresh(): Promise<Session | null>;
  isAuthenticated(): Promise<boolean>;
  clearCache(): void;
}

export interface SignOutOptions extends DirectAuthLogoutOptions {}

// =============================================================================
// Flow Namespace Types (Consent, Device Flow, CIBA, Login Challenge)
// =============================================================================

export interface ConsentNamespace {
  getData(
    challengeId: string,
  ): Promise<import("./direct-auth/consent.js").ConsentScreenData>;
  submit(
    challengeId: string,
    options: import("./direct-auth/consent.js").ConsentSubmitOptions,
  ): Promise<import("./direct-auth/consent.js").ConsentSubmitResult>;
}

export interface DeviceFlowNamespace {
  submit(
    userCode: string,
    approve?: boolean,
  ): Promise<import("./direct-auth/device-flow.js").DeviceFlowSubmitResult>;
}

export interface CIBANamespace {
  getData(
    loginHint: string,
  ): Promise<import("./direct-auth/ciba.js").CIBAPendingRequest[]>;
  approve(
    authReqId: string,
    userId: string,
    sub: string,
  ): Promise<import("./direct-auth/ciba.js").CIBAActionResult>;
  reject(
    authReqId: string,
    reason?: string,
  ): Promise<import("./direct-auth/ciba.js").CIBAActionResult>;
}

export interface LoginChallengeNamespace {
  getData(
    challengeId: string,
  ): Promise<import("./direct-auth/login-challenge.js").LoginChallengeData>;
}

// =============================================================================
// OAuth Namespace Types
// =============================================================================

/**
 * Try silent login options
 */
export interface TrySilentLoginOptions {
  /**
   * What to do if IdP has no session (login_required)
   * - 'return': Return to returnTo URL with sso_error=login_required
   * - 'login': Redirect to login screen, then return after login
   * Default: 'return'
   */
  onLoginRequired?: "return" | "login";
  /**
   * URL to return after silent login completes
   * Default: current page URL
   * Security: Must be same origin
   */
  returnTo?: string;
  /**
   * OAuth scopes to request
   * Default: SDK default scopes
   */
  scope?: string;
}

/**
 * Silent login result
 */
export type SilentLoginResult =
  | { status: "success" }
  | { status: "login_required" }
  | { status: "error"; error: string; errorDescription?: string };

export interface OAuthNamespace {
  /**
   * Try silent SSO via top-level navigation (prompt=none)
   *
   * Safari ITP / Chrome Third-Party Cookie Phaseout compatible.
   * This function redirects to IdP and does not return.
   */
  trySilentLogin(options?: TrySilentLoginOptions): Promise<never>;

  /**
   * Handle silent login callback
   *
   * Call this in your callback page. Handles both silent login
   * results and regular OAuth callbacks.
   */
  handleSilentCallback(): Promise<SilentLoginResult>;

  /**
   * Handle regular OAuth callback (for authorization code flow)
   */
  handleCallback(
    callbackUrl?: string,
  ): Promise<import("@authrim/core").TokenSet>;
}

// =============================================================================
// Shortcut Types
// =============================================================================

export interface SignInShortcuts {
  passkey(
    options?: PasskeyLoginOptions,
  ): Promise<AuthResponse<AuthSessionData>>;
  social(
    provider: SocialProvider,
    options?: SocialLoginOptions,
  ): Promise<AuthResponse<AuthSessionData>>;
}

export interface SignUpShortcuts {
  passkey(
    options: PasskeySignUpOptions,
  ): Promise<AuthResponse<AuthSessionData>>;
}

// =============================================================================
// Svelte Store Types
// =============================================================================

export interface AuthStores {
  session: Readable<Session | null>;
  user: Readable<User | null>;
  isAuthenticated: Readable<boolean>;
  loadingState: Readable<AuthLoadingState>;
  error: Readable<StoreAuthError | null>;
}

// =============================================================================
// Main Authrim Interface
// =============================================================================

export interface AuthrimClient {
  passkey: PasskeyNamespace;
  emailCode: EmailCodeNamespace;
  social: SocialNamespace;
  session: SessionNamespace;

  /** OAuth 2.0 / OpenID Connect API (optional, enabled via config.enableOAuth) */
  oauth?: OAuthNamespace;

  /** Consent flow API */
  consent: ConsentNamespace;
  /** Device flow API (RFC 8628) */
  deviceFlow: DeviceFlowNamespace;
  /** CIBA (Client Initiated Backchannel Authentication) API */
  ciba: CIBANamespace;
  /** Login challenge API */
  loginChallenge: LoginChallengeNamespace;

  signIn: SignInShortcuts;
  signUp: SignUpShortcuts;

  signOut(options?: SignOutOptions): Promise<void>;

  on<E extends AuthEventName>(
    event: E,
    handler: AuthEventHandler<E>,
  ): () => void;

  /** Svelte stores for reactive state */
  stores: AuthStores;

  /**
   * Sync session and user from SSR data directly to stores.
   * This avoids hydration mismatch by not making an async request.
   * Should only be called during initial hydration.
   *
   * @internal Used by AuthProvider for SSR sync
   */
  _syncFromSSR(session: Session | null, user: User | null): void;

  /**
   * Cleanup resources (event listeners, timers, etc.)
   * Should be called when the auth client is no longer needed.
   *
   * IMPORTANT: If not using AuthProvider, you must call this method
   * manually when the auth client is no longer needed to prevent
   * memory leaks from event listeners and timers.
   */
  destroy(): void;
}

// =============================================================================
// Re-export types from core
// =============================================================================

export type {
  Session,
  User,
  SocialProvider,
  PasskeyLoginOptions,
  PasskeySignUpOptions,
  PasskeyRegisterOptions,
  PasskeyCredential,
  EmailCodeSendOptions,
  EmailCodeSendResult,
  EmailCodeVerifyOptions,
  SocialLoginOptions,
  DirectAuthLogoutOptions,
  NextAction,
} from "@authrim/core";

export type { AuthLoadingState } from "./stores/auth.js";
