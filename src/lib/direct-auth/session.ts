/**
 * Session Management for Direct Auth
 */

import {
  AuthrimError,
  type SessionAuth,
  type Session,
  type DirectAuthLogoutOptions,
  type User,
} from "@authrim/core";
import type { BrowserHttpClient } from "../providers/http.js";
import type {
  DirectAuthTokenRequestPhase1,
  DirectAuthTokenResponsePhase1,
  TokenOrSessionResult,
} from "./protocol.js";

const ENDPOINTS = {
  TOKEN: "/token",
  SESSION: "/api/v1/auth/direct/session",
  LOGOUT: "/api/v1/auth/direct/logout",
};

export interface SessionManagerOptions {
  issuer: string;
  clientId: string;
  http: BrowserHttpClient;
  mode: "server" | "browser";
  serverSession?: {
    exchangeEndpoint: string;
    sessionEndpoint: string;
    logoutEndpoint: string;
    credentials: RequestCredentials;
  };
}

export class SessionAuthImpl implements SessionAuth {
  private readonly issuer: string;
  private readonly clientId: string;
  private readonly http: BrowserHttpClient;
  private readonly mode: "server" | "browser";
  private readonly serverSession?: NonNullable<SessionManagerOptions["serverSession"]>;
  private memoryToken: string | null = null;
  private cachedSession: Session | null = null;
  private cachedUser: User | null = null;
  private sessionCacheExpiry: number = 0;
  private readonly SESSION_CACHE_TTL = 60000;

  constructor(options: SessionManagerOptions) {
    this.issuer = options.issuer;
    this.clientId = options.clientId;
    this.http = options.http;
    this.mode = options.mode;
    this.serverSession = options.serverSession;
  }

  private getStoredToken(): string | null {
    return this.memoryToken;
  }

  private storeToken(token: string): void {
    this.memoryToken = token;
  }

  private removeStoredToken(): void {
    this.memoryToken = null;
  }

  async get(): Promise<Session | null> {
    if (this.cachedSession && Date.now() < this.sessionCacheExpiry) {
      return this.cachedSession;
    }

    if (this.mode === "server") {
      return this.getServerMediatedSession();
    }

    const token = this.getStoredToken();
    if (!token) {
      this.clearCache();
      return null;
    }

    try {
      const response = await this.http.fetch<{
        session: Session;
        user: User;
      }>(`${this.issuer}${ENDPOINTS.SESSION}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok || !response.data?.session) {
        if (response.status === 401) {
          this.removeStoredToken();
        }
        this.clearCache();
        return null;
      }

      this.cachedSession = response.data.session;
      this.cachedUser = response.data.user;
      this.sessionCacheExpiry = Date.now() + this.SESSION_CACHE_TTL;

      return response.data.session;
    } catch {
      this.clearCache();
      return null;
    }
  }

  async getUser(): Promise<User | null> {
    if (this.cachedUser && Date.now() < this.sessionCacheExpiry) {
      return this.cachedUser;
    }

    await this.get();
    return this.cachedUser;
  }

  async validate(): Promise<boolean> {
    try {
      const session = await this.get();
      if (!session) return false;

      const expiresAt = new Date(session.expiresAt).getTime();
      return Date.now() < expiresAt;
    } catch {
      return false;
    }
  }

  async logout(options?: DirectAuthLogoutOptions): Promise<void> {
    if (this.mode === "server") {
      await this.logoutServerMediated(options);
      return;
    }

    const token = this.getStoredToken();

    if (token) {
      try {
        const requestBody: {
          client_id: string;
          revoke_tokens?: boolean;
          logout_scope?: DirectAuthLogoutOptions["logoutScope"];
        } = {
          client_id: this.clientId,
        };

        if (options?.revokeTokens !== undefined) {
          requestBody.revoke_tokens = options.revokeTokens;
        }
        if (options?.logoutScope) {
          requestBody.logout_scope = options.logoutScope;
        }

        await this.http.fetch(`${this.issuer}${ENDPOINTS.LOGOUT}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });
      } catch {
        // Logout should still clear client-side state when server notification fails.
      }
    }

    this.removeStoredToken();
    this.clearCache();

    if (options?.redirectUri && typeof window !== "undefined") {
      window.location.href = options.redirectUri;
    }
  }

  async exchangeToken(
    directAuthArtifact: string,
    codeVerifier: string,
    requestRefreshToken?: boolean,
    providerId?: string,
  ): Promise<TokenOrSessionResult> {
    if (this.mode === "server") {
      return this.exchangeTokenServerMediated(
        directAuthArtifact,
        codeVerifier,
        providerId,
      );
    }

    const request: DirectAuthTokenRequestPhase1 = {
      grant_type: "urn:authrim:params:oauth:grant-type:direct-auth-finish",
      direct_auth_artifact: directAuthArtifact,
      client_id: this.clientId,
      code_verifier: codeVerifier,
      channel: "browser",
    };
    if (providerId) {
      request.provider_id = providerId;
    }

    const body = new URLSearchParams();
    body.set("grant_type", request.grant_type);
    body.set("direct_auth_artifact", request.direct_auth_artifact);
    body.set("client_id", request.client_id);
    body.set("code_verifier", request.code_verifier);
    body.set("channel", request.channel);
    if (request.provider_id) {
      body.set("provider_id", request.provider_id);
    }
    if (requestRefreshToken) {
      body.set("resource", this.clientId);
    }

    const response = await this.http.fetch<DirectAuthTokenResponsePhase1>(
      `${this.issuer}${ENDPOINTS.TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      },
    );

    if (!response.ok || !response.data) {
      if (response.status === 400) {
        const errorData = response.data as unknown as {
          error?: string;
          error_description?: string;
        };

        if (errorData?.error === "invalid_grant") {
          throw new AuthrimError(
            "auth_code_invalid",
            errorData.error_description || "Invalid authorization code",
          );
        }

        if (errorData?.error === "expired_token") {
          throw new AuthrimError(
            "auth_code_expired",
            errorData.error_description || "Authorization code has expired",
          );
        }
      }

      throw new AuthrimError(
        "token_error",
        "Failed to exchange authorization code for tokens",
      );
    }

    const tokenResponse = response.data;

    if (tokenResponse.access_token) {
      this.storeToken(tokenResponse.access_token);
    }

    return {
      tokens: tokenResponse,
    };
  }

  /**
   * Revalidate the current session by clearing cache and fetching fresh data.
   *
   * Note: This does NOT perform OAuth token refresh (grant_type: 'refresh_token').
   * Token refresh is handled automatically by the server when the access token
   * is still valid but needs renewal.
   *
   * For explicit token refresh, use the refresh token flow through the server.
   *
   * @returns Fresh session data or null if not authenticated
   */
  async refresh(): Promise<Session | null> {
    this.clearCache();
    return this.get();
  }

  async isAuthenticated(): Promise<boolean> {
    const token = this.getStoredToken();
    if (!token) {
      return false;
    }

    const session = await this.get();
    return session !== null;
  }

  clearCache(): void {
    this.cachedSession = null;
    this.cachedUser = null;
    this.sessionCacheExpiry = 0;
  }

  getToken(): string | null {
    if (this.mode === "server") {
      return null;
    }
    return this.getStoredToken();
  }

  private async getServerMediatedSession(): Promise<Session | null> {
    if (!this.serverSession) {
      this.clearCache();
      return null;
    }

    try {
      const response = await this.http.fetch<{
        session: Session;
        user: User;
      }>(this.serverSession.sessionEndpoint, {
        method: "GET",
        credentials: this.serverSession.credentials,
      });

      if (!response.ok || !response.data?.session || !response.data.user) {
        this.clearCache();
        return null;
      }

      this.cachedSession = response.data.session;
      this.cachedUser = response.data.user;
      this.sessionCacheExpiry = Date.now() + this.SESSION_CACHE_TTL;

      return response.data.session;
    } catch {
      this.clearCache();
      return null;
    }
  }

  private async logoutServerMediated(
    options?: DirectAuthLogoutOptions,
  ): Promise<void> {
    if (this.serverSession) {
      try {
        await this.http.fetch(this.serverSession.logoutEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            revoke_tokens: options?.revokeTokens,
            logout_scope: options?.logoutScope,
          }),
          credentials: this.serverSession.credentials,
        });
      } catch {
        // Logout should still clear client-side state when server notification fails.
      }
    }

    this.removeStoredToken();
    this.clearCache();

    if (options?.redirectUri && typeof window !== "undefined") {
      window.location.href = options.redirectUri;
    }
  }

  private async exchangeTokenServerMediated(
    directAuthArtifact: string,
    codeVerifier: string,
    providerId?: string,
  ): Promise<TokenOrSessionResult> {
    if (!this.serverSession) {
      throw new AuthrimError(
        "token_error",
        "Server-mediated auth requires serverSession endpoints",
      );
    }

    const response = await this.http.fetch<{
      session: Session;
      user: User;
    }>(this.serverSession.exchangeEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        direct_auth_artifact: directAuthArtifact,
        code_verifier: codeVerifier,
        provider_id: providerId,
      }),
      credentials: this.serverSession.credentials,
    });

    if (!response.ok || !response.data?.session || !response.data.user) {
      throw new AuthrimError(
        "token_error",
        "Failed to establish server-mediated session",
      );
    }

    this.cachedSession = response.data.session;
    this.cachedUser = response.data.user;
    this.sessionCacheExpiry = Date.now() + this.SESSION_CACHE_TTL;

    return {
      session: response.data.session,
      user: response.data.user,
    };
  }
}
