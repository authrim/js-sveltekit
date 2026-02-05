/**
 * Smart Handoff SSO Handler for SvelteKit
 *
 * Handles handoff token verification and session management for cross-domain SSO
 * in SvelteKit server-side code.
 */

import type { Handle, RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import type { Session, User } from '@authrim/core';
import {
  createServerSessionManager,
  type ServerSessionManager,
  type ServerAuthContext,
  type ServerSessionManagerOptions,
} from './session.js';

/**
 * Handoff verification options
 */
export interface HandoffVerifyOptions {
  /**
   * Authrim IdP URL (required if not using createAuthHandle)
   */
  issuer?: string;

  /**
   * OAuth client ID (required if not using createAuthHandle)
   */
  clientId?: string;

  /**
   * Handoff verify endpoint
   * @default '/auth/external/handoff/verify'
   */
  verifyEndpoint?: string;

  /**
   * Error redirect path
   * @default '/login'
   */
  errorRedirect?: string;

  /**
   * Session manager options
   */
  sessionOptions?: ServerSessionManagerOptions;
}

/**
 * Handoff verification response from server
 */
interface HandoffVerifyResponse {
  token_type: 'Bearer';
  access_token: string;
  expires_in: number;
  session: {
    id: string;
    userId: string;
    createdAt: string;
    expiresAt: string;
  };
  user: {
    id: string;
    email: string | null;
    name: string | null;
    emailVerified: boolean;
  };
}

/**
 * Get auth config from options or event.locals
 */
function getAuthConfig(
  event: RequestEvent,
  options?: HandoffVerifyOptions
): {
  issuer: string;
  clientId: string;
} {
  // Try to get from options first
  if (options?.issuer && options?.clientId) {
    return { issuer: options.issuer, clientId: options.clientId };
  }

  // Fallback to event.locals (set by createAuthHandle)
  const issuer = (event.locals as any).authrim_issuer as string | undefined;
  const clientId = (event.locals as any).authrim_client_id as string | undefined;

  if (!issuer || !clientId) {
    throw new Error(
      'Authrim config not found. Please provide issuer and clientId in options, or use createAuthHandle.'
    );
  }

  return { issuer, clientId };
}

/**
 * Verify handoff token from callback URL
 *
 * Usage in +page.server.ts:
 * ```typescript
 * export const load = async (event) => {
 *   const result = await verifyHandoffToken(event);
 *   if (!result.success) {
 *     throw redirect(302, '/login');
 *   }
 *   return { session: result.session, user: result.user };
 * };
 * ```
 */
export async function verifyHandoffToken(
  event: RequestEvent,
  options?: HandoffVerifyOptions
): Promise<
  | { success: true; session: Session; user: User }
  | { success: false; error: string }
> {
  const { url } = event;
  const handoffToken = url.searchParams.get('handoff_token');
  const state = url.searchParams.get('state');

  if (!handoffToken || !state) {
    return { success: false, error: 'Missing handoff token or state' };
  }

  try {
    const { issuer, clientId } = getAuthConfig(event, options);
    const verifyEndpoint =
      options?.verifyEndpoint || '/auth/external/handoff/verify';

    const response = await fetch(`${issuer}${verifyEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handoff_token: handoffToken,
        state: state,
        client_id: clientId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.error_description || 'Handoff verification failed',
      };
    }

    const data: HandoffVerifyResponse = await response.json();

    // Save session to cookie
    const sessionManager = createServerSessionManager(options?.sessionOptions);
    const authContext: ServerAuthContext = {
      session: {
        id: data.session.id,
        userId: data.session.userId,
        createdAt: data.session.createdAt,
        expiresAt: data.session.expiresAt,
      },
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        emailVerified: data.user.emailVerified,
      },
    };
    sessionManager.set(event, authContext);

    return {
      success: true,
      session: authContext.session,
      user: authContext.user,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create handoff handler for SvelteKit hooks
 *
 * Usage in hooks.server.ts:
 * ```typescript
 * import { sequence } from '@sveltejs/kit/hooks';
 * import { createAuthHandle, createHandoffHandler } from '@authrim/sveltekit/server';
 *
 * export const handle = sequence(
 *   createAuthHandle({
 *     issuer: env.AUTHRIM_ISSUER,
 *     clientId: env.AUTHRIM_CLIENT_ID,
 *   }),
 *   createHandoffHandler()
 * );
 * ```
 */
export function createHandoffHandler(options?: HandoffVerifyOptions): Handle {
  return async ({ event, resolve }) => {
    // Check if this is a handoff callback
    const { url } = event;
    if (url.searchParams.has('handoff_token')) {
      const result = await verifyHandoffToken(event, options);

      if (!result.success) {
        const errorRedirect = options?.errorRedirect || '/login';
        // Use 303 See Other (POST → GET redirect, safer than 302)
        throw redirect(303, errorRedirect);
      }

      // Remove handoff token from URL
      const cleanUrl = new URL(url);
      cleanUrl.searchParams.delete('handoff_token');
      cleanUrl.searchParams.delete('state');

      // Use 303 See Other (認証後のリダイレクトに適切)
      throw redirect(303, cleanUrl.toString());
    }

    return resolve(event);
  };
}
