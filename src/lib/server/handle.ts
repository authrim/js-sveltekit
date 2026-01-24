/**
 * SvelteKit Handle Hook for Authentication
 */

import type { Handle, RequestEvent } from '@sveltejs/kit';
import {
  createServerSessionManager,
  type ServerSessionManager,
  type ServerSessionManagerOptions,
  type ServerAuthContext,
} from './session.js';

export interface AuthHandleOptions extends ServerSessionManagerOptions {
  /**
   * Callback URL paths that should handle auth callbacks
   * Default: ['/auth/callback']
   */
  callbackPaths?: string[];
}

/**
 * Create auth handle for SvelteKit hooks
 *
 * @example
 * ```typescript
 * // src/hooks.server.ts
 * import { createAuthHandle } from '@authrim/sveltekit/server';
 *
 * export const handle = createAuthHandle();
 * ```
 */
export function createAuthHandle(options?: AuthHandleOptions): Handle {
  const sessionManager = createServerSessionManager(options);
  const callbackPaths = options?.callbackPaths ?? ['/auth/callback'];

  return async ({ event, resolve }) => {
    // Load session into locals
    const authContext = await sessionManager.get(event);
    if (authContext) {
      event.locals.auth = authContext;
    }

    // Handle auth callbacks
    if (isCallbackPath(event.url.pathname, callbackPaths)) {
      // Let the page handle the callback
      return resolve(event);
    }

    return resolve(event);
  };
}

function isCallbackPath(pathname: string, callbackPaths: string[]): boolean {
  return callbackPaths.some((path) => pathname.startsWith(path));
}

/**
 * Get session manager for use in server-side code
 */
export function getServerSessionManager(
  options?: ServerSessionManagerOptions
): ServerSessionManager {
  return createServerSessionManager(options);
}

/**
 * Get auth context from event (requires createAuthHandle to be used)
 *
 * Note: For full type safety, add this to your src/app.d.ts:
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
export function getAuthFromEvent(event: RequestEvent): ServerAuthContext | null {
  return (event.locals.auth as ServerAuthContext | undefined) ?? null;
}
