<!--
  PasskeyList Component
  Display and manage registered passkeys
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PasskeyItemDisplay } from '../types.js';
  import Badge from '../shared/Badge.svelte';
  import Spinner from '../shared/Spinner.svelte';
  import PasskeyDeleteButton from './PasskeyDeleteButton.svelte';

  export let passkeys: PasskeyItemDisplay[] = [];
  export let loading = false;
  export let deletingId: string | undefined = undefined;
  let className = '';
  export { className as class };

  const dispatch = createEventDispatcher<{
    delete: { credentialId: string };
  }>();

  function formatDate(date: Date | undefined): string {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }
</script>

<div class="authrim-passkey-list {className}" {...$$restProps}>
  {#if loading && passkeys.length === 0}
    <div class="authrim-passkey-list__loading">
      <Spinner size="md" />
      <span>Loading passkeys...</span>
    </div>
  {:else if passkeys.length === 0}
    <div class="authrim-passkey-list__empty">
      <div class="authrim-passkey-list__empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/>
        </svg>
      </div>
      <p class="authrim-passkey-list__empty-title">No passkeys yet</p>
      <p class="authrim-passkey-list__empty-desc">
        Add a passkey to sign in quickly and securely
      </p>
    </div>
  {:else}
    <ul class="authrim-passkey-list__items">
      {#each passkeys as passkey, index (passkey.credentialId)}
        <li
          class="authrim-passkey-list__item"
          style="animation-delay: {index * 50}ms"
        >
          <div class="authrim-passkey-list__icon">
            {#if passkey.deviceType === 'platform'}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/>
              </svg>
            {:else}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/>
              </svg>
            {/if}
          </div>

          <div class="authrim-passkey-list__info">
            <div class="authrim-passkey-list__name-row">
              <span class="authrim-passkey-list__name">
                {passkey.name || 'Passkey'}
              </span>
              {#if passkey.deviceType}
                <Badge size="sm" variant={passkey.deviceType === 'platform' ? 'accent' : 'default'}>
                  {passkey.deviceType === 'platform' ? 'This device' : 'Security key'}
                </Badge>
              {/if}
            </div>
            <div class="authrim-passkey-list__meta">
              {#if passkey.createdAt}
                <span>Added {formatDate(passkey.createdAt)}</span>
              {/if}
              {#if passkey.lastUsedAt}
                <span class="authrim-passkey-list__sep">·</span>
                <span>Last used {formatDate(passkey.lastUsedAt)}</span>
              {/if}
            </div>
          </div>

          <PasskeyDeleteButton
            credentialId={passkey.credentialId}
            loading={deletingId === passkey.credentialId}
            on:confirm={() => dispatch('delete', { credentialId: passkey.credentialId })}
          />
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .authrim-passkey-list__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--authrim-space-3);
    padding: var(--authrim-space-8);
    color: var(--authrim-color-text-secondary);
    font-size: var(--authrim-text-sm);
  }

  .authrim-passkey-list__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--authrim-space-8);
    text-align: center;
  }

  .authrim-passkey-list__empty-icon {
    width: 48px;
    height: 48px;
    margin-bottom: var(--authrim-space-4);
    color: var(--authrim-color-text-muted);
  }

  .authrim-passkey-list__empty-icon svg {
    width: 100%;
    height: 100%;
  }

  .authrim-passkey-list__empty-title {
    margin: 0 0 var(--authrim-space-2);
    font-size: var(--authrim-text-base);
    font-weight: 600;
    color: var(--authrim-color-text);
  }

  .authrim-passkey-list__empty-desc {
    margin: 0;
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-secondary);
    max-width: 280px;
  }

  .authrim-passkey-list__items {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .authrim-passkey-list__item {
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

  .authrim-passkey-list__item:last-child {
    border-bottom: none;
  }

  .authrim-passkey-list__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--authrim-color-bg-subtle);
    border-radius: var(--authrim-radius-md);
    color: var(--authrim-color-text-secondary);
  }

  .authrim-passkey-list__icon svg {
    width: 20px;
    height: 20px;
  }

  .authrim-passkey-list__info {
    flex: 1;
    min-width: 0;
  }

  .authrim-passkey-list__name-row {
    display: flex;
    align-items: center;
    gap: var(--authrim-space-2);
    flex-wrap: wrap;
  }

  .authrim-passkey-list__name {
    font-size: var(--authrim-text-sm);
    font-weight: 500;
    color: var(--authrim-color-text);
    letter-spacing: var(--authrim-tracking-tight);
  }

  .authrim-passkey-list__meta {
    display: flex;
    align-items: center;
    gap: var(--authrim-space-1);
    margin-top: var(--authrim-space-1);
    font-size: var(--authrim-text-xs);
    color: var(--authrim-color-text-muted);
  }

  .authrim-passkey-list__sep {
    color: var(--authrim-color-border-strong);
  }
</style>
