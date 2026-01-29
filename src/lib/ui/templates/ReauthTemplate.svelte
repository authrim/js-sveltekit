<!--
  ReauthTemplate
  - 再認証UIの枠を提供する
  - 認証方法選択と実行はSDK側に委譲する
-->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { SocialProvider } from "../../types.js";
  import Card from "../shared/Card.svelte";
  import Button from "../shared/Button.svelte";
  import Alert from "../shared/Alert.svelte";

  // State
  export let loading = false;
  export let error = "";
  export let challengeId = "";

  // Available re-auth methods
  export let enablePasskey = true;
  export let enableEmailCode = true;
  export let enablePassword = false;
  export let availableProviders: SocialProvider[] = [];

  // Labels (i18n)
  export let title = "Re-authentication Required";
  export let subtitle =
    "For security reasons, you need to confirm your identity";
  export let passkeyLabel = "Continue with Passkey";
  export let emailCodeLabel = "Send verification code";
  export let passwordLabel = "Continue with password";
  export let confirmLabel = "Continue";
  export let infoText =
    "This confirmation is required to ensure the security of your account.";

  let className = "";
  export { className as class };

  const dispatch = createEventDispatcher<{
    "passkey-reauth": { challengeId: string };
    "email-code-reauth": { challengeId: string };
    "password-reauth": { challengeId: string };
    "social-reauth": { challengeId: string; provider: SocialProvider };
    confirm: { challengeId: string };
    "dismiss-error": void;
  }>();

  $: hasMethods =
    enablePasskey ||
    enableEmailCode ||
    enablePassword ||
    availableProviders.length > 0;
</script>

<div class="authrim-reauth-template {className}">
  <Card padding="lg" shadow="lg" class="authrim-reauth-template__card">
    <!-- Header -->
    <div class="authrim-reauth-template__header">
      <div class="authrim-reauth-template__icon">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            fill-rule="evenodd"
            d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.932 9.563 12.348a.749.749 0 00.374 0c5.499-1.416 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <h1 class="authrim-reauth-template__title">{title}</h1>
      <p class="authrim-reauth-template__subtitle">{subtitle}</p>
    </div>

    <!-- Error -->
    {#if error}
      <Alert
        variant="error"
        dismissible
        on:dismiss={() => dispatch("dismiss-error")}
      >
        {error}
      </Alert>
    {/if}

    <!-- Auth methods -->
    <div class="authrim-reauth-template__methods">
      {#if hasMethods}
        {#if enablePasskey}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            {loading}
            on:click={() => dispatch("passkey-reauth", { challengeId })}
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              style="width: 20px; height: 20px;"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M8 7a5 5 0 113.61 4.804l-1.903 1.903A.75.75 0 019.22 14H8v1a.75.75 0 01-.75.75h-1.5V17a.75.75 0 01-.75.75H3.25a.75.75 0 01-.75-.75v-1.104a.75.75 0 01.22-.53l5.442-5.442A5.03 5.03 0 018 7zm5-3a.75.75 0 000 1.5A1.5 1.5 0 0114.5 7 .75.75 0 0016 7a3 3 0 00-3-3z"
                clip-rule="evenodd"
              />
            </svg>
            {passkeyLabel}
          </Button>
        {/if}

        {#if enableEmailCode}
          <Button
            variant={enablePasskey ? "secondary" : "primary"}
            size="lg"
            fullWidth
            disabled={loading}
            on:click={() => dispatch("email-code-reauth", { challengeId })}
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              style="width: 20px; height: 20px;"
              aria-hidden="true"
            >
              <path
                d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.161V6a2 2 0 00-2-2H3z"
              />
              <path
                d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z"
              />
            </svg>
            {emailCodeLabel}
          </Button>
        {/if}

        {#if enablePassword}
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled={loading}
            on:click={() => dispatch("password-reauth", { challengeId })}
          >
            {passwordLabel}
          </Button>
        {/if}

        {#if availableProviders.length > 0}
          <div class="authrim-reauth-template__divider">
            <span>or</span>
          </div>
          {#each availableProviders as provider (provider)}
            <Button
              variant="outline"
              size="lg"
              fullWidth
              disabled={loading}
              on:click={() =>
                dispatch("social-reauth", { challengeId, provider })}
            >
              Continue with {provider.charAt(0).toUpperCase() +
                provider.slice(1)}
            </Button>
          {/each}
        {/if}
      {:else}
        <!-- Simple confirm button (fallback) -->
        <Button
          variant="primary"
          size="lg"
          fullWidth
          {loading}
          disabled={!challengeId}
          on:click={() => dispatch("confirm", { challengeId })}
        >
          {confirmLabel}
        </Button>
      {/if}
    </div>

    <!-- Info text -->
    <p class="authrim-reauth-template__info">{infoText}</p>
  </Card>
</div>

<style>
  .authrim-reauth-template {
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

  :global(.authrim-reauth-template__card) {
    width: 100%;
    max-width: 420px;
  }

  .authrim-reauth-template__header {
    text-align: center;
    margin-bottom: var(--authrim-space-6);
  }

  .authrim-reauth-template__icon {
    width: 64px;
    height: 64px;
    margin: 0 auto var(--authrim-space-4);
    padding: var(--authrim-space-4);
    background: var(--authrim-color-bg-subtle);
    border-radius: var(--authrim-radius-full);
    color: var(--authrim-color-primary);
  }

  .authrim-reauth-template__icon svg {
    width: 100%;
    height: 100%;
  }

  .authrim-reauth-template__title {
    margin: 0 0 var(--authrim-space-2);
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-2xl);
    font-weight: 700;
    color: var(--authrim-color-text);
    letter-spacing: var(--authrim-tracking-tight);
  }

  .authrim-reauth-template__subtitle {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-secondary);
  }

  .authrim-reauth-template__methods {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-3);
  }

  .authrim-reauth-template__divider {
    display: flex;
    align-items: center;
    gap: var(--authrim-space-3);
    color: var(--authrim-color-text-muted);
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
  }

  .authrim-reauth-template__divider::before,
  .authrim-reauth-template__divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--authrim-color-border);
  }

  .authrim-reauth-template__info {
    margin: var(--authrim-space-5) 0 0;
    text-align: center;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-xs);
    color: var(--authrim-color-text-muted);
  }
</style>
