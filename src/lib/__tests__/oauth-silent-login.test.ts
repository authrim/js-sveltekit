import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthrimClient as CoreClient } from "@authrim/core";
import { base64urlToString } from "@authrim/core";
import { createOAuthNamespace } from "../oauth/index.js";

describe("SvelteKit OAuth silent login", () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    Object.defineProperty(window, "location", {
      value: {
        href: "https://app.example.com/",
        origin: "https://app.example.com",
        pathname: "/",
        search: "",
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it("uses top-level prompt=none handoff navigation with encoded same-origin return state", async () => {
    const coreClient = {
      buildAuthorizationUrl: vi.fn().mockResolvedValue({
        url: "https://auth.example.com/authorize?client_id=client-id&response_type=code&prompt=none",
      }),
    } as unknown as CoreClient;
    const oauth = createOAuthNamespace(coreClient, {});

    await expect(
      oauth.trySilentLogin({
        returnTo: "https://app.example.com/dashboard",
        onLoginRequired: "login",
      }),
    ).rejects.toThrow("unreachable");

    const redirectUrl = new URL(window.location.href);
    expect(redirectUrl.origin).toBe("https://auth.example.com");
    expect(redirectUrl.pathname).toBe("/authorize");
    expect(redirectUrl.searchParams.get("prompt")).toBe("none");
    expect(redirectUrl.searchParams.get("handoff")).toBe("true");

    const state = redirectUrl.searchParams.get("state");
    expect(state).toBeTruthy();
    expect(JSON.parse(base64urlToString(state!))).toEqual({
      t: "sl",
      lr: "l",
      rt: "https://app.example.com/dashboard",
    });
    expect(coreClient.buildAuthorizationUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectUri: "https://app.example.com/callback.html",
        prompt: "none",
        exposeState: false,
      }),
    );
  });

  it("passes typed OIDC authorization parameters through to the core SDK", async () => {
    const coreClient = {
      buildAuthorizationUrl: vi.fn().mockResolvedValue({
        url: "https://auth.example.com/authorize?client_id=client-id&response_type=code",
        state: "state-123",
        nonce: "nonce-123",
      }),
    } as unknown as CoreClient;
    const oauth = createOAuthNamespace(coreClient, {});

    const result = await oauth.buildAuthorizationUrl({
      redirectUri: "https://app.example.com/callback",
      scopes: ["openid", "profile"],
      prompt: "login",
      loginHint: "user@example.com",
      maxAge: 300,
      acrValues: "urn:authrim:acr:mfa",
    });

    expect(result).toEqual({
      url: "https://auth.example.com/authorize?client_id=client-id&response_type=code",
      state: "state-123",
      nonce: "nonce-123",
    });
    expect(coreClient.buildAuthorizationUrl).toHaveBeenCalledWith({
      redirectUri: "https://app.example.com/callback",
      scope: "openid profile",
      prompt: "login",
      loginHint: "user@example.com",
      maxAge: 300,
      acrValues: "urn:authrim:acr:mfa",
      exposeState: true,
    });
  });
});
