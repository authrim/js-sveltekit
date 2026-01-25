<!--
  SessionList Component
  Display and manage active sessions
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SessionItemDisplay } from '../types.js';
  import Badge from '../shared/Badge.svelte';
  import Spinner from '../shared/Spinner.svelte';
  import SessionRevokeButton from './SessionRevokeButton.svelte';
  import SessionExpiryIndicator from './SessionExpiryIndicator.svelte';

  export let sessions: SessionItemDisplay[] = [];
  export let currentSessionId: string | undefined = undefined;
  export let loading = false;
  export let revokingId: string | undefined = undefined;
  let className = '';
  export { className as class };

  const dispatch = createEventDispatcher<{
    revoke: { sessionId: string };
  }>();

  function formatDate(date: Date | undefined): string {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }
</script>

<div class="authrim-session-list {className}" {...$$restProps}>
  {#if loading && sessions.length === 0}
    <div class="authrim-session-list__loading">
      <Spinner size="md" />
      <span>Loading sessions...</span>
    </div>
  {:else if sessions.length === 0}
    <div class="authrim-session-list__empty">
      <p>No active sessions</p>
    </div>
  {:else}
    <ul class="authrim-session-list__items">
      {#each sessions as session, index (session.sessionId)}
        <!-- isCurrent: session.isCurrent takes precedence if set, otherwise compare with currentSessionId -->
        {@const isCurrent = session.isCurrent ?? session.sessionId === currentSessionId}
        <li
          class="authrim-session-list__item"
          class:authrim-session-list__item--current={isCurrent}
          style="animation-delay: {index * 50}ms"
        >
          <div class="authrim-session-list__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              {#if session.os?.toLowerCase().includes('mobile') || session.os?.toLowerCase().includes('ios') || session.os?.toLowerCase().includes('android')}
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/>
              {:else}
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"/>
              {/if}
            </svg>
          </div>

          <div class="authrim-session-list__info">
            <div class="authrim-session-list__name-row">
              <span class="authrim-session-list__name">
                {session.browser || 'Unknown browser'}
                {#if session.os}
                  <span class="authrim-session-list__os">on {session.os}</span>
                {/if}
              </span>
              {#if isCurrent}
                <Badge size="sm" variant="success" dot>Current</Badge>
              {/if}
            </div>

            <div class="authrim-session-list__meta">
              {#if session.location || session.ip}
                <span class="authrim-session-list__location">
                  {session.location || session.ip}
                </span>
                <span class="authrim-session-list__sep">·</span>
              {/if}
              {#if session.lastActiveAt}
                <span>Active {formatDate(session.lastActiveAt)}</span>
              {:else if session.createdAt}
                <span>Started {formatDate(session.createdAt)}</span>
              {/if}
            </div>

            {#if session.expiresAt}
              <SessionExpiryIndicator expiresAt={session.expiresAt} />
            {/if}
          </div>

          {#if !isCurrent}
            <SessionRevokeButton
              sessionId={session.sessionId}
              loading={revokingId === session.sessionId}
              on:click={() => dispatch('revoke', { sessionId: session.sessionId })}
            />
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .authrim-session-list__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--authrim-space-3);
    padding: var(--authrim-space-8);
    color: var(--authrim-color-text-secondary);
    font-size: var(--authrim-text-sm);
  }

  .authrim-session-list__empty {
    padding: var(--authrim-space-8);
    text-align: center;
    color: var(--authrim-color-text-muted);
    font-size: var(--authrim-text-sm);
  }

  .authrim-session-list__empty p {
    margin: 0;
  }

  .authrim-session-list__items {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .authrim-session-list__item {
    display: flex;
    align-items: flex-start;
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

  .authrim-session-list__item:last-child {
    border-bottom: none;
  }

  .authrim-session-list__item--current {
    background: var(--authrim-color-success-subtle);
  }

  .authrim-session-list__icon {
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

  .authrim-session-list__item--current .authrim-session-list__icon {
    background: var(--authrim-color-bg);
    color: var(--authrim-color-success);
  }

  .authrim-session-list__icon svg {
    width: 20px;
    height: 20px;
  }

  .authrim-session-list__info {
    flex: 1;
    min-width: 0;
  }

  .authrim-session-list__name-row {
    display: flex;
    align-items: center;
    gap: var(--authrim-space-2);
    flex-wrap: wrap;
  }

  .authrim-session-list__name {
    font-size: var(--authrim-text-sm);
    font-weight: 500;
    color: var(--authrim-color-text);
    letter-spacing: var(--authrim-tracking-tight);
  }

  .authrim-session-list__os {
    font-weight: 400;
    color: var(--authrim-color-text-secondary);
  }

  .authrim-session-list__meta {
    display: flex;
    align-items: center;
    gap: var(--authrim-space-1);
    margin-top: var(--authrim-space-1);
    font-size: var(--authrim-text-xs);
    color: var(--authrim-color-text-muted);
  }

  .authrim-session-list__sep {
    color: var(--authrim-color-border-strong);
  }

  .authrim-session-list__location {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
