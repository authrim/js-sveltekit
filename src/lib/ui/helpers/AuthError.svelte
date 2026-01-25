<!--
  AuthError Component
  Error message display with dismiss capability
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let message: string;
  export let dismissible = true;
  let className = '';
  export { className as class };

  const dispatch = createEventDispatcher<{ dismiss: void }>();
</script>

<div
  class="authrim-error {className}"
  role="alert"
  aria-live="assertive"
  {...$$restProps}
>
  <div class="authrim-error__icon">
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
    </svg>
  </div>

  <p class="authrim-error__message">{message}</p>

  {#if dismissible}
    <button
      type="button"
      class="authrim-error__dismiss"
      on:click={() => dispatch('dismiss')}
      aria-label="Dismiss error"
    >
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
      </svg>
    </button>
  {/if}
</div>

<style>
  .authrim-error {
    display: flex;
    align-items: flex-start;
    gap: var(--authrim-space-3);
    padding: var(--authrim-space-4);
    background: var(--authrim-color-error-subtle);
    border: 1.5px solid var(--authrim-color-error);
    border-radius: var(--authrim-radius-md);
    animation: slide-up var(--authrim-duration-normal) var(--authrim-ease-bounce);
  }

  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .authrim-error__icon {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    color: var(--authrim-color-error);
  }

  .authrim-error__icon svg {
    width: 100%;
    height: 100%;
  }

  .authrim-error__message {
    flex: 1;
    margin: 0;
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-error-text);
    line-height: var(--authrim-leading-snug);
    letter-spacing: var(--authrim-tracking-tight);
  }

  .authrim-error__dismiss {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    margin: -2px -4px -2px 0;
    background: transparent;
    border: none;
    border-radius: var(--authrim-radius-sm);
    color: var(--authrim-color-error-text);
    cursor: pointer;
    transition:
      background-color var(--authrim-duration-fast) var(--authrim-ease-default),
      transform var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-error__dismiss:hover {
    background: rgba(225, 29, 72, 0.15);
  }

  .authrim-error__dismiss:active {
    transform: scale(0.9);
  }

  .authrim-error__dismiss:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--authrim-color-error);
  }

  .authrim-error__dismiss svg {
    width: 16px;
    height: 16px;
  }
</style>
