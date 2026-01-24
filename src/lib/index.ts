/**
 * @authrim/sveltekit - SvelteKit SDK for Authrim
 */

// Main client
export { createAuthrim } from './client.js';

// Context utilities
export { setAuthContext, getAuthContext, hasAuthContext, AUTH_CONTEXT_KEY } from './utils/context.js';

// Types
export type {
  // Config
  AuthrimConfig,
  StorageOptions,
  StorageType,
  // Client
  AuthrimClient,
  // Response
  AuthResponse,
  AuthError,
  AuthSessionData,
  // Namespaces
  PasskeyNamespace,
  EmailCodeNamespace,
  SocialNamespace,
  SessionNamespace,
  SignInShortcuts,
  SignUpShortcuts,
  SignOutOptions,
  // Events
  AuthEventName,
  AuthEventPayloads,
  AuthEventHandler,
  // Stores
  AuthStores,
  // Re-exports from core
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
  AuthLoadingState,
} from './types.js';

// Stores
export { createAuthStores, toAuthError as toStoreAuthError } from './stores/auth.js';
export type { AuthError as StoreAuthError, InternalAuthStores } from './stores/auth.js';

// Providers (for advanced use)
export { BrowserHttpClient, type BrowserHttpClientOptions } from './providers/http.js';
export { BrowserCryptoProvider } from './providers/crypto.js';
export { createBrowserStorage, type BrowserStorageOptions } from './providers/storage.js';
