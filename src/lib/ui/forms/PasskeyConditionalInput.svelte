<!--
  PasskeyConditionalInput Component
  Input field that supports WebAuthn conditional UI (autofill)
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Size } from '../types.js';

  export let value = '';
  export let placeholder = 'Email or username';
  export let disabled = false;
  export let size: Size = 'md';
  export let label = '';
  export let showPasskeyHint = true;
  export let id = `passkey-input-${Math.random().toString(36).slice(2, 9)}`;
  let className = '';
  export { className as class };

  const dispatch = createEventDispatcher<{
    input: { value: string };
    focus: void;
    blur: void;
  }>();

  function handleInput(e: Event) {
    value = (e.target as HTMLInputElement).value;
    dispatch('input', { value });
  }
</script>

<div class="authrim-passkey-input {className}" {...$$restProps}>
  {#if label}
    <label for={id} class="authrim-passkey-input__label">{label}</label>
  {/if}

  <div class="authrim-passkey-input__wrap">
    <input
      {id}
      type="text"
      autocomplete="username webauthn"
      {placeholder}
      {value}
      {disabled}
      class="authrim-passkey-input__field authrim-passkey-input__field--{size}"
      on:input={handleInput}
      on:focus={() => dispatch('focus')}
      on:blur={() => dispatch('blur')}
    />
    {#if showPasskeyHint}
      <div class="authrim-passkey-input__hint" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <circle cx="12" cy="16" r="1"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
    {/if}
  </div>

  {#if showPasskeyHint}
    <p class="authrim-passkey-input__subtext">
      <svg viewBox="0 0 16 16" fill="currentColor" class="authrim-passkey-input__icon">
        <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-.25A.75.75 0 017.25 7h1a.75.75 0 01.75.75v2.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25v-2h-.25a.75.75 0 01-.75-.75zM8 6a1 1 0 100-2 1 1 0 000 2z"/>
      </svg>
      Passkey suggestions will appear as you type
    </p>
  {/if}
</div>

<style>
  .authrim-passkey-input {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-2);
  }

  .authrim-passkey-input__label {
    font-size: var(--authrim-text-sm);
    font-weight: 500;
    color: var(--authrim-color-text);
    letter-spacing: var(--authrim-tracking-tight);
  }

  .authrim-passkey-input__wrap {
    position: relative;
  }

  .authrim-passkey-input__field {
    width: 100%;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    background: var(--authrim-color-bg);
    border: 1.5px solid var(--authrim-color-border);
    border-radius: var(--authrim-radius-md);
    color: var(--authrim-color-text);
    transition:
      border-color var(--authrim-duration-fast) var(--authrim-ease-default),
      box-shadow var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-passkey-input__field::placeholder {
    color: var(--authrim-color-text-muted);
  }

  .authrim-passkey-input__field:hover:not(:disabled):not(:focus) {
    border-color: var(--authrim-color-border-strong);
  }

  .authrim-passkey-input__field:focus {
    outline: none;
    border-color: var(--authrim-color-primary);
    box-shadow: var(--authrim-shadow-focus);
  }

  .authrim-passkey-input__field:disabled {
    background: var(--authrim-color-bg-subtle);
    color: var(--authrim-color-text-muted);
    cursor: not-allowed;
  }

  .authrim-passkey-input__field--sm {
    height: 34px;
    padding: 0 var(--authrim-space-3);
    padding-right: 40px;
  }

  .authrim-passkey-input__field--md {
    height: 42px;
    padding: 0 var(--authrim-space-4);
    padding-right: 44px;
  }

  .authrim-passkey-input__field--lg {
    height: 50px;
    padding: 0 var(--authrim-space-4);
    padding-right: 48px;
    font-size: var(--authrim-text-base);
  }

  .authrim-passkey-input__hint {
    position: absolute;
    right: var(--authrim-space-3);
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: var(--authrim-color-text-muted);
    pointer-events: none;
  }

  .authrim-passkey-input__hint svg {
    width: 18px;
    height: 18px;
  }

  .authrim-passkey-input__subtext {
    display: flex;
    align-items: center;
    gap: var(--authrim-space-1);
    margin: 0;
    font-size: var(--authrim-text-xs);
    color: var(--authrim-color-text-muted);
  }

  .authrim-passkey-input__icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
</style>
