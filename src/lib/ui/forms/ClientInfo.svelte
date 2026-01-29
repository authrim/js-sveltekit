<!--
  ClientInfo Component
  Displays OAuth client logo, name, and policy links
-->
<script context="module" lang="ts">
  export interface ClientInfoData {
    client_id: string;
    client_name: string;
    logo_uri?: string;
    client_uri?: string;
    policy_uri?: string;
    tos_uri?: string;
    is_trusted?: boolean;
  }
</script>

<script lang="ts">
  export let client: ClientInfoData;
  export let trustedLabel = "Trusted";
  export let privacyPolicyLabel = "Privacy Policy";
  export let termsLabel = "Terms of Service";
  let className = "";
  export { className as class };
</script>

<div class="authrim-client-info {className}" {...$$restProps}>
  <!-- Logo -->
  {#if client.logo_uri}
    <img
      src={client.logo_uri}
      alt={client.client_name}
      class="authrim-client-info__logo"
    />
  {:else}
    <div class="authrim-client-info__logo-placeholder">
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75v-2.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75v2.5a.75.75 0 01-.75.75h-3.5a.75.75 0 010-1.5H4zm3-11a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zM7.5 9a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1zM11 5.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zm.5 3.5a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h1a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5h-1z"
          clip-rule="evenodd"
        />
      </svg>
    </div>
  {/if}

  <!-- Name -->
  <h2 class="authrim-client-info__name">{client.client_name}</h2>

  <!-- Trusted badge -->
  {#if client.is_trusted}
    <span class="authrim-client-info__badge">
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M8 15A7 7 0 108 1a7 7 0 000 14zm3.844-8.791a.75.75 0 00-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 10-1.114 1.004l2.25 2.5a.75.75 0 001.15-.043l4.25-5.5z"
          clip-rule="evenodd"
        />
      </svg>
      {trustedLabel}
    </span>
  {/if}

  <!-- Client URI -->
  {#if client.client_uri}
    <a
      href={client.client_uri}
      target="_blank"
      rel="noopener noreferrer"
      class="authrim-client-info__uri"
    >
      {client.client_uri}
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path
          d="M6.22 8.72a.75.75 0 001.06 1.06l5.22-5.22v1.69a.75.75 0 001.5 0v-3.5a.75.75 0 00-.75-.75h-3.5a.75.75 0 000 1.5h1.69L6.22 8.72z"
        />
        <path
          d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 007 4H4.75A2.75 2.75 0 002 6.75v4.5A2.75 2.75 0 004.75 14h4.5A2.75 2.75 0 0012 11.25V9a.75.75 0 00-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5z"
        />
      </svg>
    </a>
  {/if}

  <!-- Policy links -->
  {#if client.policy_uri || client.tos_uri}
    <div class="authrim-client-info__links">
      {#if client.policy_uri}
        <a
          href={client.policy_uri}
          target="_blank"
          rel="noopener noreferrer"
          class="authrim-client-info__link"
        >
          {privacyPolicyLabel}
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path
              d="M6.22 8.72a.75.75 0 001.06 1.06l5.22-5.22v1.69a.75.75 0 001.5 0v-3.5a.75.75 0 00-.75-.75h-3.5a.75.75 0 000 1.5h1.69L6.22 8.72z"
            />
            <path
              d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 007 4H4.75A2.75 2.75 0 002 6.75v4.5A2.75 2.75 0 004.75 14h4.5A2.75 2.75 0 0012 11.25V9a.75.75 0 00-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5z"
            />
          </svg>
        </a>
      {/if}
      {#if client.tos_uri}
        <a
          href={client.tos_uri}
          target="_blank"
          rel="noopener noreferrer"
          class="authrim-client-info__link"
        >
          {termsLabel}
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path
              d="M6.22 8.72a.75.75 0 001.06 1.06l5.22-5.22v1.69a.75.75 0 001.5 0v-3.5a.75.75 0 00-.75-.75h-3.5a.75.75 0 000 1.5h1.69L6.22 8.72z"
            />
            <path
              d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 007 4H4.75A2.75 2.75 0 002 6.75v4.5A2.75 2.75 0 004.75 14h4.5A2.75 2.75 0 0012 11.25V9a.75.75 0 00-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5z"
            />
          </svg>
        </a>
      {/if}
    </div>
  {/if}
</div>

<style>
  .authrim-client-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--authrim-space-2);
  }

  .authrim-client-info__logo {
    width: 64px;
    height: 64px;
    border-radius: var(--authrim-radius-lg);
    object-fit: cover;
  }

  .authrim-client-info__logo-placeholder {
    width: 64px;
    height: 64px;
    border-radius: var(--authrim-radius-lg);
    background: var(--authrim-color-bg-subtle);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--authrim-color-primary);
  }

  .authrim-client-info__logo-placeholder svg {
    width: 32px;
    height: 32px;
  }

  .authrim-client-info__name {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-2xl);
    font-weight: 600;
    color: var(--authrim-color-text);
    letter-spacing: var(--authrim-tracking-tight);
  }

  .authrim-client-info__badge {
    display: inline-flex;
    align-items: center;
    gap: var(--authrim-space-1);
    padding: 2px var(--authrim-space-2);
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-xs);
    font-weight: 500;
    color: var(--authrim-color-success, #22c55e);
    background: var(--authrim-color-success-subtle, #f0fdf4);
    border-radius: var(--authrim-radius-full);
  }

  .authrim-client-info__badge svg {
    width: 12px;
    height: 12px;
  }

  .authrim-client-info__uri {
    display: inline-flex;
    align-items: center;
    gap: var(--authrim-space-1);
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-primary);
    text-decoration: none;
    transition: color var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-client-info__uri:hover {
    color: var(--authrim-color-primary-hover);
    text-decoration: underline;
  }

  .authrim-client-info__uri svg {
    width: 12px;
    height: 12px;
  }

  .authrim-client-info__links {
    display: flex;
    align-items: center;
    gap: var(--authrim-space-4);
    margin-top: var(--authrim-space-1);
  }

  .authrim-client-info__link {
    display: inline-flex;
    align-items: center;
    gap: var(--authrim-space-1);
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-xs);
    color: var(--authrim-color-text-muted);
    text-decoration: none;
    transition: color var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-client-info__link:hover {
    color: var(--authrim-color-primary);
  }

  .authrim-client-info__link svg {
    width: 12px;
    height: 12px;
  }
</style>
