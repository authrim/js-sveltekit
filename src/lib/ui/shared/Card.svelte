<!--
  Card Component
  Container with border, shadow, and optional header/footer
-->
<script lang="ts">
  export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  export let bordered = true;
  export let shadow: 'none' | 'sm' | 'md' | 'lg' = 'sm';
  export let hoverable = false;
  let className = '';
  export { className as class };
</script>

<div
  class="authrim-card authrim-card--p-{padding} authrim-card--shadow-{shadow} {className}"
  class:authrim-card--bordered={bordered}
  class:authrim-card--hoverable={hoverable}
  {...$$restProps}
>
  {#if $$slots.header}
    <div class="authrim-card__header">
      <slot name="header" />
    </div>
  {/if}

  <div class="authrim-card__body">
    <slot />
  </div>

  {#if $$slots.footer}
    <div class="authrim-card__footer">
      <slot name="footer" />
    </div>
  {/if}
</div>

<style>
  .authrim-card {
    background: var(--authrim-color-bg);
    border-radius: var(--authrim-radius-lg);
    overflow: hidden;
    transition:
      box-shadow var(--authrim-duration-normal) var(--authrim-ease-default),
      transform var(--authrim-duration-normal) var(--authrim-ease-default);
  }

  .authrim-card--bordered {
    border: 1.5px solid var(--authrim-color-border);
  }

  .authrim-card--hoverable:hover {
    transform: translateY(-2px);
    box-shadow: var(--authrim-shadow-lg);
  }

  /* Shadows */
  .authrim-card--shadow-none { box-shadow: none; }
  .authrim-card--shadow-sm { box-shadow: var(--authrim-shadow-sm); }
  .authrim-card--shadow-md { box-shadow: var(--authrim-shadow-md); }
  .authrim-card--shadow-lg { box-shadow: var(--authrim-shadow-lg); }

  /* Padding */
  .authrim-card--p-none .authrim-card__body { padding: 0; }
  .authrim-card--p-sm .authrim-card__body { padding: var(--authrim-space-3); }
  .authrim-card--p-md .authrim-card__body { padding: var(--authrim-space-5); }
  .authrim-card--p-lg .authrim-card__body { padding: var(--authrim-space-6); }

  .authrim-card__header {
    padding: var(--authrim-space-4) var(--authrim-space-5);
    border-bottom: 1px solid var(--authrim-color-border);
    background: var(--authrim-color-bg-subtle);
  }

  .authrim-card--p-sm .authrim-card__header { padding: var(--authrim-space-3); }
  .authrim-card--p-lg .authrim-card__header { padding: var(--authrim-space-5) var(--authrim-space-6); }

  .authrim-card__footer {
    padding: var(--authrim-space-4) var(--authrim-space-5);
    border-top: 1px solid var(--authrim-color-border);
    background: var(--authrim-color-bg-subtle);
  }

  .authrim-card--p-sm .authrim-card__footer { padding: var(--authrim-space-3); }
  .authrim-card--p-lg .authrim-card__footer { padding: var(--authrim-space-5) var(--authrim-space-6); }
</style>
