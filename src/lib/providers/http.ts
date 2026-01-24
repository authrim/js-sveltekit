/**
 * Browser HTTP Client
 *
 * P0: credentials デフォルトは 'omit' - 必要な場合のみ 'include' を明示指定
 * P0: 機密データのログ出力をマスキング
 */

import type { HttpClient, HttpOptions, HttpResponse } from '@authrim/core';
import { sanitizeJsonForLogging } from '../utils/sensitive-data.js';

export interface BrowserHttpClientOptions {
  /**
   * Default credentials mode
   * P0: デフォルトは 'omit' - Cookie を送信しない
   */
  credentials?: RequestCredentials;
  /** Default timeout in ms (default: 30000) */
  timeout?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

export interface BrowserHttpOptions extends HttpOptions {
  credentials?: RequestCredentials;
}

export class BrowserHttpClient implements HttpClient {
  private readonly defaultCredentials: RequestCredentials;
  private readonly defaultTimeout: number;
  private readonly debug: boolean;

  constructor(options?: BrowserHttpClientOptions) {
    this.defaultCredentials = options?.credentials ?? 'omit';
    this.defaultTimeout = options?.timeout ?? 30000;
    this.debug = options?.debug ?? false;
  }

  private debugLog(message: string, data?: unknown): void {
    if (!this.debug) return;

    if (data) {
      const sanitized =
        typeof data === 'string' ? sanitizeJsonForLogging(data) : JSON.stringify(data);
      console.debug(`[Authrim HTTP] ${message}`, sanitized);
    } else {
      console.debug(`[Authrim HTTP] ${message}`);
    }
  }

  async fetch<T = unknown>(url: string, options?: BrowserHttpOptions): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeout = options?.timeout ?? this.defaultTimeout;

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    this.debugLog(`${options?.method ?? 'GET'} ${url}`, options?.body);

    try {
      const response = await globalThis.fetch(url, {
        method: options?.method ?? 'GET',
        headers: options?.headers,
        body: options?.body,
        signal: options?.signal ?? controller.signal,
        credentials: options?.credentials ?? this.defaultCredentials,
      });

      const contentType = response.headers.get('content-type') ?? '';
      let data: T;

      if (contentType.includes('application/json')) {
        data = (await response.json()) as T;
      } else {
        data = (await response.text()) as T;
      }

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        status: response.status,
        statusText: response.statusText,
        headers,
        data,
        ok: response.ok,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
