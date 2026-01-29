<!--
  CIBATemplate
  - CIBA承認UIの枠を提供する
  - 承認/拒否のAPI呼び出しはSDK hook側に委譲する
-->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Card from "../shared/Card.svelte";
  import Button from "../shared/Button.svelte";
  import Alert from "../shared/Alert.svelte";
  import Spinner from "../shared/Spinner.svelte";
  import CIBARequestCard from "../forms/CIBARequestCard.svelte";
  import type { CIBARequest } from "../forms/CIBARequestCard.svelte";

  // State
  export let loading = false;
  export let error = "";
  export let success = "";
  export let requests: CIBARequest[] = [];

  // Labels (i18n)
  export let title = "Authentication Requests";
  export let subtitle = "Review and approve pending authentication requests";
  export let emptyTitle = "No Pending Requests";
  export let emptyMessage =
    "You don't have any pending authentication requests at the moment.";
  export let refreshLabel = "Refresh";
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
    refresh: void;
    "dismiss-error": void;
    "dismiss-success": void;
  }>();
</script>

<div class="authrim-ciba-template {className}">
  <div class="authrim-ciba-template__container">
    <!-- Header -->
    <div class="authrim-ciba-template__header">
      <h1 class="authrim-ciba-template__title">{title}</h1>
      <p class="authrim-ciba-template__subtitle">{subtitle}</p>
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

    <!-- Content -->
    {#if loading}
      <Card padding="lg">
        <div class="authrim-ciba-template__loading">
          <Spinner size="lg" />
        </div>
      </Card>
    {:else if requests.length === 0}
      <Card padding="lg">
        <div class="authrim-ciba-template__empty">
          <svg
            class="authrim-ciba-template__empty-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
              clip-rule="evenodd"
            />
          </svg>
          <h3 class="authrim-ciba-template__empty-title">{emptyTitle}</h3>
          <p class="authrim-ciba-template__empty-message">{emptyMessage}</p>
        </div>
      </Card>
    {:else}
      <div class="authrim-ciba-template__list">
        {#each requests as request (request.auth_req_id)}
          <CIBARequestCard
            {request}
            {approveLabel}
            {denyLabel}
            {bindingMessageLabel}
            {verificationCodeLabel}
            {requestedAccessLabel}
            on:approve
            on:deny
            on:expired
          />
        {/each}
      </div>
    {/if}

    <!-- Refresh -->
    {#if !loading}
      <div class="authrim-ciba-template__refresh">
        <Button variant="secondary" on:click={() => dispatch("refresh")}>
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            style="width: 16px; height: 16px;"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M13.836 2.477a.75.75 0 01.75.75v3.182a.75.75 0 01-.75.75h-3.182a.75.75 0 010-1.5h1.37l-.84-.841a4.5 4.5 0 00-7.08.681.75.75 0 01-1.3-.75 6 6 0 019.44-.908l.987.987V3.227a.75.75 0 01.75-.75zm-1.672 7.023a.75.75 0 01.363 1 6 6 0 01-9.44.908l-.987-.987v1.232a.75.75 0 01-1.5 0V8.472a.75.75 0 01.75-.75h3.182a.75.75 0 010 1.5h-1.37l.84.841a4.5 4.5 0 007.08-.681.75.75 0 011-.363z"
              clip-rule="evenodd"
            />
          </svg>
          {refreshLabel}
        </Button>
      </div>
    {/if}
  </div>
</div>

<style>
  .authrim-ciba-template {
    min-height: 100vh;
    padding: var(--authrim-space-6) var(--authrim-space-4);
    background: linear-gradient(
      135deg,
      var(--authrim-color-bg-subtle) 0%,
      var(--authrim-color-bg) 100%
    );
  }

  .authrim-ciba-template__container {
    max-width: 640px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-5);
  }

  .authrim-ciba-template__header {
    text-align: center;
  }

  .authrim-ciba-template__title {
    margin: 0 0 var(--authrim-space-2);
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-2xl);
    font-weight: 700;
    color: var(--authrim-color-text);
    letter-spacing: var(--authrim-tracking-tight);
  }

  .authrim-ciba-template__subtitle {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-secondary);
  }

  .authrim-ciba-template__loading {
    display: flex;
    justify-content: center;
    padding: var(--authrim-space-8) 0;
  }

  .authrim-ciba-template__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--authrim-space-3);
    padding: var(--authrim-space-8) 0;
    text-align: center;
  }

  .authrim-ciba-template__empty-icon {
    width: 64px;
    height: 64px;
    color: var(--authrim-color-text-muted);
    opacity: 0.5;
  }

  .authrim-ciba-template__empty-title {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-lg);
    font-weight: 500;
    color: var(--authrim-color-text);
  }

  .authrim-ciba-template__empty-message {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-secondary);
  }

  .authrim-ciba-template__list {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-4);
  }

  .authrim-ciba-template__refresh {
    display: flex;
    justify-content: center;
  }
</style>
