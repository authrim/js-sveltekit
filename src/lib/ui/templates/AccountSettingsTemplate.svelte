<!--
  AccountSettingsTemplate Component

  Reference implementation for account settings screens.
  Copy and customize for production use.

  @example
  <AccountSettingsTemplate
    {passkeys}
    {sessions}
    {linkedAccounts}
    currentSessionId={session.id}
    on:passkey-register={handlePasskeyRegister}
    on:passkey-delete={handlePasskeyDelete}
    on:session-revoke={handleSessionRevoke}
    on:account-link={handleAccountLink}
    on:account-unlink={handleAccountUnlink}
  />
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SocialProvider } from '../../types.js';
  import type { PasskeyItemDisplay, SessionItemDisplay, LinkedAccountDisplay } from '../types.js';
  import Card from '../shared/Card.svelte';
  import PasskeyList from '../passkey/PasskeyList.svelte';
  import PasskeyRegisterButton from '../passkey/PasskeyRegisterButton.svelte';
  import SessionList from '../session/SessionList.svelte';
  import LinkedAccountsList from '../account/LinkedAccountsList.svelte';
  import LinkAccountButton from '../account/LinkAccountButton.svelte';

  export let passkeys: PasskeyItemDisplay[] = [];
  export let sessions: SessionItemDisplay[] = [];
  export let linkedAccounts: LinkedAccountDisplay[] = [];
  export let currentSessionId: string | undefined = undefined;
  export let loading = false;
  export let passkeyLoading = false;
  export let deletingPasskeyId: string | undefined = undefined;
  export let revokingSessionId: string | undefined = undefined;
  export let unlinkingAccountId: string | undefined = undefined;
  export let linkableProviders: SocialProvider[] = ['google', 'github', 'apple'];
  export let linkingProvider: SocialProvider | undefined = undefined;
  let className = '';
  export { className as class };

  const dispatch = createEventDispatcher<{
    'passkey-register': void;
    'passkey-delete': { credentialId: string };
    'session-revoke': { sessionId: string };
    'account-link': { provider: SocialProvider };
    'account-unlink': { accountId: string; provider: SocialProvider };
  }>();

  $: linkedProviders = new Set(linkedAccounts.map((a) => a.provider));
  $: availableToLink = linkableProviders.filter((p) => !linkedProviders.has(p));
</script>

<div class="authrim-account-settings {className}">
  <h1 class="authrim-account-settings__title">Account Settings</h1>

  <div class="authrim-account-settings__grid">
    <!-- Passkeys Section -->
    <Card class="authrim-account-settings__section">
      <div slot="header" class="authrim-account-settings__section-header">
        <div>
          <h2 class="authrim-account-settings__section-title">Passkeys</h2>
          <p class="authrim-account-settings__section-desc">
            Passkeys let you sign in securely without a password
          </p>
        </div>
        <PasskeyRegisterButton
          variant="outline"
          size="sm"
          loading={passkeyLoading}
          on:click={() => dispatch('passkey-register')}
        />
      </div>

      <PasskeyList
        {passkeys}
        {loading}
        deletingId={deletingPasskeyId}
        on:delete={(e) => dispatch('passkey-delete', e.detail)}
      />
    </Card>

    <!-- Sessions Section -->
    <Card class="authrim-account-settings__section">
      <div slot="header" class="authrim-account-settings__section-header">
        <div>
          <h2 class="authrim-account-settings__section-title">Active Sessions</h2>
          <p class="authrim-account-settings__section-desc">
            Manage your active sign-in sessions
          </p>
        </div>
      </div>

      <SessionList
        {sessions}
        {currentSessionId}
        {loading}
        revokingId={revokingSessionId}
        on:revoke={(e) => dispatch('session-revoke', e.detail)}
      />
    </Card>

    <!-- Linked Accounts Section -->
    <Card class="authrim-account-settings__section">
      <div slot="header" class="authrim-account-settings__section-header">
        <div>
          <h2 class="authrim-account-settings__section-title">Linked Accounts</h2>
          <p class="authrim-account-settings__section-desc">
            Connect accounts for easier sign-in
          </p>
        </div>
      </div>

      <LinkedAccountsList
        accounts={linkedAccounts}
        {loading}
        unlinkingId={unlinkingAccountId}
        on:unlink={(e) => dispatch('account-unlink', e.detail)}
      />

      {#if availableToLink.length > 0}
        <div class="authrim-account-settings__link-buttons">
          {#each availableToLink as provider}
            <LinkAccountButton
              {provider}
              loading={linkingProvider === provider}
              disabled={loading || !!linkingProvider}
              on:click={() => dispatch('account-link', { provider })}
            />
          {/each}
        </div>
      {/if}
    </Card>
  </div>
</div>

<style>
  .authrim-account-settings {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--authrim-space-6);
  }

  .authrim-account-settings__title {
    margin: 0 0 var(--authrim-space-6);
    font-size: var(--authrim-text-2xl);
    font-weight: 700;
    color: var(--authrim-color-text);
    letter-spacing: var(--authrim-tracking-tight);
  }

  .authrim-account-settings__grid {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-6);
  }

  :global(.authrim-account-settings__section) {
    overflow: hidden;
  }

  .authrim-account-settings__section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--authrim-space-4);
  }

  .authrim-account-settings__section-title {
    margin: 0 0 var(--authrim-space-1);
    font-size: var(--authrim-text-base);
    font-weight: 600;
    color: var(--authrim-color-text);
    letter-spacing: var(--authrim-tracking-tight);
  }

  .authrim-account-settings__section-desc {
    margin: 0;
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-secondary);
  }

  .authrim-account-settings__link-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--authrim-space-2);
    padding: var(--authrim-space-4);
    border-top: 1px solid var(--authrim-color-border-subtle);
    background: var(--authrim-color-bg-subtle);
  }

  @media (max-width: 640px) {
    .authrim-account-settings {
      padding: var(--authrim-space-4);
    }

    .authrim-account-settings__section-header {
      flex-direction: column;
      gap: var(--authrim-space-3);
    }
  }
</style>
