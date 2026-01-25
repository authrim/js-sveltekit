<!--
  SocialLoginButtons Component
  Social provider login buttons with provider icons
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SocialProvider } from '../../types.js';
  import Spinner from '../shared/Spinner.svelte';

  export let providers: SocialProvider[] = [];
  export let layout: 'horizontal' | 'vertical' | 'grid' = 'vertical';
  export let loading = false;
  export let loadingProvider: SocialProvider | undefined = undefined;
  export let disabled = false;
  export let compact = false;
  let className = '';
  export { className as class };

  const dispatch = createEventDispatcher<{
    click: { provider: SocialProvider };
  }>();

  const providerConfig: Record<SocialProvider, { name: string; color: string }> = {
    google: { name: 'Google', color: '#4285F4' },
    apple: { name: 'Apple', color: '#000000' },
    microsoft: { name: 'Microsoft', color: '#00A4EF' },
    github: { name: 'GitHub', color: '#24292F' },
    facebook: { name: 'Facebook', color: '#1877F2' },
  };

  function handleClick(provider: SocialProvider) {
    if (!disabled && !loading) {
      dispatch('click', { provider });
    }
  }
</script>

<div
  class="authrim-social authrim-social--{layout} {className}"
  class:authrim-social--compact={compact}
  {...$$restProps}
>
  {#each providers as provider}
    {@const config = providerConfig[provider] || { name: provider, color: '#666' }}
    {@const isLoading = loading && loadingProvider === provider}
    <button
      type="button"
      class="authrim-social__btn"
      class:authrim-social__btn--loading={isLoading}
      disabled={disabled || loading}
      on:click={() => handleClick(provider)}
      style="--provider-color: {config.color}"
    >
      {#if isLoading}
        <span class="authrim-social__spinner">
          <Spinner size="sm" />
        </span>
      {:else}
        <span class="authrim-social__icon">
          {#if provider === 'google'}
            <svg viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          {:else if provider === 'apple'}
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
            </svg>
          {:else if provider === 'microsoft'}
            <svg viewBox="0 0 24 24">
              <path fill="#F25022" d="M1 1h10v10H1z"/>
              <path fill="#00A4EF" d="M13 1h10v10H13z"/>
              <path fill="#7FBA00" d="M1 13h10v10H1z"/>
              <path fill="#FFB900" d="M13 13h10v10H13z"/>
            </svg>
          {:else if provider === 'github'}
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
          {:else if provider === 'facebook'}
            <svg viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          {:else}
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          {/if}
        </span>
      {/if}
      {#if !compact}
        <span class="authrim-social__label">
          Continue with {config.name}
        </span>
      {/if}
    </button>
  {/each}
</div>

<style>
  .authrim-social {
    display: flex;
    gap: var(--authrim-space-3);
  }

  .authrim-social--vertical {
    flex-direction: column;
  }

  .authrim-social--horizontal {
    flex-direction: row;
    justify-content: center;
  }

  .authrim-social--grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .authrim-social--compact {
    gap: var(--authrim-space-2);
  }

  .authrim-social--compact.authrim-social--horizontal,
  .authrim-social--compact.authrim-social--grid {
    justify-content: center;
  }

  .authrim-social__btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--authrim-space-3);
    height: 48px;
    padding: 0 var(--authrim-space-5);
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    font-weight: 500;
    color: var(--authrim-color-text);
    background: var(--authrim-color-bg);
    border: 1.5px solid var(--authrim-color-border);
    border-radius: var(--authrim-radius-md);
    cursor: pointer;
    transition:
      background-color var(--authrim-duration-fast) var(--authrim-ease-default),
      border-color var(--authrim-duration-fast) var(--authrim-ease-default),
      box-shadow var(--authrim-duration-fast) var(--authrim-ease-default),
      transform var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-social--compact .authrim-social__btn {
    width: 48px;
    height: 48px;
    padding: 0;
    border-radius: var(--authrim-radius-md);
  }

  .authrim-social__btn:hover:not(:disabled) {
    background: var(--authrim-color-bg-subtle);
    border-color: var(--authrim-color-border-strong);
  }

  .authrim-social__btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .authrim-social__btn:focus-visible {
    outline: none;
    box-shadow: var(--authrim-shadow-focus);
  }

  .authrim-social__btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .authrim-social__spinner {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .authrim-social__btn--loading .authrim-social__icon,
  .authrim-social__btn--loading .authrim-social__label {
    visibility: hidden;
  }

  .authrim-social__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .authrim-social__icon svg {
    width: 100%;
    height: 100%;
  }

  .authrim-social__label {
    white-space: nowrap;
  }
</style>
