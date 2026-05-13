/**
 * @authrim/sveltekit - SvelteKit SDK for Authrim
 */

// Main client
export { createAuthrim } from "./client.js";

// Context utilities
export {
  setAuthContext,
  getAuthContext,
  hasAuthContext,
  AUTH_CONTEXT_KEY,
} from "./utils/context.js";

// Types
export type {
  // Config
  AuthrimConfig,
  StorageOptions,
  StorageType,
  SvelteKitAuthMode,
  AuthrimWebSdkProfile,
  ServerMediatedSessionOptions,
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
  ConsentNamespace,
  DeviceFlowNamespace,
  CIBANamespace,
  LoginChallengeNamespace,
  StepUpNamespace,
  CustomerProfilesNamespace,
  DevicesNamespace,
  BrowserListDevicesOptions,
  BrowserRenameDeviceOptions,
  BrowserUnlinkDeviceOptions,
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
  DirectAuthLogoutScope,
  DirectAuthLogoutOptions,
  NextAction,
  StepUpAcceptableMethods,
  StepUpActionResponse,
  StepUpCompleteRequest,
  StepUpFailureBody,
  StepUpIdempotentRequestOptions,
  StepUpNextAction,
  StepUpRequestOptions,
  StepUpRequirement,
  StepUpResendResponse,
  StepUpStartRequest,
  CustomerProfileDelegatedWriteOptions,
  CustomerProfileDelegatedWriteResponse,
  CustomerProfileElevationReadOptions,
  CustomerProfileElevationReadResponse,
  CustomerProfileUpdateInput,
  CustomerProfileView,
  DeviceInventoryItem,
  DeviceUnlinkResult,
  ListDevicesResponse,
  RenameDeviceResponse,
  UnlinkDeviceResponse,
  AuthLoadingState,
} from "./types.js";

// Stores
export {
  createAuthStores,
  toAuthError as toStoreAuthError,
} from "./stores/auth.js";
export type {
  AuthError as StoreAuthError,
  InternalAuthStores,
} from "./stores/auth.js";

// Providers (for advanced use)
export {
  BrowserHttpClient,
  type BrowserHttpClientOptions,
} from "./providers/http.js";
export { BrowserCryptoProvider } from "./providers/crypto.js";
export {
  createBrowserStorage,
  type BrowserStorageOptions,
} from "./providers/storage.js";

export {
  TenantDiscoveryClient,
  buildDiscoveryRequest,
  type DiscoveredTenant,
  type TenantDiscoveryClientOptions,
  type TenantDiscoveryInput,
  type TenantDiscoveryMode,
  type TenantDiscoveryResult,
} from "./tenant-discovery.js";

// Flow API types (re-export for convenience)
export type {
  ConsentScreenData,
  ConsentClientInfo,
  ConsentScopeInfo,
  ConsentUserInfo,
  ConsentOrgInfo,
  ConsentActingAsInfo,
  ConsentFeatureFlags,
  ConsentSubmitOptions,
  ConsentSubmitResult,
} from "./direct-auth/consent.js";
export type { DeviceFlowSubmitResult } from "./direct-auth/device-flow.js";
export { DeviceFlowVerificationError } from "./direct-auth/device-flow.js";
export type {
  CIBAPendingRequest,
  CIBAActionResult,
} from "./direct-auth/ciba.js";
export type {
  LoginChallengeData,
  LoginChallengeClientInfo,
} from "./direct-auth/login-challenge.js";
