/**
 * Server-mediated Direct Auth helpers for SvelteKit.
 *
 * These handlers redeem Direct Auth artifacts on the server, set an HttpOnly
 * application session cookie, and never return OAuth/OIDC tokens to browser JS.
 */

import { json, type RequestEvent, type RequestHandler } from "@sveltejs/kit";
import type { Session, User } from "@authrim/core";
import {
  createServerSessionManager,
  type ServerAuthContext,
  type ServerSessionManagerOptions,
} from "./session.js";

const DIRECT_AUTH_FINISH_GRANT =
  "urn:authrim:params:oauth:grant-type:direct-auth-finish";

export interface DirectAuthSessionHandlersOptions
  extends ServerSessionManagerOptions {
  issuer: string;
  clientId: string;
  /** Token endpoint. Default: '/token'. */
  tokenEndpoint?: string;
  /** Direct Auth session endpoint. Default: '/api/v1/auth/direct/session'. */
  sessionEndpoint?: string;
}

export interface DirectAuthSessionHandlers {
  /** POST: redeem a Direct Auth artifact and establish the HttpOnly session. */
  exchange: RequestHandler;
  /** GET: return current cookie-backed session and user. */
  session: RequestHandler;
  /** POST: clear current cookie-backed session. */
  logout: RequestHandler;
}

interface DirectAuthExchangeRequest {
  direct_auth_artifact?: unknown;
  code_verifier?: unknown;
  provider_id?: unknown;
}

interface DirectAuthTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface DirectAuthSessionResponse {
  session?: Session;
  user?: User;
  error?: string;
  error_description?: string;
}

export function createDirectAuthSessionHandlers(
  options: DirectAuthSessionHandlersOptions,
): DirectAuthSessionHandlers {
  const sessionManager = createServerSessionManager(options);

  return {
    exchange: async (event) => {
      const body = await readExchangeRequest(event);
      if (!body.ok) {
        return json(
          {
            error: "invalid_request",
            error_description: body.error,
          },
          { status: 400 },
        );
      }

      const tokenResult = await redeemDirectAuthArtifact(event, options, body.value);
      if (!tokenResult.ok) {
        return json(tokenResult.error, { status: tokenResult.status });
      }

      const sessionResult = await fetchDirectAuthSession(
        event,
        options,
        tokenResult.accessToken,
      );
      if (!sessionResult.ok) {
        return json(sessionResult.error, { status: sessionResult.status });
      }

      const authContext: ServerAuthContext = {
        session: sessionResult.session,
        user: sessionResult.user,
      };
      await sessionManager.set(event, authContext);
      (event.locals as { auth?: ServerAuthContext }).auth = authContext;

      return json(authContext);
    },

    session: async (event) => {
      const authContext = await sessionManager.get(event);
      if (!authContext) {
        return json(
          {
            error: "not_authenticated",
            error_description: "No server-mediated session is available",
          },
          { status: 401 },
        );
      }

      return json(authContext);
    },

    logout: async (event) => {
      sessionManager.clear(event);
      delete (event.locals as { auth?: ServerAuthContext }).auth;
      return new Response(null, { status: 204 });
    },
  };
}

async function readExchangeRequest(
  event: RequestEvent,
): Promise<
  | {
      ok: true;
      value: {
        directAuthArtifact: string;
        codeVerifier: string;
        providerId?: string;
      };
    }
  | { ok: false; error: string }
> {
  let data: DirectAuthExchangeRequest;
  try {
    data = (await event.request.json()) as DirectAuthExchangeRequest;
  } catch {
    return { ok: false, error: "Request body must be JSON" };
  }

  if (typeof data.direct_auth_artifact !== "string") {
    return { ok: false, error: "direct_auth_artifact is required" };
  }
  if (typeof data.code_verifier !== "string") {
    return { ok: false, error: "code_verifier is required" };
  }
  if (
    data.provider_id !== undefined &&
    typeof data.provider_id !== "string"
  ) {
    return { ok: false, error: "provider_id must be a string" };
  }

  return {
    ok: true,
    value: {
      directAuthArtifact: data.direct_auth_artifact,
      codeVerifier: data.code_verifier,
      providerId: data.provider_id,
    },
  };
}

async function redeemDirectAuthArtifact(
  event: RequestEvent,
  options: DirectAuthSessionHandlersOptions,
  request: {
    directAuthArtifact: string;
    codeVerifier: string;
    providerId?: string;
  },
): Promise<
  | { ok: true; accessToken: string }
  | {
      ok: false;
      status: number;
      error: { error: string; error_description: string };
    }
> {
  const body = new URLSearchParams();
  body.set("grant_type", DIRECT_AUTH_FINISH_GRANT);
  body.set("direct_auth_artifact", request.directAuthArtifact);
  body.set("client_id", options.clientId);
  body.set("code_verifier", request.codeVerifier);
  body.set("channel", "server");
  if (request.providerId) {
    body.set("provider_id", request.providerId);
  }

  const response = await event.fetch(
    `${options.issuer}${options.tokenEndpoint ?? "/token"}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
  );
  const data = (await response.json().catch(() => ({}))) as DirectAuthTokenResponse;

  if (!response.ok || typeof data.access_token !== "string") {
    return {
      ok: false,
      status: response.status || 502,
      error: {
        error: data.error ?? "token_exchange_failed",
        error_description:
          data.error_description ?? "Failed to redeem Direct Auth artifact",
      },
    };
  }

  return { ok: true, accessToken: data.access_token };
}

async function fetchDirectAuthSession(
  event: RequestEvent,
  options: DirectAuthSessionHandlersOptions,
  accessToken: string,
): Promise<
  | { ok: true; session: Session; user: User }
  | {
      ok: false;
      status: number;
      error: { error: string; error_description: string };
    }
> {
  const response = await event.fetch(
    `${options.issuer}${options.sessionEndpoint ?? "/api/v1/auth/direct/session"}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  const data = (await response
    .json()
    .catch(() => ({}))) as DirectAuthSessionResponse;

  if (!response.ok || !data.session || !data.user) {
    return {
      ok: false,
      status: response.status || 502,
      error: {
        error: data.error ?? "session_fetch_failed",
        error_description:
          data.error_description ?? "Failed to load Direct Auth session",
      },
    };
  }

  return {
    ok: true,
    session: data.session,
    user: data.user,
  };
}
