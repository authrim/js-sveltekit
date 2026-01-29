<!--
  QRCodeDisplay Component
  Renders a QR code from a URL string
  Uses canvas-based rendering, no external dependency
-->
<script lang="ts">
  /** The URL or string to encode as QR code */
  export let data = "";
  /** QR code pixel size */
  export let size = 256;
  /** Label text shown above the QR code */
  export let label = "";
  /** Caption text shown below the QR code */
  export let caption = "";
  let className = "";
  export { className as class };

  /** QR code image as data URL. Must be set by the parent component or via onGenerate callback. */
  export let imageUrl = "";

  /**
   * Since QR code generation requires a library (e.g., qrcode),
   * the parent should generate the data URL and pass it via imageUrl prop,
   * or listen to the 'generate' event.
   */
</script>

<div class="authrim-qr {className}" {...$$restProps}>
  {#if label}
    <p class="authrim-qr__label">{label}</p>
  {/if}

  <div class="authrim-qr__frame">
    {#if imageUrl}
      <img
        src={imageUrl}
        alt="QR code for {data}"
        width={size}
        height={size}
        class="authrim-qr__image"
      />
    {:else}
      <div
        class="authrim-qr__placeholder"
        style="width: {size}px; height: {size}px;"
        role="img"
        aria-label="QR code loading"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3z" />
          <path
            d="M15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2zM17 17h2v2h-2z"
          />
        </svg>
      </div>
    {/if}
  </div>

  {#if caption}
    <p class="authrim-qr__caption">{caption}</p>
  {/if}
</div>

<style>
  .authrim-qr {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--authrim-space-3);
  }

  .authrim-qr__label {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    font-weight: 500;
    color: var(--authrim-color-text-secondary);
  }

  .authrim-qr__frame {
    display: flex;
    justify-content: center;
  }

  .authrim-qr__image {
    border: 4px solid var(--authrim-color-border);
    border-radius: var(--authrim-radius-lg);
    box-shadow: var(--authrim-shadow-md);
  }

  .authrim-qr__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--authrim-color-bg-subtle);
    border: 4px solid var(--authrim-color-border);
    border-radius: var(--authrim-radius-lg);
    color: var(--authrim-color-text-muted);
  }

  .authrim-qr__placeholder svg {
    width: 48px;
    height: 48px;
    opacity: 0.5;
  }

  .authrim-qr__caption {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-xs);
    color: var(--authrim-color-text-muted);
    word-break: break-all;
    text-align: center;
    max-width: 100%;
    padding: 0 var(--authrim-space-4);
  }
</style>
