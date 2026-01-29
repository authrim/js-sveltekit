/**
 * CIBA (Client Initiated Backchannel Authentication) API Implementation
 *
 * Provides methods for fetching pending CIBA requests and approving/rejecting them.
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

export interface CIBAPendingRequest {
  auth_req_id: string;
  client_id: string;
  client_name: string;
  client_logo_uri: string | null;
  scope: string;
  binding_message?: string;
  user_code?: string;
  created_at: number;
  expires_at: number;
}

export interface CIBAPendingResponse {
  requests: CIBAPendingRequest[];
}

export interface CIBAActionResult {
  success: boolean;
  message?: string;
}

// =============================================================================
// Config
// =============================================================================

export interface CIBAApiConfig {
  issuer: string;
  http: HttpClient;
}

// =============================================================================
// Implementation
// =============================================================================

export class CIBAApiImpl {
  private readonly issuer: string;
  private readonly http: HttpClient;

  constructor(config: CIBAApiConfig) {
    this.issuer = config.issuer;
    this.http = config.http;
  }

  /**
   * Fetch pending CIBA authentication requests
   */
  async getData(loginHint: string): Promise<CIBAPendingRequest[]> {
    const url = `${this.issuer}/api/ciba/pending?login_hint=${encodeURIComponent(loginHint)}`;
    const response = await this.http.fetch<CIBAPendingResponse>(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    } as FetchOptions);

    if (!response.ok || !response.data) {
      const errorMsg =
        (response.data as unknown as { error_description?: string })
          ?.error_description || "Failed to load pending requests";
      throw new Error(errorMsg);
    }

    return response.data.requests || [];
  }

  /**
   * Approve a CIBA authentication request
   */
  async approve(
    authReqId: string,
    userId: string,
    sub: string,
  ): Promise<CIBAActionResult> {
    const url = `${this.issuer}/api/ciba/approve`;
    const response = await this.http.fetch<CIBAActionResult>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        auth_req_id: authReqId,
        user_id: userId,
        sub,
      }),
    } as FetchOptions);

    if (!response.ok) {
      const errorMsg =
        (response.data as unknown as { error_description?: string })
          ?.error_description || "Failed to approve request";
      throw new Error(errorMsg);
    }

    return response.data as CIBAActionResult;
  }

  /**
   * Reject a CIBA authentication request
   */
  async reject(
    authReqId: string,
    reason = "User rejected",
  ): Promise<CIBAActionResult> {
    const url = `${this.issuer}/api/ciba/deny`;
    const response = await this.http.fetch<CIBAActionResult>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        auth_req_id: authReqId,
        reason,
      }),
    } as FetchOptions);

    if (!response.ok) {
      const errorMsg =
        (response.data as unknown as { error_description?: string })
          ?.error_description || "Failed to deny request";
      throw new Error(errorMsg);
    }

    return response.data as CIBAActionResult;
  }
}
