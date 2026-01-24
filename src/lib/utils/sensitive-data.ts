/**
 * Sensitive Data Handling Utilities
 *
 * センシティブ情報のログ出力時マスキング
 */

const SENSITIVE_FIELDS = new Set([
  'code_verifier',
  'codeVerifier',
  'code',
  'auth_code',
  'authCode',
  'token',
  'access_token',
  'accessToken',
  'refresh_token',
  'refreshToken',
  'id_token',
  'idToken',
  'secret',
  'password',
  'credential',
  'private_key',
  'privateKey',
]);

export function maskValue(value: string, visibleChars = 4): string {
  if (!value || value.length <= visibleChars * 2) {
    return '***';
  }
  const start = value.slice(0, visibleChars);
  const end = value.slice(-visibleChars);
  return `${start}...${end}`;
}

export function sanitizeForLogging<T extends Record<string, unknown>>(
  obj: T,
  additionalFields?: string[]
): T {
  const fieldsToMask = new Set([...SENSITIVE_FIELDS, ...(additionalFields || [])]);
  const sanitized = { ...obj };

  for (const key of Object.keys(sanitized)) {
    const value = sanitized[key];

    if (fieldsToMask.has(key) && typeof value === 'string') {
      (sanitized as Record<string, unknown>)[key] = maskValue(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = sanitizeForLogging(
        value as Record<string, unknown>,
        additionalFields
      );
    }
  }

  return sanitized;
}

export function sanitizeJsonForLogging(jsonString: string, additionalFields?: string[]): string {
  try {
    const parsed = JSON.parse(jsonString);
    const sanitized = sanitizeForLogging(parsed, additionalFields);
    return JSON.stringify(sanitized);
  } catch {
    return maskValue(jsonString, 10);
  }
}
