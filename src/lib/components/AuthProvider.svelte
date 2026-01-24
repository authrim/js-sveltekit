<!--
  AuthProvider Component

  Responsibilities (strictly limited):
  - Wire auth instance into Svelte context
  - Sync initial session from SSR (synchronously to avoid hydration mismatch)

  It must NOT implement business logic.
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { setAuthContext } from '../utils/context.js';
  import type { AuthrimClient } from '../types.js';
  import type { Session, User } from '@authrim/core';

  /** Authrim client instance */
  export let auth: AuthrimClient;

  /** Initial session from SSR (optional) */
  export let initialSession: Session | null = null;

  /** Initial user from SSR (optional) */
  export let initialUser: User | null = null;

  // Set auth context for child components
  setAuthContext(auth);

  // Sync initial session from SSR synchronously to avoid hydration mismatch
  // This must happen before the first render
  if (initialSession && initialUser) {
    auth._syncFromSSR(initialSession, initialUser);
  }

  // Optionally validate session in the background after hydration
  onMount(() => {
    if (initialSession && initialUser) {
      // Session already synced above, optionally revalidate in background
      // This ensures the session is still valid on the server
      auth.session.get().catch((error) => {
        console.warn('[Authrim] Failed to revalidate session:', error);
      });
    } else if (!initialSession && !initialUser) {
      // No SSR session provided, check if there's a session in storage
      auth.session.get().catch((error) => {
        console.warn('[Authrim] Failed to fetch session:', error);
      });
    }
  });

  // Cleanup on destroy
  onDestroy(() => {
    auth.destroy();
  });
</script>

<slot />
