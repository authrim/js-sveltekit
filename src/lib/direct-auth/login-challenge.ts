/**
 * Login Challenge API Implementation
 *
 * Provides methods for fetching login challenge data (OAuth client metadata).
 * This is a thin API wrapper — no business logic, just HTTP calls.
 */

import type { HttpClient, HttpOptions } from "@authrim/core";

/** Extended HTTP options with browser-specific fields */
interface FetchOptions extends HttpOptions {
  credentials?: RequestCredentials;
}

// =============================================================================
// Types
// =============================================================================

export interface LoginChallengeClientInfo {
  client_id: string;
  client_name: string;
  logo_uri?: string;
  client_uri?: string;
  policy_uri?: string;
  tos_uri?: string;
  redirect_uris: string[];
  scope: string;
  response_type: string;
}

export interface LoginChallengeData {
  challenge_id: string;
  client: LoginChallengeClientInfo;
  requested_scopes: string[];
  login_hint?: string;
  prompt?: string;
  max_age?: number;
  acr_values?: string[];
}

// =============================================================================
// Config
// =============================================================================

export interface LoginChallengeApiConfig {
  issuer: string;
  http: HttpClient;
}

// =============================================================================
// Implementation
// =============================================================================

export class LoginChallengeApiImpl {
  private readonly issuer: string;
  private readonly http: HttpClient;

  constructor(config: LoginChallengeApiConfig) {
    this.issuer = config.issuer;
    this.http = config.http;
  }

  /**
   * Fetch login challenge data by challenge ID
   */
  async getData(challengeId: string): Promise<LoginChallengeData> {
    const url = `${this.issuer}/auth/login-challenge?challenge_id=${encodeURIComponent(challengeId)}`;
    const response = await this.http.fetch<LoginChallengeData>(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    } as FetchOptions);

    if (!response.ok || !response.data) {
      const errorMsg =
        (response.data as unknown as { error_description?: string })
          ?.error_description || "Failed to load login challenge data";
      throw new Error(errorMsg);
    }

    return response.data;
  }
}
