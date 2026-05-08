import { afterEach, describe, expect, it, vi } from "vitest";
import type { RequestEvent } from "@sveltejs/kit";
import { DPoPManager } from "@authrim/core";
import type { Session, User } from "@authrim/core";
import { createAuthrim } from "../client.js";
import { SessionAuthImpl } from "../direct-auth/session.js";
import { createDirectAuthSessionHandlers } from "../server/direct-auth.js";
import { createServerSessionManager } from "../server/session.js";

const session: Session = {
  id: "session-1",
  userId: "user-1",
  createdAt: "2026-05-06T00:00:00.000Z",
  expiresAt: "2099-05-06T01:00:00.000Z",
};

const user: User = {
  id: "user-1",
  email: "user@example.com",
};
const sessionSecret =
  "test-session-secret-with-at-least-32-bytes";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SvelteKit server-mediated auth mode", () => {
  it("uses same-origin cookie session endpoints by default and keeps tokens out of JS", async () => {
    const http = {
      fetch: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        data: { session, user },
      }),
    };
    const manager = new SessionAuthImpl({
      issuer: "https://auth.example.com",
      clientId: "client-id",
      http: http as never,
      mode: "server",
      serverSession: {
        exchangeEndpoint: "/authrim/session/exchange",
        sessionEndpoint: "/authrim/session",
        logoutEndpoint: "/authrim/session/logout",
        credentials: "same-origin",
      },
    });

    const result = await manager.exchangeToken("artifact-1", "verifier-1");

    expect(result).toEqual({ session, user });
    expect(manager.getToken()).toBeNull();
    expect(http.fetch).toHaveBeenCalledWith(
      "/authrim/session/exchange",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
      }),
    );
    expect(JSON.parse(http.fetch.mock.calls[0][1].body)).toEqual({
      direct_auth_artifact: "artifact-1",
      code_verifier: "verifier-1",
    });
  });

  it("uses browser-held token exchange only when authMode is explicit browser", async () => {
    const http = {
      fetch: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          token_type: "DPoP",
          access_token: "browser-access-token",
          expires_in: 300,
        },
      }),
    };
    const manager = new SessionAuthImpl({
      issuer: "https://auth.example.com",
      clientId: "client-id",
      http: http as never,
      mode: "browser",
    });

    const result = await manager.exchangeToken("artifact-1", "verifier-1");

    expect(result.tokens?.access_token).toBe("browser-access-token");
    expect(manager.getToken()).toBe("browser-access-token");
    expect(http.fetch).toHaveBeenCalledWith(
      "https://auth.example.com/token",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("channel=browser"),
      }),
    );
  });

  it("stores browser refresh tokens in memory and refreshes with DPoP nonce retry", async () => {
    const dpop = {
      required: true,
      generateProof: vi
        .fn()
        .mockResolvedValueOnce("proof-exchange")
        .mockResolvedValueOnce("proof-refresh-1")
        .mockResolvedValueOnce("proof-refresh-2"),
      handleNonce: vi.fn(),
    };
    const http = {
      fetch: vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: {},
          data: {
            token_type: "DPoP",
            access_token: "browser-access-token-1",
            refresh_token: "browser-refresh-token-1",
            expires_in: 300,
          },
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          headers: { "dpop-nonce": "refresh-nonce" },
          data: { error: "use_dpop_nonce" },
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: {},
          data: {
            token_type: "DPoP",
            access_token: "browser-access-token-2",
            refresh_token: "browser-refresh-token-2",
            expires_in: 300,
          },
        }),
    };
    const manager = new SessionAuthImpl({
      issuer: "https://auth.example.com",
      clientId: "client-id",
      http: http as never,
      mode: "browser",
      tokenRequestDPoP: dpop,
    });

    await manager.exchangeToken("artifact-1", "verifier-1", true);
    const refreshed = await manager.refreshAccessToken();

    expect(refreshed).toBe("browser-access-token-2");
    expect(manager.getToken()).toBe("browser-access-token-2");
    expect(dpop.handleNonce).toHaveBeenCalledWith("refresh-nonce");
    expect(http.fetch.mock.calls[0][1].headers).toMatchObject({
      DPoP: "proof-exchange",
    });
    expect(http.fetch.mock.calls[2][1].headers).toMatchObject({
      DPoP: "proof-refresh-2",
    });
    expect(String(http.fetch.mock.calls[1][1].body)).toContain(
      "refresh_token=browser-refresh-token-1",
    );
  });

  it("clears browser token state on refresh token reuse detection", async () => {
    const http = {
      fetch: vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: {},
          data: {
            token_type: "DPoP",
            access_token: "browser-access-token-1",
            refresh_token: "browser-refresh-token-1",
            expires_in: 300,
          },
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          headers: {},
          data: {
            error: "refresh_token_reuse_detected",
            error_description: "Refresh token reuse detected",
          },
        }),
    };
    const manager = new SessionAuthImpl({
      issuer: "https://auth.example.com",
      clientId: "client-id",
      http: http as never,
      mode: "browser",
    });

    await manager.exchangeToken("artifact-1", "verifier-1", true);

    await expect(manager.refreshAccessToken()).rejects.toMatchObject({
      code: "refresh_token_reuse_detected",
    });
    expect(manager.getToken()).toBeNull();
  });

  it("makes browser session probing opt-in for the default server mode", async () => {
    const serverDefault = await createAuthrim({
      issuer: "https://auth.example.com",
      clientId: "client-id",
    });
    const serverOptIn = await createAuthrim({
      issuer: "https://auth.example.com",
      clientId: "client-id",
      serverSession: { checkOnMount: true },
    });
    const browserExplicit = await createAuthrim({
      issuer: "https://auth.example.com",
      clientId: "client-id",
      authMode: "browser",
    });

    expect(serverDefault._shouldFetchSessionOnMount()).toBe(false);
    expect(serverOptIn._shouldFetchSessionOnMount()).toBe(true);
    expect(browserExplicit._shouldFetchSessionOnMount()).toBe(true);
  });

  it("requires authMode browser for browser refresh token policy", async () => {
    await expect(
      createAuthrim({
        issuer: "https://auth.example.com",
        clientId: "client-id",
        browserRefreshTokenPolicy: "dpop_bound",
      }),
    ).rejects.toThrow("requires authMode='browser'");
  });

  it("authrim.fetch uses cookie credentials and CSRF in server-mediated profile", async () => {
    const originalFetch = globalThis.fetch;
    const fetch = vi.fn().mockResolvedValue(new Response("ok"));
    globalThis.fetch = fetch;
    vi.stubGlobal("document", { cookie: "authrim_csrf=cookie-csrf" });
    try {
      const auth = await createAuthrim({
        issuer: "https://auth.example.com",
        clientId: "client-id",
        profile: "cookie",
        serverSession: { credentials: "include" },
      });

      await auth.fetch("/api/me", { method: "POST" });

      expect(fetch).toHaveBeenCalledWith(
        "/api/me",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: expect.any(Headers),
        }),
      );
      const headers = fetch.mock.calls[0][1].headers as Headers;
      expect(headers.get("X-Authrim-CSRF")).toBe("cookie-csrf");
    } finally {
      globalThis.fetch = originalFetch;
      vi.unstubAllGlobals();
    }
  });

  it("authrim.fetch attaches DPoP token headers and retries one nonce challenge in browser profile", async () => {
    const originalFetch = globalThis.fetch;
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "use_dpop_nonce" }), {
          status: 401,
          headers: {
            "content-type": "application/json",
            "DPoP-Nonce": "nonce-1",
          },
        }),
      )
      .mockResolvedValueOnce(new Response("ok"));
    globalThis.fetch = fetch;
    vi.spyOn(DPoPManager.prototype, "initialize").mockResolvedValue(undefined);
    vi.spyOn(DPoPManager.prototype, "calculateAccessTokenHash").mockResolvedValue("ath");
    vi.spyOn(DPoPManager.prototype, "generateProof")
      .mockResolvedValueOnce("proof-1")
      .mockResolvedValueOnce("proof-2");
    const handleNonce = vi
      .spyOn(DPoPManager.prototype, "handleNonceResponse")
      .mockImplementation(() => {});
    vi.spyOn(SessionAuthImpl.prototype, "getToken").mockReturnValue("access-token-1");
    try {
      const auth = await createAuthrim({
        issuer: "https://auth.example.com",
        clientId: "client-id",
        profile: "token",
      });

      const response = await auth.fetch("/api/me");

      expect(await response.text()).toBe("ok");
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(handleNonce).toHaveBeenCalledWith("nonce-1");
      const firstHeaders = fetch.mock.calls[0][1].headers as Headers;
      const secondHeaders = fetch.mock.calls[1][1].headers as Headers;
      expect(firstHeaders.get("Authorization")).toBe("DPoP access-token-1");
      expect(firstHeaders.get("DPoP")).toBe("proof-1");
      expect(secondHeaders.get("Authorization")).toBe("DPoP access-token-1");
      expect(secondHeaders.get("DPoP")).toBe("proof-2");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("authrim.fetch refreshes and replays a safe browser request once after 401", async () => {
    const originalFetch = globalThis.fetch;
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("expired", { status: 401 }))
      .mockResolvedValueOnce(new Response("ok"));
    globalThis.fetch = fetch;
    vi.spyOn(DPoPManager.prototype, "initialize").mockResolvedValue(undefined);
    vi.spyOn(DPoPManager.prototype, "calculateAccessTokenHash").mockResolvedValue("ath");
    vi.spyOn(DPoPManager.prototype, "generateProof")
      .mockResolvedValueOnce("proof-1")
      .mockResolvedValueOnce("proof-2");
    vi.spyOn(SessionAuthImpl.prototype, "getToken").mockReturnValue("access-token-1");
    const refresh = vi
      .spyOn(SessionAuthImpl.prototype, "refreshAccessToken")
      .mockResolvedValue("access-token-2");
    try {
      const auth = await createAuthrim({
        issuer: "https://auth.example.com",
        clientId: "client-id",
        profile: "token",
      });

      const response = await auth.fetch("/api/me");

      expect(await response.text()).toBe("ok");
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledTimes(2);
      const replayHeaders = fetch.mock.calls[1][1].headers as Headers;
      expect(replayHeaders.get("Authorization")).toBe("DPoP access-token-2");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("authrim.fetch does not refresh and replay mutations without Idempotency-Key", async () => {
    const originalFetch = globalThis.fetch;
    const fetch = vi.fn().mockResolvedValue(new Response("expired", { status: 401 }));
    globalThis.fetch = fetch;
    vi.spyOn(DPoPManager.prototype, "initialize").mockResolvedValue(undefined);
    vi.spyOn(DPoPManager.prototype, "calculateAccessTokenHash").mockResolvedValue("ath");
    vi.spyOn(DPoPManager.prototype, "generateProof").mockResolvedValue("proof-1");
    vi.spyOn(SessionAuthImpl.prototype, "getToken").mockReturnValue("access-token-1");
    const refresh = vi
      .spyOn(SessionAuthImpl.prototype, "refreshAccessToken")
      .mockResolvedValue("access-token-2");
    try {
      const auth = await createAuthrim({
        issuer: "https://auth.example.com",
        clientId: "client-id",
        profile: "token",
      });

      const response = await auth.fetch("/api/me", { method: "POST" });

      expect(response.status).toBe(401);
      expect(refresh).not.toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("createDirectAuthSessionHandlers", () => {
  it("redeems artifacts on the server, sets an HttpOnly cookie, and omits tokens from the response", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          token_type: "Bearer",
          access_token: "server-access-token",
          expires_in: 300,
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ session, user }));
    const cookies = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };
    const event = {
      request: new Request("https://app.example.com/authrim/session/exchange", {
        method: "POST",
        body: JSON.stringify({
          direct_auth_artifact: "artifact-1",
          code_verifier: "verifier-1",
        }),
      }),
      fetch,
      cookies,
      locals: {},
    } as unknown as RequestEvent;

    const handlers = createDirectAuthSessionHandlers({
      issuer: "https://auth.example.com",
      clientId: "client-id",
      sessionSecret,
    });
    const response = await handlers.exchange(event);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toEqual({ session, user });
    expect(JSON.stringify(body)).not.toContain("server-access-token");
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "https://auth.example.com/token",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("channel=server"),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "https://auth.example.com/api/v1/auth/direct/session",
      expect.objectContaining({
        method: "GET",
        headers: {
          Authorization: "Bearer server-access-token",
        },
      }),
    );
    expect(cookies.set).toHaveBeenCalledWith(
      "authrim_session",
      expect.stringMatching(/^v2\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u),
      expect.objectContaining({ httpOnly: true }),
    );
    const cookieValue = cookies.set.mock.calls[0][1] as string;
    expect(cookieValue).not.toContain("server-access-token");
    expect(cookieValue).not.toContain("user@example.com");
  });
});

describe("createServerSessionManager", () => {
  it("loads encrypted server session cookies", async () => {
    let cookieValue = "";
    const sessionManager = createServerSessionManager({ sessionSecret });
    const writeEvent = {
      cookies: {
        set: vi.fn((_, value) => {
          cookieValue = value as string;
        }),
        get: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as RequestEvent;

    await sessionManager.set(writeEvent, { session, user });

    const readEvent = {
      cookies: {
        get: vi.fn(() => cookieValue),
        set: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as RequestEvent;

    await expect(sessionManager.get(readEvent)).resolves.toEqual({
      session,
      user,
    });
    expect(readEvent.cookies.delete).not.toHaveBeenCalled();
  });

  it("does not expose session payload in the cookie value", async () => {
    let cookieValue = "";
    const sessionManager = createServerSessionManager({ sessionSecret });
    const writeEvent = {
      cookies: {
        set: vi.fn((_, value) => {
          cookieValue = value as string;
        }),
        get: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as RequestEvent;

    await sessionManager.set(writeEvent, { session, user });

    const [, encodedIv, encodedCiphertext] = cookieValue.split(".");
    expect(encodedIv).toBeTruthy();
    expect(encodedCiphertext).toBeTruthy();
    expect(decodeBase64UrlToText(encodedIv)).not.toContain("user@example.com");
    expect(decodeBase64UrlToText(encodedCiphertext)).not.toContain(
      "user@example.com",
    );
    expect(decodeBase64UrlToText(encodedCiphertext)).not.toContain("session-1");
  });

  it("rejects tampered server session cookies", async () => {
    let cookieValue = "";
    const sessionManager = createServerSessionManager({ sessionSecret });
    const writeEvent = {
      cookies: {
        set: vi.fn((_, value) => {
          cookieValue = value as string;
        }),
        get: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as RequestEvent;
    await sessionManager.set(writeEvent, { session, user });

    const [version, encodedIv, encodedCiphertext] = cookieValue.split(".");
    const tamperedCiphertext = `${
      encodedCiphertext[0] === "A" ? "B" : "A"
    }${encodedCiphertext.slice(1)}`;
    const tamperedCookie = `${version}.${encodedIv}.${tamperedCiphertext}`;
    const readEvent = {
      cookies: {
        get: vi.fn(() => tamperedCookie),
        set: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as RequestEvent;

    await expect(sessionManager.get(readEvent)).resolves.toBeNull();
    expect(readEvent.cookies.delete).toHaveBeenCalledWith("authrim_session", {
      path: "/",
    });
  });

  it("requires a session secret before setting cookies", async () => {
    const sessionManager = createServerSessionManager();
    const event = {
      cookies: {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as RequestEvent;

    await expect(sessionManager.set(event, { session, user })).rejects.toThrow(
      "sessionSecret",
    );
  });
});

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function decodeBase64UrlToText(value: string | undefined): string {
  if (!value) {
    return "";
  }
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return new TextDecoder().decode(Buffer.from(padded, "base64"));
}
