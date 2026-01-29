<!--
  CIBARequestCard Component
  Displays a single CIBA authentication request with client info,
  binding message, scopes, and approve/deny actions
-->
<script context="module" lang="ts">
  export interface CIBARequest {
    auth_req_id: string;
    client_id: string;
    client_name: string;
    client_logo_uri?: string | null;
    scope: string;
    binding_message?: string;
    user_code?: string;
    created_at: number;
    expires_at: number;
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Button from "../shared/Button.svelte";
  import CountdownTimer from "../shared/CountdownTimer.svelte";

  export let request: CIBARequest;
  export let loading = false;
  export let approveLabel = "Approve";
  export let denyLabel = "Deny";
  export let bindingMessageLabel = "Binding Message";
  export let verificationCodeLabel = "Verification Code";
  export let requestedAccessLabel = "Requested Access";
  let className = "";
  export { className as class };

  const dispatch = createEventDispatcher<{
    approve: { authReqId: string };
    deny: { authReqId: string };
    expired: { authReqId: string };
  }>();

  $: scopes = request.scope.split(" ").filter(Boolean);
</script>

<div class="authrim-ciba-card {className}" {...$$restProps}>
  <!-- Client header -->
  <div class="authrim-ciba-card__header">
    {#if request.client_logo_uri}
      <img
        src={request.client_logo_uri}
        alt={request.client_name}
        class="authrim-ciba-card__logo"
      />
    {:else}
      <div class="authrim-ciba-card__logo-placeholder">
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            d="M8 16.25a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5a.75.75 0 01-.75-.75zM3 4.5A2.5 2.5 0 015.5 2h9A2.5 2.5 0 0117 4.5v7a2.5 2.5 0 01-2.5 2.5h-9A2.5 2.5 0 013 11.5v-7z"
          />
        </svg>
      </div>
    {/if}

    <div class="authrim-ciba-card__client">
      <h3 class="authrim-ciba-card__name">{request.client_name}</h3>
      <p class="authrim-ciba-card__subtitle">Authentication Request</p>
    </div>

    <div class="authrim-ciba-card__timer">
      <CountdownTimer
        expiresAt={request.expires_at}
        size="sm"
        on:expired={() =>
          dispatch("expired", { authReqId: request.auth_req_id })}
      />
    </div>
  </div>

  <!-- Binding message -->
  {#if request.binding_message}
    <div class="authrim-ciba-card__binding">
      <svg
        class="authrim-ciba-card__binding-icon"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
          clip-rule="evenodd"
        />
      </svg>
      <div>
        <p class="authrim-ciba-card__binding-label">{bindingMessageLabel}</p>
        <p class="authrim-ciba-card__binding-text">{request.binding_message}</p>
      </div>
    </div>
  {/if}

  <!-- User code -->
  {#if request.user_code}
    <div class="authrim-ciba-card__code">
      <p class="authrim-ciba-card__code-label">{verificationCodeLabel}</p>
      <p class="authrim-ciba-card__code-value">{request.user_code}</p>
    </div>
  {/if}

  <!-- Scopes -->
  <div class="authrim-ciba-card__scopes">
    <p class="authrim-ciba-card__scopes-label">{requestedAccessLabel}</p>
    <div class="authrim-ciba-card__scopes-list">
      {#each scopes as scope (scope)}
        <span class="authrim-ciba-card__scope-badge">{scope}</span>
      {/each}
    </div>
  </div>

  <!-- Actions -->
  <div class="authrim-ciba-card__actions">
    <Button
      variant="primary"
      fullWidth
      {loading}
      on:click={() => dispatch("approve", { authReqId: request.auth_req_id })}
    >
      <svg
        viewBox="0 0 16 16"
        fill="currentColor"
        style="width: 16px; height: 16px;"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z"
          clip-rule="evenodd"
        />
      </svg>
      {approveLabel}
    </Button>
    <Button
      variant="secondary"
      fullWidth
      disabled={loading}
      on:click={() => dispatch("deny", { authReqId: request.auth_req_id })}
    >
      <svg
        viewBox="0 0 16 16"
        fill="currentColor"
        style="width: 16px; height: 16px;"
        aria-hidden="true"
      >
        <path
          d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z"
        />
      </svg>
      {denyLabel}
    </Button>
  </div>
</div>

<style>
  .authrim-ciba-card {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-4);
    padding: var(--authrim-space-5);
    background: var(--authrim-color-bg);
    border: 1.5px solid var(--authrim-color-border);
    border-radius: var(--authrim-radius-lg);
    box-shadow: var(--authrim-shadow-sm);
  }

  .authrim-ciba-card__header {
    display: flex;
    align-items: center;
    gap: var(--authrim-space-3);
  }

  .authrim-ciba-card__logo {
    width: 48px;
    height: 48px;
    border-radius: var(--authrim-radius-md);
    object-fit: cover;
  }

  .authrim-ciba-card__logo-placeholder {
    width: 48px;
    height: 48px;
    border-radius: var(--authrim-radius-md);
    background: var(--authrim-color-bg-subtle);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--authrim-color-primary);
  }

  .authrim-ciba-card__logo-placeholder svg {
    width: 24px;
    height: 24px;
  }

  .authrim-ciba-card__client {
    flex: 1;
    min-width: 0;
  }

  .authrim-ciba-card__name {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-lg);
    font-weight: 600;
    color: var(--authrim-color-text);
  }

  .authrim-ciba-card__subtitle {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-muted);
  }

  .authrim-ciba-card__timer {
    flex-shrink: 0;
    text-align: right;
  }

  .authrim-ciba-card__binding {
    display: flex;
    gap: var(--authrim-space-3);
    padding: var(--authrim-space-4);
    background: var(--authrim-color-info-subtle, #eff6ff);
    border: 1px solid var(--authrim-color-info, #3b82f6);
    border-radius: var(--authrim-radius-md);
  }

  .authrim-ciba-card__binding-icon {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    color: var(--authrim-color-info, #3b82f6);
    margin-top: 1px;
  }

  .authrim-ciba-card__binding-label {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    font-weight: 500;
    color: var(--authrim-color-info-text, #1e40af);
  }

  .authrim-ciba-card__binding-text {
    margin: var(--authrim-space-1) 0 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-info-text, #1e40af);
  }

  .authrim-ciba-card__code {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-1);
  }

  .authrim-ciba-card__code-label {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    font-weight: 500;
    color: var(--authrim-color-text-secondary);
  }

  .authrim-ciba-card__code-value {
    margin: 0;
    font-family: var(--authrim-font-mono, monospace);
    font-size: var(--authrim-text-2xl);
    font-weight: 700;
    color: var(--authrim-color-text);
    letter-spacing: 0.1em;
  }

  .authrim-ciba-card__scopes {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-2);
  }

  .authrim-ciba-card__scopes-label {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    font-weight: 500;
    color: var(--authrim-color-text-secondary);
  }

  .authrim-ciba-card__scopes-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--authrim-space-2);
  }

  .authrim-ciba-card__scope-badge {
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-xs);
    font-weight: 500;
    color: var(--authrim-color-text-secondary);
    background: var(--authrim-color-bg-muted);
    padding: 2px var(--authrim-space-3);
    border-radius: var(--authrim-radius-full);
  }

  .authrim-ciba-card__actions {
    display: flex;
    gap: var(--authrim-space-3);
  }
</style>
