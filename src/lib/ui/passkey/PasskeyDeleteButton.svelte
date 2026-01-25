<!--
  PasskeyDeleteButton Component
  Button to delete a passkey with confirmation
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Spinner from '../shared/Spinner.svelte';

  export let credentialId: string;
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

<div class="authrim-passkey-delete {className}">
  {#if showConfirm}
    <div class="authrim-passkey-delete__confirm">
      <span class="authrim-passkey-delete__confirm-text">Delete?</span>
      <button
        type="button"
        class="authrim-passkey-delete__action authrim-passkey-delete__action--confirm"
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
        class="authrim-passkey-delete__action authrim-passkey-delete__action--cancel"
        disabled={loading}
        on:click={handleCancel}
      >
        No
      </button>
    </div>
  {:else}
    <button
      type="button"
      class="authrim-passkey-delete__btn"
      disabled={loading}
      on:click={handleClick}
      aria-label="Delete passkey"
    >
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd"/>
      </svg>
    </button>
  {/if}
</div>

<style>
  .authrim-passkey-delete {
    flex-shrink: 0;
  }

  .authrim-passkey-delete__btn {
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

  .authrim-passkey-delete__btn:hover:not(:disabled) {
    color: var(--authrim-color-error);
    background: var(--authrim-color-error-subtle);
  }

  .authrim-passkey-delete__btn:focus-visible {
    outline: none;
    box-shadow: var(--authrim-shadow-focus-error);
  }

  .authrim-passkey-delete__btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .authrim-passkey-delete__btn svg {
    width: 18px;
    height: 18px;
  }

  .authrim-passkey-delete__confirm {
    display: flex;
    align-items: center;
    gap: var(--authrim-space-2);
    animation: fade-in var(--authrim-duration-fast) var(--authrim-ease-out);
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .authrim-passkey-delete__confirm-text {
    font-size: var(--authrim-text-xs);
    font-weight: 500;
    color: var(--authrim-color-text-secondary);
  }

  .authrim-passkey-delete__action {
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

  .authrim-passkey-delete__action:active:not(:disabled) {
    transform: scale(0.95);
  }

  .authrim-passkey-delete__action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .authrim-passkey-delete__action--confirm {
    background: var(--authrim-color-error);
    color: white;
    min-width: 40px;
  }

  .authrim-passkey-delete__action--confirm:hover:not(:disabled) {
    background: var(--authrim-color-error-hover);
  }

  .authrim-passkey-delete__action--cancel {
    background: var(--authrim-color-bg-subtle);
    color: var(--authrim-color-text-secondary);
  }

  .authrim-passkey-delete__action--cancel:hover:not(:disabled) {
    background: var(--authrim-color-bg-muted);
  }
</style>
