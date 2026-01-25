<!--
  AuthLoading Component
  Loading indicator with optional message and refined animation
-->
<script lang="ts">
  import type { Size } from '../types.js';
  import Spinner from '../shared/Spinner.svelte';

  export let message = '';
  export let size: Size = 'md';
  let className = '';
  export { className as class };
</script>

<div
  class="authrim-loading authrim-loading--{size} {className}"
  role="status"
  aria-live="polite"
  {...$$restProps}
>
  <div class="authrim-loading__spinner">
    <Spinner {size} />
  </div>
  {#if message}
    <p class="authrim-loading__message">{message}</p>
  {/if}
  <span class="authrim-sr-only">Loading</span>
</div>

<style>
  .authrim-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--authrim-space-4);
    padding: var(--authrim-space-6);
    animation: fade-in var(--authrim-duration-normal) var(--authrim-ease-out);
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .authrim-loading--sm {
    gap: var(--authrim-space-3);
    padding: var(--authrim-space-4);
  }

  .authrim-loading--lg {
    gap: var(--authrim-space-5);
    padding: var(--authrim-space-8);
  }

  .authrim-loading__spinner {
    color: var(--authrim-color-primary);
  }

  .authrim-loading__message {
    margin: 0;
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-secondary);
    text-align: center;
    letter-spacing: var(--authrim-tracking-tight);
  }

  .authrim-loading--lg .authrim-loading__message {
    font-size: var(--authrim-text-base);
  }

  .authrim-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
