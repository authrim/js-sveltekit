/**
 * Device Flow API Implementation
 *
 * Provides methods for device code verification (RFC 8628).
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

export interface DeviceFlowData {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval: number;
}

export interface DeviceFlowSubmitResult {
  message: string;
}

export interface DeviceFlowError {
  error: string;
  error_description?: string;
}

// =============================================================================
// Config
// =============================================================================

export interface DeviceFlowApiConfig {
  issuer: string;
  http: HttpClient;
}

// =============================================================================
// Implementation
// =============================================================================

export class DeviceFlowApiImpl {
  private readonly issuer: string;
  private readonly http: HttpClient;

  constructor(config: DeviceFlowApiConfig) {
    this.issuer = config.issuer;
    this.http = config.http;
  }

  /**
   * Verify and submit device code (approve or deny)
   */
  async submit(
    userCode: string,
    approve = true,
  ): Promise<DeviceFlowSubmitResult> {
    const url = `${this.issuer}/api/device/verify`;
    const response = await this.http.fetch<
      DeviceFlowSubmitResult | DeviceFlowError
    >(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        user_code: userCode,
        approved: approve,
      }),
    } as FetchOptions);

    if (!response.ok) {
      const errorData = response.data as DeviceFlowError | null;
      throw new DeviceFlowVerificationError(
        errorData?.error_description || "Failed to verify device code",
        errorData?.error || "verification_failed",
      );
    }

    return response.data as DeviceFlowSubmitResult;
  }
}

export class DeviceFlowVerificationError extends Error {
  public readonly errorCode: string;

  constructor(message: string, errorCode: string) {
    super(message);
    this.name = "DeviceFlowVerificationError";
    this.errorCode = errorCode;
  }
}
