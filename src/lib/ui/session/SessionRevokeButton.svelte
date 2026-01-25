<!--
  SessionRevokeButton Component
  Button to revoke a session
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Spinner from '../shared/Spinner.svelte';

  export let sessionId: string;
  export let loading = false;
  let className = '';
  export { className as class };

  const dispatch = createEventDispatcher<{ click: void }>();
</script>

<button
  type="button"
  class="authrim-session-revoke {className}"
  disabled={loading}
  on:click={() => dispatch('click')}
  aria-label="Revoke session"
  {...$$restProps}
>
  {#if loading}
    <Spinner size="sm" />
  {:else}
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
    </svg>
  {/if}
</button>

<style>
  .authrim-session-revoke {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: var(--authrim-radius-sm);
    color: var(--authrim-color-text-muted);
    cursor: pointer;
    transition:
      color var(--authrim-duration-fast) var(--authrim-ease-default),
      background-color var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-session-revoke:hover:not(:disabled) {
    color: var(--authrim-color-error);
    background: var(--authrim-color-error-subtle);
  }

  .authrim-session-revoke:focus-visible {
    outline: none;
    box-shadow: var(--authrim-shadow-focus-error);
  }

  .authrim-session-revoke:disabled {
    cursor: wait;
  }

  .authrim-session-revoke svg {
    width: 18px;
    height: 18px;
  }
</style>
