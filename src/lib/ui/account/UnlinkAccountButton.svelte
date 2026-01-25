<!--
  UnlinkAccountButton Component
  Button to unlink a social account with confirmation
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SocialProvider } from '../../types.js';
  import Spinner from '../shared/Spinner.svelte';

  export let accountId: string;
  export let provider: SocialProvider;
  export let loading = false;
  let className = '';
  export { className as class };

  const dispatch = createEventDispatcher<{
    click: void;
    confirm: void;
  }>();

  let showConfirm = false;

  function handleClick() {
    if (loading) return;
    dispatch('click');
    showConfirm = true;
  }

  function handleConfirm() {
    if (loading) return;
    dispatch('confirm');
  }

  function handleCancel() {
    showConfirm = false;
  }
</script>

<div class="authrim-unlink {className}">
  {#if showConfirm}
    <div class="authrim-unlink__confirm">
      <span class="authrim-unlink__confirm-text">Unlink?</span>
      <button
        type="button"
        class="authrim-unlink__action authrim-unlink__action--confirm"
        disabled={loading}
        on:click={handleConfirm}
      >
        {#if loading}
          <Spinner size="sm" />
        {:else}
          Yes
        {/if}
      </button>
      <button
        type="button"
        class="authrim-unlink__action authrim-unlink__action--cancel"
        disabled={loading}
        on:click={handleCancel}
      >
        No
      </button>
    </div>
  {:else}
    <button
      type="button"
      class="authrim-unlink__btn"
      disabled={loading}
      on:click={handleClick}
      aria-label="Unlink account"
    >
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z"/>
      </svg>
    </button>
  {/if}
</div>

<style>
  .authrim-unlink {
    flex-shrink: 0;
  }

  .authrim-unlink__btn {
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

  .authrim-unlink__btn:hover:not(:disabled) {
    color: var(--authrim-color-warning-text);
    background: var(--authrim-color-warning-subtle);
  }

  .authrim-unlink__btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--authrim-color-warning-subtle);
  }

  .authrim-unlink__btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .authrim-unlink__btn svg {
    width: 18px;
    height: 18px;
  }

  .authrim-unlink__confirm {
    display: flex;
    align-items: center;
    gap: var(--authrim-space-2);
    animation: fade-in var(--authrim-duration-fast) var(--authrim-ease-out);
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .authrim-unlink__confirm-text {
    font-size: var(--authrim-text-xs);
    font-weight: 500;
    color: var(--authrim-color-text-secondary);
  }

  .authrim-unlink__action {
    padding: var(--authrim-space-1) var(--authrim-space-2);
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-xs);
    font-weight: 500;
    border: none;
    border-radius: var(--authrim-radius-sm);
    cursor: pointer;
    transition:
      background-color var(--authrim-duration-fast) var(--authrim-ease-default),
      transform var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-unlink__action:active:not(:disabled) {
    transform: scale(0.95);
  }

  .authrim-unlink__action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .authrim-unlink__action--confirm {
    background: var(--authrim-color-warning);
    color: white;
    min-width: 40px;
  }

  .authrim-unlink__action--confirm:hover:not(:disabled) {
    background: var(--authrim-color-warning-hover);
  }

  .authrim-unlink__action--cancel {
    background: var(--authrim-color-bg-subtle);
    color: var(--authrim-color-text-secondary);
  }

  .authrim-unlink__action--cancel:hover:not(:disabled) {
    background: var(--authrim-color-bg-muted);
  }
</style>
