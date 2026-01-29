<!--
  Dialog Component
  Accessible modal dialog with overlay and focus trap
  No external dependencies - pure Svelte implementation
-->
<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";

  export let open = false;
  export let title = "";
  export let closeOnOverlay = true;
  export let closeOnEscape = true;
  let className = "";
  export { className as class };

  const dispatch = createEventDispatcher<{ close: void }>();

  let dialogEl: HTMLDivElement | undefined;
  let previousFocus: HTMLElement | null = null;

  function handleClose() {
    dispatch("close");
  }

  function handleOverlayClick(e: MouseEvent) {
    if (closeOnOverlay && e.target === e.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!open) return;

    if (closeOnEscape && e.key === "Escape") {
      e.preventDefault();
      handleClose();
      return;
    }

    // Focus trap
    if (e.key === "Tab" && dialogEl) {
      const focusable = dialogEl.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  $: if (open) {
    if (typeof document !== "undefined") {
      previousFocus = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
    }
  } else {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
      previousFocus?.focus();
    }
  }

  onDestroy(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
  });
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    class="authrim-dialog-overlay"
    on:click={handleOverlayClick}
    role="presentation"
  >
    <div
      bind:this={dialogEl}
      class="authrim-dialog {className}"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "authrim-dialog-title" : undefined}
      {...$$restProps}
    >
      {#if title}
        <div class="authrim-dialog__header">
          <h2 id="authrim-dialog-title" class="authrim-dialog__title">
            {title}
          </h2>
          <button
            type="button"
            class="authrim-dialog__close"
            on:click={handleClose}
            aria-label="Close dialog"
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
              />
            </svg>
          </button>
        </div>
      {/if}

      <div class="authrim-dialog__body">
        <slot />
      </div>

      {#if $$slots.footer}
        <div class="authrim-dialog__footer">
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .authrim-dialog-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--authrim-space-4);
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    animation: authrim-dialog-fade-in var(--authrim-duration-normal)
      var(--authrim-ease-default);
  }

  @keyframes authrim-dialog-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .authrim-dialog {
    position: relative;
    width: 100%;
    max-width: 480px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    background: var(--authrim-color-bg);
    border: 1.5px solid var(--authrim-color-border);
    border-radius: var(--authrim-radius-lg);
    box-shadow: var(--authrim-shadow-lg);
    animation: authrim-dialog-scale-in var(--authrim-duration-normal)
      var(--authrim-ease-bounce);
  }

  @keyframes authrim-dialog-scale-in {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .authrim-dialog__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--authrim-space-5);
    border-bottom: 1px solid var(--authrim-color-border);
  }

  .authrim-dialog__title {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-lg);
    font-weight: 600;
    color: var(--authrim-color-text);
    letter-spacing: var(--authrim-tracking-tight);
  }

  .authrim-dialog__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: var(--authrim-radius-full);
    color: var(--authrim-color-text-muted);
    cursor: pointer;
    transition:
      background-color var(--authrim-duration-fast) var(--authrim-ease-default),
      color var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-dialog__close:hover {
    background: var(--authrim-color-bg-subtle);
    color: var(--authrim-color-text);
  }

  .authrim-dialog__close:focus-visible {
    outline: none;
    box-shadow: var(--authrim-shadow-focus);
  }

  .authrim-dialog__close svg {
    width: 16px;
    height: 16px;
  }

  .authrim-dialog__body {
    flex: 1;
    overflow-y: auto;
    padding: var(--authrim-space-5);
  }

  .authrim-dialog__footer {
    padding: var(--authrim-space-4) var(--authrim-space-5);
    border-top: 1px solid var(--authrim-color-border);
    background: var(--authrim-color-bg-subtle);
    border-radius: 0 0 var(--authrim-radius-lg) var(--authrim-radius-lg);
  }
</style>
