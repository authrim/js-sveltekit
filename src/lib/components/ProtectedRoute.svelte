<!--
  ProtectedRoute Component

  Shows content only when user is authenticated.
  Redirects or shows fallback when not authenticated.
-->
<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { getAuthContext } from '../utils/context.js';

  /** Redirect URL for unauthenticated users (if not provided, shows fallback) */
  export let redirectTo: string | undefined = undefined;

  /** Include current path in redirect URL */
  export let includeReturnPath: boolean = true;

  /** Return path parameter name */
  export let returnPathParam: string = 'redirectTo';

  /** Custom class */
  let className: string = '';
  export { className as class };

  const auth = getAuthContext();
  const { isAuthenticated, loadingState } = auth.stores;

  // State machine: 'loading' -> 'ready'
  // Prevents race condition where redirect happens before session check completes
  let state: 'loading' | 'ready' = 'loading';

  onMount(async () => {
    try {
      // Check session on mount
      await auth.session.get();
    } catch (error) {
      console.warn('[Authrim] Failed to check session:', error);
    } finally {
      // Wait for stores to update before changing state
      await tick();
      state = 'ready';
    }
  });

  // Only perform redirect when:
  // 1. Component has finished initialization (state === 'ready')
  // 2. User is not authenticated
  // 3. No async operation is in progress (loadingState === 'idle')
  // 4. A redirect URL is configured
  $: if (state === 'ready' && !$isAuthenticated && $loadingState === 'idle' && redirectTo) {
    const url = new URL(redirectTo, window.location.origin);
    if (includeReturnPath) {
      url.searchParams.set(returnPathParam, window.location.pathname + window.location.search);
    }
    goto(url.toString());
  }
</script>

{#if state === 'loading' || $loadingState === 'initializing'}
  <slot name="loading">
    <div class={className} {...$$restProps}>Loading...</div>
  </slot>
{:else if $isAuthenticated}
  <slot />
{:else if !redirectTo}
  <slot name="unauthenticated">
    <div class={className} {...$$restProps}>
      <p>You must be signed in to view this content.</p>
    </div>
  </slot>
{/if}
