<!--
  SignInButton Component

  A thin wrapper that delegates all behavior to props/events.
  Responsibilities: Call auth API and dispatch events.
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getAuthContext } from '../utils/context.js';
  import type { SocialProvider, Session, User, AuthLoadingState } from '../types.js';
  import type { AuthError } from '../stores/auth.js';

  /** Authentication method */
  export let method: 'passkey' | 'social' = 'passkey';

  /** Social provider (required when method is 'social') */
  export let provider: SocialProvider | undefined = undefined;

  /** Disabled state */
  export let disabled: boolean = false;

  /** Custom class */
  let className: string = '';
  export { className as class };

  const auth = getAuthContext();
  const dispatch = createEventDispatcher<{
    success: { session: Session; user: User };
    error: AuthError;
    loading: AuthLoadingState;
  }>();

  let loading = false;

  async function handleClick() {
    if (disabled || loading) return;

    loading = true;
    dispatch('loading', 'authenticating');

    try {
      let result;

      if (method === 'passkey') {
        result = await auth.passkey.login();
      } else if (method === 'social' && provider) {
        result = await auth.social.loginWithPopup(provider);
      } else {
        throw new Error('Invalid method or missing provider');
      }

      if (result.data) {
        dispatch('success', {
          session: result.data.session,
          user: result.data.user,
        });
      } else if (result.error) {
        dispatch('error', {
          code: result.error.code,
          message: result.error.message,
        });
      }
    } catch (error) {
      dispatch('error', {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
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
      Signing in...
    {:else if method === 'passkey'}
      Sign in with Passkey
    {:else if method === 'social' && provider}
      Sign in with {provider.charAt(0).toUpperCase() + provider.slice(1)}
    {:else}
      Sign In
    {/if}
  </slot>
</button>
