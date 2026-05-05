import { describe, expect, it } from "vitest";
import { sanitizeForLogging, sanitizeJsonForLogging } from "../utils/sensitive-data.js";

describe("sensitive-data", () => {
  it("masks Native SSO device_secret fields", () => {
    const result = sanitizeForLogging({
      device_secret: "device-secret-12345678901234567890",
      actor_token: "actor-token-12345678901234567890",
      subject_token: "subject-token-12345678901234567890",
      status: "active",
    });

    expect(result.device_secret).toBe("devi...7890");
    expect(result.actor_token).toBe("acto...7890");
    expect(result.subject_token).toBe("subj...7890");
    expect(result.status).toBe("active");
  });

  it("masks Native SSO device_secret fields in JSON debug payloads", () => {
    const result = sanitizeJsonForLogging(
      JSON.stringify({
        deviceSecret: "device-secret-12345678901234567890",
      }),
    );

    expect(JSON.parse(result).deviceSecret).toBe("devi...7890");
  });
});
