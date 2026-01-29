<!--
  Alert Component
  Status message display with variant-based styling
  Supports success, error, warning, and info variants
-->
<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let variant: "success" | "error" | "warning" | "info" = "info";
  export let title = "";
  export let dismissible = false;
  let className = "";
  export { className as class };

  const dispatch = createEventDispatcher<{ dismiss: void }>();
</script>

<div
  class="authrim-alert authrim-alert--{variant} {className}"
  role="alert"
  aria-live={variant === "error" ? "assertive" : "polite"}
  {...$$restProps}
>
  <div class="authrim-alert__icon">
    {#if variant === "success"}
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clip-rule="evenodd"
        />
      </svg>
    {:else if variant === "error"}
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
          clip-rule="evenodd"
        />
      </svg>
    {:else if variant === "warning"}
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path
          fill-rule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clip-rule="evenodd"
        />
      </svg>
    {:else}
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
          clip-rule="evenodd"
        />
      </svg>
    {/if}
  </div>

  <div class="authrim-alert__body">
    {#if title}
      <h3 class="authrim-alert__title">{title}</h3>
    {/if}
    <div class="authrim-alert__text">
      <slot />
    </div>
  </div>

  {#if dismissible}
    <button
      type="button"
      class="authrim-alert__dismiss"
      on:click={() => dispatch("dismiss")}
      aria-label="Dismiss"
    >
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path
          d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
        />
      </svg>
    </button>
  {/if}
</div>

<style>
  .authrim-alert {
    display: flex;
    align-items: flex-start;
    gap: var(--authrim-space-3);
    padding: var(--authrim-space-4);
    border: 1.5px solid;
    border-radius: var(--authrim-radius-md);
    animation: authrim-alert-in var(--authrim-duration-normal)
      var(--authrim-ease-bounce);
  }

  @keyframes authrim-alert-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .authrim-alert__icon {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }

  .authrim-alert__icon svg {
    width: 100%;
    height: 100%;
  }

  .authrim-alert__body {
    flex: 1;
    min-width: 0;
  }

  .authrim-alert__title {
    margin: 0 0 var(--authrim-space-1);
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    font-weight: 600;
    line-height: var(--authrim-leading-snug);
  }

  .authrim-alert__text {
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    line-height: var(--authrim-leading-snug);
    letter-spacing: var(--authrim-tracking-tight);
  }

  .authrim-alert__dismiss {
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
    cursor: pointer;
    transition:
      background-color var(--authrim-duration-fast) var(--authrim-ease-default),
      transform var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-alert__dismiss:active {
    transform: scale(0.9);
  }

  .authrim-alert__dismiss:focus-visible {
    outline: none;
    box-shadow: var(--authrim-shadow-focus);
  }

  .authrim-alert__dismiss svg {
    width: 16px;
    height: 16px;
  }

  /* Success */
  .authrim-alert--success {
    background: var(--authrim-color-success-subtle, #f0fdf4);
    border-color: var(--authrim-color-success, #22c55e);
  }

  .authrim-alert--success .authrim-alert__icon,
  .authrim-alert--success .authrim-alert__dismiss {
    color: var(--authrim-color-success, #22c55e);
  }

  .authrim-alert--success .authrim-alert__title {
    color: var(--authrim-color-success, #22c55e);
  }

  .authrim-alert--success .authrim-alert__text {
    color: var(--authrim-color-success-text, #166534);
  }

  /* Error */
  .authrim-alert--error {
    background: var(--authrim-color-error-subtle);
    border-color: var(--authrim-color-error);
  }

  .authrim-alert--error .authrim-alert__icon,
  .authrim-alert--error .authrim-alert__dismiss {
    color: var(--authrim-color-error);
  }

  .authrim-alert--error .authrim-alert__title {
    color: var(--authrim-color-error);
  }

  .authrim-alert--error .authrim-alert__text {
    color: var(--authrim-color-error-text);
  }

  /* Warning */
  .authrim-alert--warning {
    background: var(--authrim-color-warning-subtle, #fffbeb);
    border-color: var(--authrim-color-warning, #f59e0b);
  }

  .authrim-alert--warning .authrim-alert__icon,
  .authrim-alert--warning .authrim-alert__dismiss {
    color: var(--authrim-color-warning, #f59e0b);
  }

  .authrim-alert--warning .authrim-alert__title {
    color: var(--authrim-color-warning-text, #92400e);
  }

  .authrim-alert--warning .authrim-alert__text {
    color: var(--authrim-color-warning-text, #92400e);
  }

  /* Info */
  .authrim-alert--info {
    background: var(--authrim-color-info-subtle, #eff6ff);
    border-color: var(--authrim-color-info, #3b82f6);
  }

  .authrim-alert--info .authrim-alert__icon,
  .authrim-alert--info .authrim-alert__dismiss {
    color: var(--authrim-color-info, #3b82f6);
  }

  .authrim-alert--info .authrim-alert__title {
    color: var(--authrim-color-info, #3b82f6);
  }

  .authrim-alert--info .authrim-alert__text {
    color: var(--authrim-color-info-text, #1e40af);
  }
</style>
