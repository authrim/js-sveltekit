<!--
  DeviceFlowTemplate
  - デバイスフロー入力UIを提供する
  - コード検証・ポーリングはSDK側に委譲する
-->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Card from "../shared/Card.svelte";
  import Button from "../shared/Button.svelte";
  import Alert from "../shared/Alert.svelte";
  import UserCodeInput from "../forms/UserCodeInput.svelte";
  import QRCodeDisplay from "../forms/QRCodeDisplay.svelte";

  // State
  export let loading = false;
  export let error = "";
  export let success = "";
  /** Pre-filled user code (e.g., from URL params) */
  export let initialCode = "";
  /** QR code data URL (generated externally) */
  export let qrCodeUrl = "";
  /** The verification URL to show below QR code */
  export let verificationUrl = "";

  // Labels (i18n)
  export let title = "Device Authorization";
  export let instructions =
    "Enter the code shown on your device to authorize it";
  export let qrLabel = "Scan QR code";
  export let orManualLabel = "or enter code manually";
  export let codeLabel = "User Code";
  export let codeHint = "Enter the 8-character code (XXXX-XXXX)";
  export let approveLabel = "Approve";
  export let denyLabel = "Deny";

  let className = "";
  export { className as class };

  const dispatch = createEventDispatcher<{
    approve: { userCode: string };
    deny: { userCode: string };
    "code-change": { value: string };
    "dismiss-error": void;
    "dismiss-success": void;
  }>();

  let codeValue = initialCode;

  function handleCodeChange(e: CustomEvent<{ value: string }>) {
    codeValue = e.detail.value;
    dispatch("code-change", e.detail);
  }

  function handleCodeSubmit(e: CustomEvent<{ value: string }>) {
    codeValue = e.detail.value;
  }

  $: isCodeComplete = codeValue.replace(/-/g, "").length === 8;
</script>

<div class="authrim-device-template {className}">
  <Card padding="lg" shadow="lg" class="authrim-device-template__card">
    <!-- Header -->
    <div class="authrim-device-template__header">
      <div class="authrim-device-template__icon">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            fill-rule="evenodd"
            d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <h1 class="authrim-device-template__title">{title}</h1>
      <p class="authrim-device-template__instructions">{instructions}</p>
    </div>

    <!-- Alerts -->
    {#if error}
      <Alert
        variant="error"
        dismissible
        on:dismiss={() => dispatch("dismiss-error")}
      >
        {error}
      </Alert>
    {/if}

    {#if success}
      <Alert
        variant="success"
        dismissible
        on:dismiss={() => dispatch("dismiss-success")}
      >
        {success}
      </Alert>
    {/if}

    <!-- QR Code (if available) -->
    {#if qrCodeUrl}
      <QRCodeDisplay
        data={verificationUrl}
        imageUrl={qrCodeUrl}
        label={qrLabel}
        caption={verificationUrl}
      />

      <div class="authrim-device-template__divider">
        <span>{orManualLabel}</span>
      </div>
    {/if}

    <!-- Code Input -->
    <UserCodeInput
      value={codeValue}
      label={codeLabel}
      hint={codeHint}
      disabled={loading}
      on:change={handleCodeChange}
      on:submit={handleCodeSubmit}
    />

    <!-- Action Buttons -->
    <div class="authrim-device-template__actions">
      <Button
        variant="primary"
        size="lg"
        fullWidth
        {loading}
        disabled={!isCodeComplete}
        on:click={() => dispatch("approve", { userCode: codeValue })}
      >
        {loading ? "Processing..." : approveLabel}
      </Button>

      <Button
        variant="ghost"
        size="lg"
        fullWidth
        disabled={loading || !isCodeComplete}
        on:click={() => dispatch("deny", { userCode: codeValue })}
      >
        {denyLabel}
      </Button>
    </div>
  </Card>
</div>

<style>
  .authrim-device-template {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: var(--authrim-space-4);
    background: linear-gradient(
      135deg,
      var(--authrim-color-bg-subtle) 0%,
      var(--authrim-color-bg) 100%
    );
  }

  :global(.authrim-device-template__card) {
    width: 100%;
    max-width: 420px;
  }

  .authrim-device-template__header {
    text-align: center;
    margin-bottom: var(--authrim-space-6);
  }

  .authrim-device-template__icon {
    width: 48px;
    height: 48px;
    margin: 0 auto var(--authrim-space-4);
    padding: var(--authrim-space-3);
    background: var(--authrim-color-bg-subtle);
    border-radius: var(--authrim-radius-full);
    color: var(--authrim-color-primary);
  }

  .authrim-device-template__icon svg {
    width: 100%;
    height: 100%;
  }

  .authrim-device-template__title {
    margin: 0 0 var(--authrim-space-2);
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-2xl);
    font-weight: 700;
    color: var(--authrim-color-text);
    letter-spacing: var(--authrim-tracking-tight);
  }

  .authrim-device-template__instructions {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-secondary);
  }

  .authrim-device-template__divider {
    display: flex;
    align-items: center;
    gap: var(--authrim-space-3);
    margin: var(--authrim-space-5) 0;
    color: var(--authrim-color-text-muted);
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
  }

  .authrim-device-template__divider::before,
  .authrim-device-template__divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--authrim-color-border);
  }

  .authrim-device-template__actions {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-3);
    margin-top: var(--authrim-space-5);
  }
</style>
