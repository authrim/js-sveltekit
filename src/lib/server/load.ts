/**
 * SvelteKit Load Helpers for Authentication
 *
 * For full type safety, add this to your src/app.d.ts:
 * ```typescript
 * import type { ServerAuthContext } from '@authrim/sveltekit/server';
 *
 * declare global {
 *   namespace App {
 *     interface Locals {
 *       auth?: ServerAuthContext;
 *     }
 *   }
 * }
 * ```
 */

import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { ServerAuthContext } from './session.js';

export interface AuthLoadOptions {
  /**
   * Redirect URL for unauthenticated users
   * Default: '/login'
   */
  loginUrl?: string;
  /**
   * URL parameter to store the original URL
   * Default: 'redirectTo'
   */
  redirectParam?: string;
}

/**
 * Create auth load helper for protected routes
 *
 * @example
 * ```typescript
 * // src/routes/dashboard/+page.server.ts
 * import { requireAuth } from '@authrim/sveltekit/server';
 *
 * export const load = requireAuth();
 * ```
 */
export function requireAuth(options?: AuthLoadOptions) {
  const loginUrl = options?.loginUrl ?? '/login';
  const redirectParam = options?.redirectParam ?? 'redirectTo';

  return async ({ locals, url }: RequestEvent) => {
    const auth = locals.auth as ServerAuthContext | undefined;

    if (!auth) {
      const redirectUrl = new URL(loginUrl, url.origin);
      redirectUrl.searchParams.set(redirectParam, url.pathname + url.search);
      throw redirect(302, redirectUrl.toString());
    }

    return {
      auth,
    };
  };
}

/**
 * Create auth load helper that passes auth data without requiring it
 *
 * @example
 * ```typescript
 * // src/routes/+layout.server.ts
 * import { createAuthLoad } from '@authrim/sveltekit/server';
 *
 * export const load = createAuthLoad();
 * ```
 */
export function createAuthLoad() {
  return async ({ locals }: RequestEvent) => {
    const auth = locals.auth as ServerAuthContext | undefined;

    return {
      auth: auth ?? null,
    };
  };
}

/**
 * Check if user is authenticated in server-side code
 *
 * @param locals - App.Locals from SvelteKit (requires auth?: ServerAuthContext in app.d.ts)
 */
export function isAuthenticated(locals: { auth?: ServerAuthContext }): boolean {
  return locals.auth !== undefined && locals.auth !== null;
}

/**
 * Get user from locals
 *
 * @param locals - App.Locals from SvelteKit (requires auth?: ServerAuthContext in app.d.ts)
 */
export function getUser(locals: { auth?: ServerAuthContext }) {
  return locals.auth?.user ?? null;
}

/**
 * Get session from locals
 *
 * @param locals - App.Locals from SvelteKit (requires auth?: ServerAuthContext in app.d.ts)
 */
export function getSession(locals: { auth?: ServerAuthContext }) {
  return locals.auth?.session ?? null;
}
