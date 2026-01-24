/**
 * Browser Crypto Provider
 *
 * Web Crypto API を使用したプラットフォーム実装
 */

import type { CryptoProvider } from '@authrim/core';
import { base64urlEncode } from '@authrim/core';

export class BrowserCryptoProvider implements CryptoProvider {
  async randomBytes(length: number): Promise<Uint8Array> {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
  }

  async sha256(data: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(data);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return new Uint8Array(hash);
  }

  async generateCodeVerifier(): Promise<string> {
    const bytes = await this.randomBytes(32);
    return base64urlEncode(bytes);
  }

  async generateCodeChallenge(verifier: string): Promise<string> {
    const hash = await this.sha256(verifier);
    return base64urlEncode(hash);
  }
}
