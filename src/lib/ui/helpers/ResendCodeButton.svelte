<!--
  ResendCodeButton Component
  Button to resend verification code with countdown
-->
<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';

  export let disabled = false;
  export let remainingTime = 0;
  export let text = 'Resend code';
  export let loading = false;
  let className = '';
  export { className as class };

  const dispatch = createEventDispatcher<{ click: void }>();

  let displayTime = remainingTime;
  let interval: ReturnType<typeof setInterval> | null = null;

  // Reactive statement: Restart countdown when remainingTime prop changes from parent.
  // This allows parent to reset the countdown (e.g., after successful resend).
  // We always stop existing countdown first to prevent timer leaks.
  $: {
    stopCountdown();
    displayTime = remainingTime;
    if (remainingTime > 0) {
      startCountdown();
    }
  }

  function startCountdown() {
    interval = setInterval(() => {
      displayTime -= 1;
      if (displayTime <= 0) stopCountdown();
    }, 1000);
  }

  function stopCountdown() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  function handleClick() {
    if (!disabled && displayTime <= 0 && !loading) {
      dispatch('click');
    }
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
  }

  onDestroy(stopCountdown);
</script>

<button
  type="button"
  class="authrim-resend {className}"
  class:authrim-resend--loading={loading}
  disabled={disabled || displayTime > 0 || loading}
  on:click={handleClick}
  {...$$restProps}
>
  {#if loading}
    <span class="authrim-resend__spinner"></span>
  {/if}
  <span class="authrim-resend__text" class:authrim-resend__text--hidden={loading}>
    {#if displayTime > 0}
      {text} ({formatTime(displayTime)})
    {:else}
      {text}
    {/if}
  </span>
</button>

<style>
  .authrim-resend {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--authrim-space-2);
    padding: var(--authrim-space-2) var(--authrim-space-3);
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    font-weight: 500;
    color: var(--authrim-color-primary);
    background: transparent;
    border: none;
    border-radius: var(--authrim-radius-sm);
    cursor: pointer;
    transition:
      color var(--authrim-duration-fast) var(--authrim-ease-default),
      background-color var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-resend:hover:not(:disabled) {
    background: var(--authrim-color-primary-subtle);
  }

  .authrim-resend:focus-visible {
    outline: none;
    box-shadow: var(--authrim-shadow-focus);
  }

  .authrim-resend:disabled {
    color: var(--authrim-color-text-muted);
    cursor: not-allowed;
  }

  .authrim-resend:disabled:not(.authrim-resend--loading) {
    opacity: 0.7;
  }

  .authrim-resend__spinner {
    position: absolute;
    width: 16px;
    height: 16px;
    border: 2px solid var(--authrim-color-primary-subtle);
    border-top-color: var(--authrim-color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .authrim-resend__text {
    transition: opacity var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-resend__text--hidden {
    opacity: 0;
  }
</style>
