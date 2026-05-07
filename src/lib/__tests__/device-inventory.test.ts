import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthrim } from "../client.js";
import { BrowserCryptoProvider } from "../providers/crypto.js";

describe("device inventory namespace", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        ok: true,
        device_unlink_result: {
          action: "device_unlinked",
          target_id: "inst-current",
          signed_out_required: true,
          status: "completed",
        },
      }),
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("clears the scoped DPoP key when unlinking the current device", async () => {
    const clearSpy = vi
      .spyOn(BrowserCryptoProvider.prototype, "clearDPoPKeyPair")
      .mockResolvedValue(undefined);

    const auth = await createAuthrim({
      issuer: "https://auth.example.com",
      clientId: "test-client-id",
    });

    const result = await auth.devices.unlink("inst-current", {
      accessToken: "access-token",
    });

    expect(result.device_unlink_result.signed_out_required).toBe(true);
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://auth.example.com/me/devices/inst-current",
      expect.objectContaining({
        method: "DELETE",
        headers: {
          Authorization: "Bearer access-token",
        },
      }),
    );
  });
});
