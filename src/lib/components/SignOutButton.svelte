<!--
  SignOutButton Component

  A thin wrapper that delegates all behavior to props/events.
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getAuthContext } from '../utils/context.js';
  import type { AuthLoadingState } from '../types.js';
  import type { AuthError } from '../stores/auth.js';

  /** Redirect URI after sign out */
  export let redirectUri: string | undefined = undefined;

  /** Revoke tokens on sign out */
  export let revokeTokens: boolean = false;

  /** Disabled state */
  export let disabled: boolean = false;

  /** Custom class */
  let className: string = '';
  export { className as class };

  const auth = getAuthContext();
  const dispatch = createEventDispatcher<{
    success: void;
    error: AuthError;
    loading: AuthLoadingState;
  }>();

  let loading = false;

  async function handleClick() {
    if (disabled || loading) return;

    loading = true;
    dispatch('loading', 'signing_out');

    try {
      await auth.signOut({
        redirectUri,
        revokeTokens,
      });
      dispatch('success');
    } catch (error) {
      dispatch('error', {
        code: 'SIGN_OUT_ERROR',
        message: error instanceof Error ? error.message : 'Sign out failed',
      });
    } finally {
      loading = false;
      dispatch('loading', 'idle');
    }
  }
</script>

<button
  type="button"
  on:click={handleClick}
  disabled={disabled || loading}
  class={className}
  {...$$restProps}
>
  <slot>
    {#if loading}
      Signing out...
    {:else}
      Sign Out
    {/if}
  </slot>
</button>
