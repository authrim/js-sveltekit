<!--
  LinkedAccountsList Component
  Display and manage linked social accounts
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { LinkedAccountDisplay } from '../types.js';
  import type { SocialProvider } from '../../types.js';
  import Spinner from '../shared/Spinner.svelte';
  import UnlinkAccountButton from './UnlinkAccountButton.svelte';

  export let accounts: LinkedAccountDisplay[] = [];
  export let loading = false;
  export let unlinkingId: string | undefined = undefined;
  let className = '';
  export { className as class };

  const dispatch = createEventDispatcher<{
    unlink: { accountId: string; provider: SocialProvider };
  }>();

  const providerNames: Record<SocialProvider, string> = {
    google: 'Google',
    apple: 'Apple',
    microsoft: 'Microsoft',
    github: 'GitHub',
    facebook: 'Facebook',
  };

  function formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }
</script>

<div class="authrim-linked-accounts {className}" {...$$restProps}>
  {#if loading && accounts.length === 0}
    <div class="authrim-linked-accounts__loading">
      <Spinner size="md" />
      <span>Loading accounts...</span>
    </div>
  {:else if accounts.length === 0}
    <div class="authrim-linked-accounts__empty">
      <div class="authrim-linked-accounts__empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/>
        </svg>
      </div>
      <p class="authrim-linked-accounts__empty-title">No linked accounts</p>
      <p class="authrim-linked-accounts__empty-desc">
        Connect social accounts for easier sign-in
      </p>
    </div>
  {:else}
    <ul class="authrim-linked-accounts__items">
      {#each accounts as account, index (account.accountId)}
        <li
          class="authrim-linked-accounts__item"
          style="animation-delay: {index * 50}ms"
        >
          <div class="authrim-linked-accounts__icon authrim-linked-accounts__icon--{account.provider}">
            {#if account.provider === 'google'}
              <svg viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            {:else if account.provider === 'github'}
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            {:else if account.provider === 'apple'}
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
              </svg>
            {:else}
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            {/if}
          </div>

          <div class="authrim-linked-accounts__info">
            <span class="authrim-linked-accounts__provider">
              {providerNames[account.provider] || account.provider}
            </span>
            {#if account.email || account.name}
              <span class="authrim-linked-accounts__detail">
                {account.email || account.name}
              </span>
            {/if}
            {#if account.linkedAt}
              <span class="authrim-linked-accounts__date">
                Linked {formatDate(account.linkedAt)}
              </span>
            {/if}
          </div>

          <UnlinkAccountButton
            accountId={account.accountId}
            provider={account.provider}
            loading={unlinkingId === account.accountId}
            on:confirm={() => dispatch('unlink', { accountId: account.accountId, provider: account.provider })}
          />
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .authrim-linked-accounts__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--authrim-space-3);
    padding: var(--authrim-space-8);
    color: var(--authrim-color-text-secondary);
    font-size: var(--authrim-text-sm);
  }

  .authrim-linked-accounts__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--authrim-space-8);
    text-align: center;
  }

  .authrim-linked-accounts__empty-icon {
    width: 48px;
    height: 48px;
    margin-bottom: var(--authrim-space-4);
    color: var(--authrim-color-text-muted);
  }

  .authrim-linked-accounts__empty-icon svg {
    width: 100%;
    height: 100%;
  }

  .authrim-linked-accounts__empty-title {
    margin: 0 0 var(--authrim-space-2);
    font-size: var(--authrim-text-base);
    font-weight: 600;
    color: var(--authrim-color-text);
  }

  .authrim-linked-accounts__empty-desc {
    margin: 0;
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-secondary);
  }

  .authrim-linked-accounts__items {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .authrim-linked-accounts__item {
    display: flex;
    align-items: center;
    gap: var(--authrim-space-4);
    padding: var(--authrim-space-4);
    border-bottom: 1px solid var(--authrim-color-border-subtle);
    animation: slide-in var(--authrim-duration-normal) var(--authrim-ease-out) both;
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateX(8px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .authrim-linked-accounts__item:last-child {
    border-bottom: none;
  }

  .authrim-linked-accounts__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--authrim-color-bg-subtle);
    border-radius: var(--authrim-radius-md);
  }

  .authrim-linked-accounts__icon svg {
    width: 20px;
    height: 20px;
  }

  .authrim-linked-accounts__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-1);
  }

  .authrim-linked-accounts__provider {
    font-size: var(--authrim-text-sm);
    font-weight: 500;
    color: var(--authrim-color-text);
    letter-spacing: var(--authrim-tracking-tight);
  }

  .authrim-linked-accounts__detail {
    font-size: var(--authrim-text-xs);
    color: var(--authrim-color-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .authrim-linked-accounts__date {
    font-size: var(--authrim-text-xs);
    color: var(--authrim-color-text-muted);
  }
</style>
