/**
 * Consent API Implementation
 *
 * Provides methods for fetching consent screen data and submitting consent decisions.
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

export interface ConsentScopeInfo {
  name: string;
  title: string;
  description: string;
  required: boolean;
}

export interface ConsentClientInfo {
  client_id: string;
  client_name: string;
  logo_uri?: string;
  client_uri?: string;
  policy_uri?: string;
  tos_uri?: string;
  is_trusted?: boolean;
}

export interface ConsentUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface ConsentOrgInfo {
  id: string;
  name: string;
  type: string;
  is_primary: boolean;
  plan?: string;
}

export interface ConsentActingAsInfo {
  id: string;
  name?: string;
  email: string;
  relationship_type: string;
  permission_level: string;
}

export interface ConsentFeatureFlags {
  org_selector_enabled: boolean;
  acting_as_enabled: boolean;
  show_roles: boolean;
}

export interface ConsentScreenData {
  challenge_id: string;
  client: ConsentClientInfo;
  scopes: ConsentScopeInfo[];
  user: ConsentUserInfo;
  organizations: ConsentOrgInfo[];
  primary_org: ConsentOrgInfo | null;
  roles: string[];
  acting_as: ConsentActingAsInfo | null;
  target_org_id: string | null;
  features: ConsentFeatureFlags;
}

export interface ConsentSubmitOptions {
  approve: boolean;
  selectedOrgId?: string | null;
  actingAsUserId?: string;
}

export interface ConsentSubmitResult {
  redirect_url: string;
}

// =============================================================================
// Config
// =============================================================================

export interface ConsentApiConfig {
  issuer: string;
  http: HttpClient;
}

// =============================================================================
// Implementation
// =============================================================================

export class ConsentApiImpl {
  private readonly issuer: string;
  private readonly http: HttpClient;

  constructor(config: ConsentApiConfig) {
    this.issuer = config.issuer;
    this.http = config.http;
  }

  /**
   * Fetch consent screen data
   */
  async getData(challengeId: string): Promise<ConsentScreenData> {
    const url = `${this.issuer}/auth/consent?challenge_id=${encodeURIComponent(challengeId)}`;
    const response = await this.http.fetch<ConsentScreenData>(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    } as FetchOptions);

    if (!response.ok || !response.data) {
      const errorMsg =
        (response.data as unknown as { error_description?: string })
          ?.error_description || "Failed to load consent data";
      throw new Error(errorMsg);
    }

    return response.data;
  }

  /**
   * Submit consent decision (approve or deny)
   */
  async submit(
    challengeId: string,
    options: ConsentSubmitOptions,
  ): Promise<ConsentSubmitResult> {
    const url = `${this.issuer}/auth/consent`;
    const response = await this.http.fetch<ConsentSubmitResult>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        challenge_id: challengeId,
        approved: options.approve,
        selected_org_id: options.selectedOrgId,
        acting_as_user_id: options.actingAsUserId,
      }),
    } as FetchOptions);

    if (!response.ok || !response.data) {
      const errorMsg =
        (response.data as unknown as { error_description?: string })
          ?.error_description || "Failed to submit consent";
      throw new Error(errorMsg);
    }

    return response.data;
  }
}
