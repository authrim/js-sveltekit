<!--
  Badge Component
  Status indicator with variants
-->
<script lang="ts">
  import type { Size } from '../types.js';

  export let variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent' = 'default';
  export let size: Size = 'md';
  export let dot = false;
  let className = '';
  export { className as class };
</script>

<span
  class="authrim-badge authrim-badge--{variant} authrim-badge--{size} {className}"
  class:authrim-badge--dot={dot}
  {...$$restProps}
>
  {#if dot}
    <span class="authrim-badge__dot" aria-hidden="true"></span>
  {/if}
  <slot />
</span>

<style>
  .authrim-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--authrim-space-1);
    font-family: var(--authrim-font-sans);
    font-weight: 500;
    border-radius: var(--authrim-radius-full);
    white-space: nowrap;
    letter-spacing: var(--authrim-tracking-tight);
  }

  /* Sizes */
  .authrim-badge--sm {
    height: 20px;
    padding: 0 var(--authrim-space-2);
    font-size: 11px;
  }

  .authrim-badge--md {
    height: 24px;
    padding: 0 var(--authrim-space-3);
    font-size: var(--authrim-text-xs);
  }

  .authrim-badge--lg {
    height: 28px;
    padding: 0 var(--authrim-space-3);
    font-size: var(--authrim-text-sm);
  }

  /* Variants */
  .authrim-badge--default {
    background: var(--authrim-color-bg-subtle);
    color: var(--authrim-color-text-secondary);
  }

  .authrim-badge--success {
    background: var(--authrim-color-success-subtle);
    color: var(--authrim-color-success-text);
  }

  .authrim-badge--warning {
    background: var(--authrim-color-warning-subtle);
    color: var(--authrim-color-warning-text);
  }

  .authrim-badge--error {
    background: var(--authrim-color-error-subtle);
    color: var(--authrim-color-error-text);
  }

  .authrim-badge--info {
    background: var(--authrim-color-info-subtle);
    color: var(--authrim-color-info-text);
  }

  .authrim-badge--accent {
    background: var(--authrim-color-primary-subtle);
    color: var(--authrim-color-primary);
  }

  /* Dot indicator */
  .authrim-badge__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .authrim-badge--sm .authrim-badge__dot {
    width: 5px;
    height: 5px;
  }
</style>
