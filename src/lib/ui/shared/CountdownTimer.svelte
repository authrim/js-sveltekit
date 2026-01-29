<!--
  CountdownTimer Component
  Displays remaining time with automatic countdown
  Used in Device Flow and CIBA screens for expiry indication
-->
<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import type { Size } from "../types.js";

  /** Unix timestamp (seconds) when the countdown expires */
  export let expiresAt: number;
  /** Display size */
  export let size: Size = "md";
  /** Show icon alongside the timer */
  export let showIcon = true;
  /** Warning threshold in seconds — timer turns orange */
  export let warnAt = 60;
  /** Critical threshold in seconds — timer turns red */
  export let criticalAt = 15;
  let className = "";
  export { className as class };

  const dispatch = createEventDispatcher<{ expired: void }>();

  let remaining = 0;
  let intervalId: ReturnType<typeof setInterval> | undefined;

  function tick() {
    const now = Math.floor(Date.now() / 1000);
    remaining = Math.max(0, expiresAt - now);
    if (remaining <= 0) {
      clearInterval(intervalId);
      dispatch("expired");
    }
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  $: status =
    remaining <= criticalAt
      ? "critical"
      : remaining <= warnAt
        ? "warn"
        : "normal";

  onMount(() => {
    tick();
    intervalId = setInterval(tick, 1000);
  });

  onDestroy(() => {
    clearInterval(intervalId);
  });
</script>

<div
  class="authrim-countdown authrim-countdown--{size} authrim-countdown--{status} {className}"
  role="timer"
  aria-live="polite"
  aria-label="Time remaining: {formatTime(remaining)}"
  {...$$restProps}
>
  {#if showIcon}
    <svg
      class="authrim-countdown__icon"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fill-rule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
        clip-rule="evenodd"
      />
    </svg>
  {/if}
  <span class="authrim-countdown__time">{formatTime(remaining)}</span>
</div>

<style>
  .authrim-countdown {
    display: inline-flex;
    align-items: center;
    gap: var(--authrim-space-1);
    font-family: var(--authrim-font-mono, monospace);
    font-weight: 600;
    letter-spacing: var(--authrim-tracking-tight);
    transition: color var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-countdown__icon {
    flex-shrink: 0;
  }

  /* Sizes */
  .authrim-countdown--sm {
    font-size: var(--authrim-text-xs);
  }

  .authrim-countdown--sm .authrim-countdown__icon {
    width: 14px;
    height: 14px;
  }

  .authrim-countdown--md {
    font-size: var(--authrim-text-sm);
  }

  .authrim-countdown--md .authrim-countdown__icon {
    width: 16px;
    height: 16px;
  }

  .authrim-countdown--lg {
    font-size: var(--authrim-text-base);
  }

  .authrim-countdown--lg .authrim-countdown__icon {
    width: 20px;
    height: 20px;
  }

  /* Status */
  .authrim-countdown--normal {
    color: var(--authrim-color-text-secondary);
  }

  .authrim-countdown--warn {
    color: var(--authrim-color-warning, #f59e0b);
  }

  .authrim-countdown--critical {
    color: var(--authrim-color-error);
    animation: authrim-countdown-pulse 1s ease-in-out infinite;
  }

  @keyframes authrim-countdown-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>
