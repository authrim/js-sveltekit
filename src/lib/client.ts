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
  Session,
  User,
} from "@authrim/core";
import {
  AuthrimError,
  CustomerProfileClient,
  DPoPManager,
  DeviceInventoryClient,
  StepUpClient,
  createAuthrimClient,
} from "@authrim/core";

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
  StepUpNamespace,
  CustomerProfilesNamespace,
  DevicesNamespace,
  SignOutOptions,
  AuthResponse,
  AuthSessionData,
	  AuthStores,
	  SvelteKitAuthMode,
	  AuthrimFetchOptions,
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
  assertValidSvelteKitAuthConfig(config);
  const authMode = resolveAuthMode(config);
  const serverSession = resolveServerSession(config);

  // Initialize providers
  const http = new BrowserHttpClient();
  const crypto = new BrowserCryptoProvider({
    issuer: config.issuer,
    clientId: config.clientId,
    tenantId: config.tenantId,
  });
  const dpopManager = new DPoPManager(crypto, { algorithm: "ES256" });
  const useDPoPTokenRequests = shouldUseDPoPTokenRequests(config);
  const storageOptions: BrowserStorageOptions = config.storage ?? {};
  const storage = createBrowserStorage(storageOptions);

  // Initialize event emitter
  const emitter = new AuthEventEmitter();

  // Initialize stores
  const internalStores: InternalAuthStores = createAuthStores();

  const stepUpClient = new StepUpClient({
    issuer: config.issuer,
    http,
  });
  const customerProfileClient = new CustomerProfileClient({
    issuer: config.issuer,
    http,
  });
  const deviceInventoryClient = new DeviceInventoryClient({
    issuer: config.issuer,
    http,
  });
  const stepUp: StepUpNamespace = {
    start: (request, options) => stepUpClient.start(request, options),
    getAction: (actionId, options) => stepUpClient.getAction(actionId, options),
    complete: (actionId, request, options) => stepUpClient.complete(actionId, request, options),
    resend: (actionId, options) => stepUpClient.resend(actionId, options),
    cancel: (actionId, options) => stepUpClient.cancel(actionId, options),
  };
  const customerProfiles: CustomerProfilesNamespace = {
    getWithElevationGrant: (subjectUserId, options) =>
      customerProfileClient.getWithElevationGrant(subjectUserId, options),
    updateDelegated: (subjectUserId, input, options) =>
      customerProfileClient.updateDelegated(subjectUserId, input, options),
  };
  // ==========================================================================
  // OAuth (Optional)
  // ==========================================================================

  let oauth: OAuthNamespace | undefined;

  if (config.enableOAuth) {
    // Fetch public client configuration from server
    const clientConfig = await fetchClientConfig(
      config.issuer,
      config.clientId,
    );

    if (clientConfig) {
      console.debug("[Authrim] Client configuration loaded:", {
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
      dpop: {
        tokenRequests: useDPoPTokenRequests,
        algorithm: "ES256",
      },
    });

    // Create OAuth namespace
    oauth = createOAuthNamespace(coreClient, {
      silentLoginRedirectUri: config.silentLoginRedirectUri,
      preflightBrowserTokenPath: () =>
        ensureBrowserDPoPPreflight(
          crypto,
          resolveBrowserPublicClientMode(config),
          useDPoPTokenRequests,
        ),
      browserTokenPathEnabled: authMode === "browser",
    });
  }

  // Create session manager
  const sessionManager = new SessionAuthImpl({
    issuer: config.issuer,
    clientId: config.clientId,
    http,
    mode: authMode,
    serverSession,
    tokenRequestDPoP: useDPoPTokenRequests
      ? {
          required: true,
          async generateProof(nonce?: string) {
            await dpopManager.initialize();
            return dpopManager.generateProof(
              "POST",
              `${config.issuer.replace(/\/$/, "")}/token`,
              { nonce },
            );
          },
          handleNonce(nonce: string) {
            dpopManager.handleNonceResponse(nonce);
          },
        }
      : undefined,
  });
  const devices: DevicesNamespace = {
    list: (options) =>
      deviceInventoryClient.list({
        ...(options ?? {}),
        accessToken: resolveDeviceInventoryAccessToken(sessionManager, options?.accessToken),
      }),
    rename: (deviceId, displayName, options) =>
      deviceInventoryClient.rename(deviceId, displayName, {
        ...(options ?? {}),
        accessToken: resolveDeviceInventoryAccessToken(sessionManager, options?.accessToken),
      }),
    async unlink(deviceId, options) {
      const result = await deviceInventoryClient.unlink(deviceId, {
        ...(options ?? {}),
        accessToken: resolveDeviceInventoryAccessToken(sessionManager, options?.accessToken),
      });
      if (result.device_unlink_result.signed_out_required) {
        await crypto.clearDPoPKeyPair();
      }
      return result;
    },
  };

  // Token exchange callback
  const exchangeToken = async (
    authCode: string,
    codeVerifier: string,
    providerId?: string,
  ) => {
    return sessionManager.exchangeToken(
      authCode,
      codeVerifier,
      config.browserRefreshTokenPolicy === "dpop_bound",
      providerId,
    );
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
    session: Session,
    user: User,
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
      if (response.data?.session && response.data?.user) {
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
      if (response.data?.session && response.data?.user) {
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
      if (response.data?.session && response.data?.user) {
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
      if (response.data?.session && response.data?.user) {
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
      if (response.data?.session && response.data?.user) {
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
    await crypto.clearDPoPKeyPair();
    emitter.emit("auth:logout", { redirectUri: options?.redirectUri });
  }

  async function authFetch(
    input: RequestInfo | URL,
    init: AuthrimFetchOptions = {},
  ): Promise<Response> {
    const requestProfile = init.profile ?? (authMode === "browser" ? "token" : "cookie");
    const { profile: _profile, accessToken, csrfToken, ...requestInit } = init;

    if (requestProfile === "cookie") {
      return globalThis.fetch(input, {
        ...requestInit,
        headers: withCookieProfileCsrfHeaders(
          requestInit.headers,
          requestInit.method,
          config.csrf,
          csrfToken,
        ),
        credentials: requestInit.credentials ?? serverSession.credentials,
      });
    }

    const token = accessToken ?? sessionManager.getToken();
    if (!token) {
      throw new AuthrimError(
        "no_tokens",
        "authrim.fetch() with profile='token' requires an authenticated session or explicit accessToken",
      );
    }

    const response = await fetchWithDPoP(input, requestInit, token, dpopManager);
    const method = requestInit.method ?? (input instanceof Request ? input.method : "GET");
    if (
      response.status !== 401 ||
      accessToken ||
      !isReplayAllowed(method, requestInit.headers, input)
    ) {
      return response;
    }

    const refreshedAccessToken = await sessionManager.refreshAccessToken();
    if (!refreshedAccessToken) {
      return response;
    }

    return fetchWithDPoP(input, requestInit, refreshedAccessToken, dpopManager);
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

  function _shouldFetchSessionOnMount(): boolean {
    return authMode === "browser" || config.serverSession?.checkOnMount === true;
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
    stepUp,
    customerProfiles,
    devices,
    signIn: {
      passkey: (options?: PasskeyLoginOptions) => passkey.login(options),
      social: (provider: SocialProvider, options?: SocialLoginOptions) =>
        social.loginWithPopup(provider, options),
    },
	    signUp: {
	      passkey: (options: PasskeySignUpOptions) => passkey.signUp(options),
	    },
	    signOut,
	    fetch: authFetch,
	    on,
    stores,
    _syncFromSSR,
    _shouldFetchSessionOnMount,
    destroy,
  };
}

function resolveDeviceInventoryAccessToken(
  sessionManager: SessionAuthImpl,
  explicitAccessToken?: string,
): string {
  const token = explicitAccessToken ?? sessionManager.getToken();
  if (!token) {
    throw new AuthrimError(
      "invalid_request",
      "Device inventory requests require an authenticated session or explicit accessToken",
    );
  }
  return token;
}

async function fetchWithDPoP(
  input: RequestInfo | URL,
  init: RequestInit,
  accessToken: string,
  dpopManager: DPoPManager,
): Promise<Response> {
  await dpopManager.initialize();
  const method = init.method ?? (input instanceof Request ? input.method : "GET");

  const send = async (nonce?: string) => {
    const uri = toAbsoluteRequestUrl(input);
    const accessTokenHash = await dpopManager.calculateAccessTokenHash(accessToken);
    const proof = await dpopManager.generateProof(method, uri, {
      accessTokenHash,
      nonce,
    });
    const headers = new Headers(
      init.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    headers.set("Authorization", `DPoP ${accessToken}`);
    headers.set("DPoP", proof);

    return globalThis.fetch(input, {
      ...init,
      method,
      headers,
    });
  };

  const response = await send();
  const nonce = getDPoPNonce(response);
  if (response.status === 401 && nonce && isReplayAllowed(method, init.headers, input)) {
    dpopManager.handleNonceResponse(nonce);
    const retryResponse = await send(nonce);
    await throwIfDPoPBindingError(retryResponse);
    return retryResponse;
  }
  await throwIfDPoPBindingError(response);
  return response;
}

async function throwIfDPoPBindingError(response: Response): Promise<void> {
  if (response.status < 400) {
    return;
  }

  const error = await readOAuthErrorResponse(response);
  if (!error || !isDPoPBindingError(error.error)) {
    return;
  }

  throw new AuthrimError(error.error, error.error_description ?? error.error, {
    errorUri: error.error_uri,
    details: {
      originalError: error.error,
    },
  });
}

async function readOAuthErrorResponse(response: Response): Promise<{
  error: string;
  error_description?: string;
  error_uri?: string;
} | null> {
  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  try {
    const payload = (await response.clone().json()) as {
      error?: unknown;
      error_description?: unknown;
      error_uri?: unknown;
    };
    if (typeof payload.error !== "string") {
      return null;
    }
    return {
      error: payload.error,
      error_description:
        typeof payload.error_description === "string" ? payload.error_description : undefined,
      error_uri: typeof payload.error_uri === "string" ? payload.error_uri : undefined,
    };
  } catch {
    return null;
  }
}

function isDPoPBindingError(error: string): error is
  | "dpop_nonce_required"
  | "dpop_replay_rejected"
  | "token_binding_failed" {
  return (
    error === "dpop_nonce_required" ||
    error === "dpop_replay_rejected" ||
    error === "token_binding_failed"
  );
}

function isReplayAllowed(
  method: string,
  headers: HeadersInit | undefined,
  input: RequestInfo | URL,
): boolean {
  const normalizedMethod = method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(normalizedMethod)) {
    return true;
  }

  const replayHeaders = new Headers(
    headers ?? (input instanceof Request ? input.headers : undefined),
  );
  return replayHeaders.has("Idempotency-Key");
}

function getDPoPNonce(response: Response): string | null {
  const nonce = response.headers.get("DPoP-Nonce");
  if (nonce) {
    return nonce;
  }

  const challenge = response.headers.get("WWW-Authenticate");
  if (!challenge?.includes("use_dpop_nonce")) {
    return null;
  }
  const match = /dpop_nonce="([^"]+)"/i.exec(challenge);
  return match?.[1] ?? null;
}

function toAbsoluteRequestUrl(input: RequestInfo | URL): string {
  const value =
    typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  try {
    return new URL(value, globalThis.location?.href).toString();
  } catch {
    return value;
  }
}

function isStateChangingMethod(method?: string): boolean {
  const normalized = (method ?? "GET").toUpperCase();
  return !["GET", "HEAD", "OPTIONS", "TRACE"].includes(normalized);
}

function readCookieValue(name: string): string | null {
  if (typeof document === "undefined" || typeof document.cookie !== "string") {
    return null;
  }

  const prefix = `${encodeURIComponent(name)}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }

  return null;
}

function withCookieProfileCsrfHeaders(
  headers: HeadersInit | undefined,
  method: string | undefined,
  csrfConfig: AuthrimConfig["csrf"] | undefined,
  csrfToken: string | false | undefined,
): HeadersInit | undefined {
  if (!isStateChangingMethod(method) || csrfToken === false) {
    return headers;
  }

  const token = csrfToken ?? readCookieValue(csrfConfig?.cookieName ?? "authrim_csrf");
  if (!token) {
    return headers;
  }

  const nextHeaders = new Headers(headers);
  nextHeaders.set(csrfConfig?.headerName ?? "X-Authrim-CSRF", token);
  return nextHeaders;
}

type BrowserPublicClientMode = NonNullable<AuthrimConfig["browserPublicClientMode"]>;

function resolveAuthMode(config: AuthrimConfig): SvelteKitAuthMode {
  if (config.profile === "cookie" || config.profile === "auto") {
    return "server";
  }
  if (config.profile === "token") {
    return "browser";
  }
  return config.authMode ?? "server";
}

function resolveServerSession(
  config: AuthrimConfig,
): NonNullable<ConstructorParameters<typeof SessionAuthImpl>[0]["serverSession"]> {
  const serverSession = config.serverSession ?? {};
  return {
    exchangeEndpoint:
      serverSession.exchangeEndpoint ?? "/authrim/session/exchange",
    sessionEndpoint: serverSession.sessionEndpoint ?? "/authrim/session",
    logoutEndpoint:
      serverSession.logoutEndpoint ?? "/authrim/session/logout",
    credentials: serverSession.credentials ?? "same-origin",
  };
}

function assertValidSvelteKitAuthConfig(config: AuthrimConfig): void {
  if (
    resolveAuthMode(config) === "server" &&
    config.browserRefreshTokenPolicy === "dpop_bound"
  ) {
    throw new AuthrimError(
      "invalid_request",
      "browserRefreshTokenPolicy='dpop_bound' requires authMode='browser' in @authrim/sveltekit.",
    );
  }
}

function resolveBrowserPublicClientMode(config: AuthrimConfig): BrowserPublicClientMode {
  return config.browserPublicClientMode ?? (resolveAuthMode(config) === "server" ? "cookie_fallback" : "strict");
}

function shouldUseDPoPTokenRequests(config: AuthrimConfig): boolean {
  if (resolveAuthMode(config) === "server") {
    return false;
  }
  const mode = resolveBrowserPublicClientMode(config);
  return mode === "strict" || config.browserRefreshTokenPolicy === "dpop_bound";
}

async function ensureBrowserDPoPPreflight(
  crypto: BrowserCryptoProvider,
  mode: BrowserPublicClientMode,
  dpopTokenRequests: boolean,
): Promise<void> {
  if (!dpopTokenRequests) {
    return;
  }

  const result = await crypto.preflightDPoPKeyPersistence("ES256");
  if (result.ok) {
    return;
  }

  const suffix = result.message ? `: ${result.message}` : "";
  const reason = result.reason ?? "unknown";
  if (mode === "cookie_fallback") {
    throw new Error(
      `Browser DPoP preflight failed (${reason})${suffix}; use the hosted cookie-only finalize path for this client.`,
    );
  }
  throw new Error(`Browser DPoP preflight failed (${reason})${suffix}`);
}
