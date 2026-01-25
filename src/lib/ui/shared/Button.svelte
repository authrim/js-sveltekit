<!--
  Button Component
  Primary action component with variants and loading states
-->
<script lang="ts">
  import type { Size, Variant } from '../types.js';
  import Spinner from './Spinner.svelte';

  export let variant: Variant = 'primary';
  export let size: Size = 'md';
  export let loading = false;
  export let disabled = false;
  export let fullWidth = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  let className = '';
  export { className as class };

  $: isDisabled = disabled || loading;
</script>

<button
  {type}
  disabled={isDisabled}
  class="authrim-btn authrim-btn--{variant} authrim-btn--{size} {className}"
  class:authrim-btn--loading={loading}
  class:authrim-btn--full={fullWidth}
  on:click
  on:focus
  on:blur
  {...$$restProps}
>
  {#if loading}
    <span class="authrim-btn__spinner">
      <Spinner size={size === 'lg' ? 'md' : 'sm'} />
    </span>
  {/if}
  <span class="authrim-btn__content" class:authrim-btn__content--hidden={loading}>
    <slot />
  </span>
</button>

<style>
  .authrim-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--authrim-space-2);
    font-family: var(--authrim-font-sans);
    font-weight: 600;
    letter-spacing: var(--authrim-tracking-tight);
    border: 1.5px solid transparent;
    border-radius: var(--authrim-radius-md);
    cursor: pointer;
    white-space: nowrap;
    user-select: none;
    transition:
      background-color var(--authrim-duration-fast) var(--authrim-ease-default),
      border-color var(--authrim-duration-fast) var(--authrim-ease-default),
      color var(--authrim-duration-fast) var(--authrim-ease-default),
      box-shadow var(--authrim-duration-fast) var(--authrim-ease-default),
      transform var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-btn:focus-visible {
    outline: none;
    box-shadow: var(--authrim-shadow-focus);
  }

  .authrim-btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .authrim-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Sizes */
  .authrim-btn--sm {
    height: 34px;
    padding: 0 var(--authrim-space-3);
    font-size: var(--authrim-text-sm);
    border-radius: var(--authrim-radius-sm);
  }

  .authrim-btn--md {
    height: 42px;
    padding: 0 var(--authrim-space-5);
    font-size: var(--authrim-text-sm);
  }

  .authrim-btn--lg {
    height: 50px;
    padding: 0 var(--authrim-space-6);
    font-size: var(--authrim-text-base);
    border-radius: var(--authrim-radius-lg);
  }

  /* Primary */
  .authrim-btn--primary {
    background: linear-gradient(
      180deg,
      var(--authrim-color-primary) 0%,
      var(--authrim-color-primary-active) 100%
    );
    border-color: var(--authrim-color-primary-active);
    color: var(--authrim-color-primary-text);
    box-shadow:
      var(--authrim-shadow-sm),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .authrim-btn--primary:hover:not(:disabled) {
    background: linear-gradient(
      180deg,
      var(--authrim-color-primary-hover) 0%,
      var(--authrim-color-primary) 100%
    );
    box-shadow:
      var(--authrim-shadow-md),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }

  /* Secondary */
  .authrim-btn--secondary {
    background: var(--authrim-color-bg-subtle);
    border-color: var(--authrim-color-border);
    color: var(--authrim-color-text);
  }

  .authrim-btn--secondary:hover:not(:disabled) {
    background: var(--authrim-color-bg-muted);
    border-color: var(--authrim-color-border-strong);
  }

  /* Outline */
  .authrim-btn--outline {
    background: transparent;
    border-color: var(--authrim-color-border-strong);
    color: var(--authrim-color-text);
  }

  .authrim-btn--outline:hover:not(:disabled) {
    background: var(--authrim-color-bg-subtle);
    border-color: var(--authrim-color-text-muted);
  }

  /* Ghost */
  .authrim-btn--ghost {
    background: transparent;
    border-color: transparent;
    color: var(--authrim-color-text-secondary);
  }

  .authrim-btn--ghost:hover:not(:disabled) {
    background: var(--authrim-color-bg-subtle);
    color: var(--authrim-color-text);
  }

  /* Destructive */
  .authrim-btn--destructive {
    background: linear-gradient(
      180deg,
      var(--authrim-color-error) 0%,
      var(--authrim-color-error-hover) 100%
    );
    border-color: var(--authrim-color-error-hover);
    color: white;
    box-shadow:
      var(--authrim-shadow-sm),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .authrim-btn--destructive:hover:not(:disabled) {
    background: linear-gradient(
      180deg,
      var(--authrim-color-error-hover) 0%,
      var(--authrim-color-error) 100%
    );
  }

  .authrim-btn--destructive:focus-visible {
    box-shadow: var(--authrim-shadow-focus-error);
  }

  /* Full width */
  .authrim-btn--full {
    width: 100%;
  }

  /* Loading state */
  .authrim-btn--loading {
    cursor: wait;
  }

  .authrim-btn__spinner {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .authrim-btn__content {
    display: flex;
    align-items: center;
    gap: var(--authrim-space-2);
  }

  .authrim-btn__content--hidden {
    visibility: hidden;
  }
</style>
