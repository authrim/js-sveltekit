/**
 * OAuth Namespace for SvelteKit
 *
 * Provides OAuth 2.0 / OpenID Connect authentication flows
 */

import type { AuthrimClient as CoreClient } from "@authrim/core";
import { stringToBase64url, base64urlToString } from "@authrim/core";
import type { TrySilentLoginOptions, SilentLoginResult } from "../types.js";

/**
 * Silent login state data (compact keys to reduce URL length)
 */
interface SilentLoginStateData {
  /** Type: 'sl' = silent_login */
  t: "sl";
  /** Login Required: 'l' = login, 'r' = return */
  lr: "l" | "r";
  /** Return To: URL to return after auth */
  rt: string;
}

/**
 * Create OAuth namespace
 */
export function createOAuthNamespace(
  coreClient: CoreClient,
  config: {
    silentLoginRedirectUri?: string;
  },
) {
  return {
    /**
     * Try silent SSO via top-level navigation (prompt=none)
     *
     * Safari ITP / Chrome Third-Party Cookie Phaseout compatible.
     * This function redirects to IdP and does not return.
     *
     * Uses /authorize?prompt=none&handoff=true for unified SSO experience.
     * Works for both Direct Auth (Passkey/EmailCode) and External IdP (Google/Apple).
     *
     * @param options - Silent login options
     * @throws Error if returnTo URL is not same origin
     */
    async trySilentLogin(options?: TrySilentLoginOptions): Promise<never> {
      // Browser-only feature
      if (typeof window === "undefined") {
        throw new Error("trySilentLogin is only available in browser");
      }

      const onLoginRequired = options?.onLoginRequired ?? "return";
      const returnTo = options?.returnTo ?? window.location.href;

      // Security: Open redirect prevention
      if (!isSafeReturnTo(returnTo)) {
        throw new Error("returnTo must be same origin");
      }

      // Encode state data (short keys to reduce URL length)
      const stateData: SilentLoginStateData = {
        t: "sl", // silent_login
        lr: onLoginRequired === "login" ? "l" : "r",
        rt: returnTo,
      };
      const state = stringToBase64url(JSON.stringify(stateData));

      // Build authorization URL with handoff=true
      const result = await coreClient.buildAuthorizationUrl({
        redirectUri:
          config.silentLoginRedirectUri ??
          `${window.location.origin}/callback.html`,
        scope: options?.scope,
        prompt: "none",
        exposeState: false, // We manage state ourselves
      });

      // Add handoff=true parameter for Session Token Handoff SSO
      const url = new URL(result.url);
      url.searchParams.set("handoff", "true");
      url.searchParams.set("state", state);

      // Redirect (this function never returns)
      window.location.href = url.toString();

      // TypeScript: This line is never reached
      throw new Error("unreachable");
    },

    /**
     * Handle silent login callback
     *
     * Call this in your callback page. Handles both silent login
     * results and regular OAuth callbacks.
     *
     * @returns Silent login result
     */
    async handleSilentCallback(): Promise<SilentLoginResult> {
      // Browser-only feature
      if (typeof window === "undefined") {
        return { status: "error", error: "not_browser" };
      }

      const params = new URLSearchParams(window.location.search);
      const error = params.get("error");
      const stateParam = params.get("state");

      // Try to decode state
      let stateData: SilentLoginStateData | null = null;
      if (stateParam) {
        try {
          const decoded = base64urlToString(stateParam);
          const parsed = JSON.parse(decoded) as Record<string, unknown>;
          // Type guard: check if this is a silent login state
          if (
            parsed.t === "sl" &&
            typeof parsed.lr === "string" &&
            typeof parsed.rt === "string"
          ) {
            stateData = {
              t: "sl",
              lr: parsed.lr as "l" | "r",
              rt: parsed.rt,
            };
          }
        } catch {
          // Decode failed, not a silent login state
        }
      }

      // Not a silent login callback
      if (!stateData) {
        // Return error to indicate this is not a silent login callback
        return { status: "error", error: "not_silent_login" };
      }

      const returnTo = stateData.rt;
      const onLoginRequired = stateData.lr === "l" ? "login" : "return";

      // Security: Open redirect prevention
      if (!isSafeReturnTo(returnTo)) {
        return { status: "error", error: "invalid_return_to" };
      }

      // Handle login_required error (IdP has no session)
      if (error === "login_required") {
        if (onLoginRequired === "login") {
          // Redirect to login screen (without prompt=none)
          const loginResult = await coreClient.buildAuthorizationUrl({
            redirectUri:
              config.silentLoginRedirectUri ??
              `${window.location.origin}/callback.html`,
            exposeState: false,
          });

          // Encode return URL in state for after login
          const loginStateData = { rt: returnTo };
          const loginUrl = new URL(loginResult.url);
          loginUrl.searchParams.set(
            "state",
            stringToBase64url(JSON.stringify(loginStateData)),
          );

          window.location.href = loginUrl.toString();
          return { status: "login_required" };
        } else {
          // Return to original page with error
          const returnUrl = new URL(returnTo);
          returnUrl.searchParams.set("sso_error", "login_required");
          window.location.href = returnUrl.toString();
          return { status: "login_required" };
        }
      }

      // Handle other errors
      if (error) {
        const errorDescription = params.get("error_description");
        const returnUrl = new URL(returnTo);
        returnUrl.searchParams.set("sso_error", error);
        if (errorDescription) {
          returnUrl.searchParams.set("sso_error_description", errorDescription);
        }
        window.location.href = returnUrl.toString();
        return {
          status: "error",
          error,
          errorDescription: errorDescription ?? undefined,
        };
      }

      // Success: Exchange code for tokens
      const code = params.get("code");
      if (code) {
        try {
          await coreClient.handleCallback(window.location.href);
          // Clear sso_attempted flag on success
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.removeItem("sso_attempted");
          }
          window.location.href = returnTo;
          return { status: "success" };
        } catch (e) {
          const errorMessage =
            e instanceof Error ? e.message : "Token exchange failed";
          const returnUrl = new URL(returnTo);
          returnUrl.searchParams.set("sso_error", "token_error");
          returnUrl.searchParams.set("sso_error_description", errorMessage);
          window.location.href = returnUrl.toString();
          return {
            status: "error",
            error: "token_error",
            errorDescription: errorMessage,
          };
        }
      }

      return { status: "error", error: "unknown_error" };
    },

    /**
     * Handle regular OAuth callback (for authorization code flow)
     *
     * @param callbackUrl - Full callback URL with code and state
     * @returns Tokens from token exchange
     */
    async handleCallback(callbackUrl?: string) {
      const url =
        callbackUrl ??
        (typeof window !== "undefined" ? window.location.href : "");
      return await coreClient.handleCallback(url);
    },
  };
}

/**
 * Check if returnTo URL is safe (same origin)
 * Prevents open redirect attacks
 */
function isSafeReturnTo(url: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const u = new URL(url, window.location.origin);
    return u.origin === window.location.origin;
  } catch {
    return false;
  }
}
