import { describe, expect, it, vi } from "vitest";
import type { RequestEvent } from "@sveltejs/kit";
import type { Session, User } from "@authrim/core";
import { createAuthrim } from "../client.js";
import { SessionAuthImpl } from "../direct-auth/session.js";
import { createDirectAuthSessionHandlers } from "../server/direct-auth.js";
import { createServerSessionManager } from "../server/session.js";

const session: Session = {
  id: "session-1",
  userId: "user-1",
  createdAt: "2026-05-06T00:00:00.000Z",
  expiresAt: "2026-05-06T01:00:00.000Z",
};

const user: User = {
  id: "user-1",
  email: "user@example.com",
};
const sessionSecret =
  "test-session-secret-with-at-least-32-bytes";

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
      expect.stringMatching(/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u),
      expect.objectContaining({ httpOnly: true }),
    );
    const cookieValue = cookies.set.mock.calls[0][1] as string;
    expect(cookieValue).not.toContain("server-access-token");
    expect(cookieValue).not.toContain("user@example.com");
  });
});

describe("createServerSessionManager", () => {
  it("loads signed server session cookies", async () => {
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

    const tamperedCookie = `${cookieValue.slice(0, -1)}x`;
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
