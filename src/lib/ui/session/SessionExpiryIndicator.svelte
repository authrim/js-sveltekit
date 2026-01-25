<!--
  SessionExpiryIndicator Component
  Shows session expiry time with visual indicator
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let expiresAt: Date;
  let className = '';
  export { className as class };

  let timeLeft = '';
  let urgency: 'normal' | 'warning' | 'critical' = 'normal';
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function updateTimeLeft() {
    const now = Date.now();
    const expiry = expiresAt.getTime();
    const diff = expiry - now;

    if (diff <= 0) {
      timeLeft = 'Expired';
      urgency = 'critical';
      return; // Don't schedule next update when expired
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      timeLeft = `${days}d left`;
      urgency = 'normal';
    } else if (hours > 0) {
      timeLeft = `${hours}h ${minutes}m left`;
      urgency = hours < 2 ? 'warning' : 'normal';
    } else {
      timeLeft = `${minutes}m left`;
      urgency = minutes < 15 ? 'critical' : 'warning';
    }

    // Schedule next update using setTimeout (not setInterval)
    // This avoids interval-in-interval issues
    scheduleNextUpdate();
  }

  function scheduleNextUpdate() {
    cancelScheduledUpdate();
    // Update every 10 seconds for critical, 60 seconds otherwise
    const delayMs = urgency === 'critical' ? 10000 : 60000;
    timeoutId = setTimeout(updateTimeLeft, delayMs);
  }

  function cancelScheduledUpdate() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  onMount(() => {
    updateTimeLeft();
  });

  onDestroy(cancelScheduledUpdate);
</script>

<div
  class="authrim-expiry authrim-expiry--{urgency} {className}"
  {...$$restProps}
>
  <svg class="authrim-expiry__icon" viewBox="0 0 16 16" fill="currentColor">
    <path fill-rule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zM4.5 8a.75.75 0 01.75-.75h2.25V4.5a.75.75 0 011.5 0v3.25a.75.75 0 01-.75.75H5.25A.75.75 0 014.5 8z" clip-rule="evenodd"/>
  </svg>
  <span class="authrim-expiry__text">{timeLeft}</span>
</div>

<style>
  .authrim-expiry {
    display: inline-flex;
    align-items: center;
    gap: var(--authrim-space-1);
    margin-top: var(--authrim-space-2);
    font-size: var(--authrim-text-xs);
  }

  .authrim-expiry--normal {
    color: var(--authrim-color-text-muted);
  }

  .authrim-expiry--warning {
    color: var(--authrim-color-warning-text);
  }

  .authrim-expiry--critical {
    color: var(--authrim-color-error-text);
  }

  .authrim-expiry__icon {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
  }

  .authrim-expiry__text {
    font-weight: 500;
    letter-spacing: var(--authrim-tracking-tight);
  }
</style>
