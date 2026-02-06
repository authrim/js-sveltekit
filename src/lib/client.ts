/**
 * Authrim Svelte SDK Main Entry Point
 */

import type {
  PasskeyLoginOptions,
  PasskeySignUpOptions,
  PasskeyRegisterOptions,
  EmailCodeSendOptions,
  EmailCodeVerifyOptions,
  SocialLoginOptions,
  SocialProvider,
} from "@authrim/core";
import { createAuthrimClient } from "@authrim/core";

import type {
  AuthrimConfig,
  AuthrimClient,
  AuthEventName,
  AuthEventHandler,
  AuthEventPayloads,
  PasskeyNamespace,
  EmailCodeNamespace,
  SocialNamespace,
  SessionNamespace,
  OAuthNamespace,
  ConsentNamespace,
  DeviceFlowNamespace,
  CIBANamespace,
  LoginChallengeNamespace,
  SignOutOptions,
  AuthResponse,
  AuthSessionData,
  AuthStores,
} from "./types.js";

import {
  authResultToResponse,
  wrapWithAuthResponse,
  success,
  fetchClientConfig,
} from "./utils/index.js";

import { PasskeyAuthImpl } from "./direct-auth/passkey.js";
import { EmailCodeAuthImpl } from "./direct-auth/email-code.js";
import { SocialAuthImpl } from "./direct-auth/social.js";
import { SessionAuthImpl } from "./direct-auth/session.js";
import { ConsentApiImpl } from "./direct-auth/consent.js";
import { DeviceFlowApiImpl } from "./direct-auth/device-flow.js";
import { CIBAApiImpl } from "./direct-auth/ciba.js";
import { LoginChallengeApiImpl } from "./direct-auth/login-challenge.js";
import { createOAuthNamespace } from "./oauth/index.js";

import { BrowserHttpClient } from "./providers/http.js";
import { BrowserCryptoProvider } from "./providers/crypto.js";
import {
  createBrowserStorage,
  type BrowserStorageOptions,
} from "./providers/storage.js";

import {
  createAuthStores,
  toAuthError,
  type InternalAuthStores,
} from "./stores/auth.js";

/**
 * Event emitter for auth events
 */
class AuthEventEmitter {
  private handlers: Map<AuthEventName, Set<AuthEventHandler<AuthEventName>>> =
    new Map();

  on<E extends AuthEventName>(
    event: E,
    handler: AuthEventHandler<E>,
  ): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as AuthEventHandler<AuthEventName>);

    return () => {
      this.handlers
        .get(event)
        ?.delete(handler as AuthEventHandler<AuthEventName>);
    };
  }

  emit<E extends AuthEventName>(event: E, payload: AuthEventPayloads[E]): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      for (const handler of eventHandlers) {
        try {
          (handler as AuthEventHandler<E>)(payload);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      }
    }
  }
}

/**
 * Create Authrim client for Svelte
 *
 * @example
 * ```typescript
 * import { createAuthrim } from '@authrim/sveltekit';
 *
 * const auth = await createAuthrim({
 *   issuer: 'https://auth.example.com',
 *   clientId: 'your-client-id',
 * });
 *
 * // Passkey login
 * const { data, error } = await auth.passkey.login();
 *
 * // Reactive stores
 * const { session, user, isAuthenticated } = auth.stores;
 * ```
 */
export async function createAuthrim(
  config: AuthrimConfig,
): Promise<AuthrimClient> {
  // Initialize providers
  const http = new BrowserHttpClient();
  const crypto = new BrowserCryptoProvider();
  const storageOptions: BrowserStorageOptions = config.storage ?? {};
  const storage = createBrowserStorage(storageOptions);

  // Initialize event emitter
  const emitter = new AuthEventEmitter();

  // Initialize stores
  const internalStores: InternalAuthStores = createAuthStores();

  // ==========================================================================
  // OAuth (Optional)
  // ==========================================================================

  let oauth: OAuthNamespace | undefined;

  if (config.enableOAuth) {
    // Fetch public client configuration from server
    const clientConfig = await fetchClientConfig(config.issuer, config.clientId);

    if (clientConfig) {
      console.debug('[Authrim] Client configuration loaded:', {
        client_id: clientConfig.client_id,
        client_name: clientConfig.client_name,
        login_ui_url: clientConfig.login_ui_url,
      });
    }

    // Create core client for OAuth flows
    const coreClient = await createAuthrimClient({
      issuer: config.issuer,
      clientId: config.clientId,
      http,
      crypto,
      storage,
    });

    // Create OAuth namespace
    oauth = createOAuthNamespace(coreClient, {
      silentLoginRedirectUri: config.silentLoginRedirectUri,
    });
  }

  // Create session manager
  const sessionManager = new SessionAuthImpl({
    issuer: config.issuer,
    clientId: config.clientId,
    http,
  });

  // Token exchange callback
  const exchangeToken = async (
    authCode: string,
    codeVerifier: string,
    providerId?: string,
  ) => {
    return sessionManager.exchangeToken(authCode, codeVerifier, undefined, providerId);
  };

  // Create Direct Auth implementations
  const passkeyImpl = new PasskeyAuthImpl({
    issuer: config.issuer,
    clientId: config.clientId,
    http,
    crypto,
    exchangeToken,
  });

  const emailCodeImpl = new EmailCodeAuthImpl({
    issuer: config.issuer,
    clientId: config.clientId,
    http,
    crypto,
    exchangeToken,
  });

  const socialImpl = new SocialAuthImpl({
    issuer: config.issuer,
    clientId: config.clientId,
    crypto,
    storage,
    exchangeToken,
  });

  // ==========================================================================
  // Store updater helpers (イベント→Store の projection)
  // ==========================================================================

  function updateStoresOnLogin(
    session: AuthSessionData["session"],
    user: AuthSessionData["user"],
  ) {
    internalStores._session.set(session);
    internalStores._user.set(user);
    internalStores._loadingState.set("idle");
    internalStores._error.set(null);
  }

  function updateStoresOnLogout() {
    internalStores._session.set(null);
    internalStores._user.set(null);
    internalStores._loadingState.set("idle");
    internalStores._error.set(null);
  }

  function updateStoresOnError(error: AuthResponse<never>["error"]) {
    if (error) {
      internalStores._error.set(toAuthError(error));
    }
    internalStores._loadingState.set("idle");
  }

  function setLoadingState(
    state: "authenticating" | "refreshing" | "signing_out",
  ) {
    internalStores._loadingState.set(state);
  }

  // ==========================================================================
  // Event→Store projection
  // ==========================================================================

  emitter.on("auth:login", (payload) => {
    updateStoresOnLogin(payload.session, payload.user);
  });

  emitter.on("auth:logout", () => {
    updateStoresOnLogout();
  });

  emitter.on("auth:error", (payload) => {
    updateStoresOnError(payload.error);
  });

  emitter.on("session:changed", (payload) => {
    internalStores._session.set(payload.session);
    internalStores._user.set(payload.user);
  });

  // ==========================================================================
  // Passkey Namespace
  // ==========================================================================

  const passkey: PasskeyNamespace = {
    async login(options?: PasskeyLoginOptions) {
      setLoadingState("authenticating");
      const result = await passkeyImpl.login(options);
      const response = authResultToResponse(result);
      if (response.data) {
        emitter.emit("auth:login", {
          session: response.data.session,
          user: response.data.user,
          method: "passkey",
        });
      } else if (response.error) {
        emitter.emit("auth:error", { error: response.error });
      }
      return response;
    },

    async signUp(options: PasskeySignUpOptions) {
      setLoadingState("authenticating");
      const result = await passkeyImpl.signUp(options);
      const response = authResultToResponse(result);
      if (response.data) {
        emitter.emit("auth:login", {
          session: response.data.session,
          user: response.data.user,
          method: "passkey",
        });
      } else if (response.error) {
        emitter.emit("auth:error", { error: response.error });
      }
      return response;
    },

    async register(options?: PasskeyRegisterOptions) {
      return wrapWithAuthResponse(
        () => passkeyImpl.register(options),
        "AR003000",
      );
    },

    isSupported() {
      return passkeyImpl.isSupported();
    },

    isConditionalUIAvailable() {
      return passkeyImpl.isConditionalUIAvailable();
    },

    cancelConditionalUI() {
      passkeyImpl.cancelConditionalUI();
    },
  };

  // ==========================================================================
  // Email Code Namespace
  // ==========================================================================

  const emailCode: EmailCodeNamespace = {
    async send(email: string, options?: EmailCodeSendOptions) {
      return wrapWithAuthResponse(
        async () => emailCodeImpl.send(email, options),
        "AR002000",
      );
    },

    async verify(
      email: string,
      code: string,
      options?: EmailCodeVerifyOptions,
    ) {
      setLoadingState("authenticating");
      const result = await emailCodeImpl.verify(email, code, options);
      const response = authResultToResponse(result);
      if (response.data) {
        emitter.emit("auth:login", {
          session: response.data.session,
          user: response.data.user,
          method: "emailCode",
        });
      } else if (response.error) {
        emitter.emit("auth:error", { error: response.error });
      }
      return response;
    },

    hasPendingVerification(email: string) {
      return emailCodeImpl.hasPendingVerification(email);
    },

    getRemainingTime(email: string) {
      return emailCodeImpl.getRemainingTime(email);
    },

    clearPendingVerification(email: string) {
      emailCodeImpl.clearPendingVerification(email);
    },
  };

  // ==========================================================================
  // Social Namespace
  // ==========================================================================

  const social: SocialNamespace = {
    async loginWithPopup(
      provider: SocialProvider,
      options?: SocialLoginOptions,
    ) {
      setLoadingState("authenticating");
      const result = await socialImpl.loginWithPopup(provider, options);
      const response = authResultToResponse(result);
      if (response.data) {
        emitter.emit("auth:login", {
          session: response.data.session,
          user: response.data.user,
          method: "social",
        });
      } else if (response.error) {
        emitter.emit("auth:error", { error: response.error });
      }
      return response;
    },

    async loginWithRedirect(
      provider: SocialProvider,
      options?: SocialLoginOptions,
    ) {
      setLoadingState("authenticating");
      await socialImpl.loginWithRedirect(provider, options);
    },

    async handleCallback() {
      setLoadingState("authenticating");
      const result = await socialImpl.handleCallback();
      const response = authResultToResponse(result);
      if (response.data) {
        emitter.emit("auth:login", {
          session: response.data.session,
          user: response.data.user,
          method: "social",
        });
      } else if (response.error) {
        emitter.emit("auth:error", { error: response.error });
      }
      return response;
    },

    hasCallbackParams() {
      return socialImpl.hasCallbackParams();
    },

    getSupportedProviders() {
      return socialImpl.getSupportedProviders();
    },
  };

  // ==========================================================================
  // Session Namespace
  // ==========================================================================

  const session: SessionNamespace = {
    async get(): Promise<AuthResponse<AuthSessionData | null>> {
      const sessionData = await sessionManager.get();
      if (!sessionData) {
        return success(null);
      }

      const user = await sessionManager.getUser();
      if (!user) {
        return success(null);
      }

      // Update stores with fetched session
      internalStores._session.set(sessionData);
      internalStores._user.set(user);

      return success({
        session: sessionData,
        user,
      });
    },

    validate() {
      return sessionManager.validate();
    },

    getUser() {
      return sessionManager.getUser();
    },

    async refresh() {
      setLoadingState("refreshing");
      const result = await sessionManager.refresh();
      internalStores._loadingState.set("idle");
      return result;
    },

    isAuthenticated() {
      return sessionManager.isAuthenticated();
    },

    clearCache() {
      sessionManager.clearCache();
    },
  };

  // ==========================================================================
  // Flow API Implementations (Consent, Device Flow, CIBA, Login Challenge)
  // ==========================================================================

  const consentImpl = new ConsentApiImpl({ issuer: config.issuer, http });
  const deviceFlowImpl = new DeviceFlowApiImpl({ issuer: config.issuer, http });
  const cibaImpl = new CIBAApiImpl({ issuer: config.issuer, http });
  const loginChallengeImpl = new LoginChallengeApiImpl({
    issuer: config.issuer,
    http,
  });

  const consent: ConsentNamespace = {
    getData: (challengeId) => consentImpl.getData(challengeId),
    submit: (challengeId, options) => consentImpl.submit(challengeId, options),
  };

  const deviceFlow: DeviceFlowNamespace = {
    submit: (userCode, approve) => deviceFlowImpl.submit(userCode, approve),
  };

  const ciba: CIBANamespace = {
    getData: (loginHint) => cibaImpl.getData(loginHint),
    approve: (authReqId, userId, sub) =>
      cibaImpl.approve(authReqId, userId, sub),
    reject: (authReqId, reason) => cibaImpl.reject(authReqId, reason),
  };

  const loginChallenge: LoginChallengeNamespace = {
    getData: (challengeId) => loginChallengeImpl.getData(challengeId),
  };

  // ==========================================================================
  // Sign Out
  // ==========================================================================

  async function signOut(options?: SignOutOptions): Promise<void> {
    setLoadingState("signing_out");
    await sessionManager.logout(options);
    emitter.emit("auth:logout", { redirectUri: options?.redirectUri });
  }

  // ==========================================================================
  // Event System
  // ==========================================================================

  function on<E extends AuthEventName>(
    event: E,
    handler: AuthEventHandler<E>,
  ): () => void {
    return emitter.on(event, handler);
  }

  // ==========================================================================
  // Stores
  // ==========================================================================

  const stores: AuthStores = internalStores.public;

  // ==========================================================================
  // SSR Sync (internal API for AuthProvider)
  // ==========================================================================

  /**
   * Sync session and user from SSR data directly to stores.
   * This is used by AuthProvider to avoid hydration mismatch.
   * @internal
   */
  function _syncFromSSR(
    session: import("@authrim/core").Session | null,
    user: import("@authrim/core").User | null,
  ): void {
    internalStores._session.set(session);
    internalStores._user.set(user);
  }

  // ==========================================================================
  // Destroy (cleanup resources)
  // ==========================================================================

  /**
   * Cleanup resources (event listeners, timers, etc.)
   * IMPORTANT: If not using AuthProvider, you must call this method
   * manually when the auth client is no longer needed.
   */
  function destroy(): void {
    // Cleanup social auth (message event listener)
    socialImpl.destroy();

    // Cleanup email code auth (cleanup timer)
    emailCodeImpl.destroy();
  }

  // ==========================================================================
  // Return client
  // ==========================================================================

  return {
    passkey,
    emailCode,
    social,
    session,
    oauth,
    consent,
    deviceFlow,
    ciba,
    loginChallenge,
    signIn: {
      passkey: (options?: PasskeyLoginOptions) => passkey.login(options),
      social: (provider: SocialProvider, options?: SocialLoginOptions) =>
        social.loginWithPopup(provider, options),
    },
    signUp: {
      passkey: (options: PasskeySignUpOptions) => passkey.signUp(options),
    },
    signOut,
    on,
    stores,
    _syncFromSSR,
    destroy,
  };
}
