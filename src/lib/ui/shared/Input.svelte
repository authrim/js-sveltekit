<!--
  Input Component
  Text input with label and error states
-->
<script lang="ts">
  import type { Size } from '../types.js';

  export let type: 'text' | 'email' | 'password' | 'tel' | 'url' = 'text';
  export let size: Size = 'md';
  export let value = '';
  export let placeholder = '';
  export let disabled = false;
  export let error = false;
  export let errorMessage = '';
  export let label = '';
  export let required = false;
  export let fullWidth = false;
  export let id = '';
  let className = '';
  export { className as class };

  // Generate stable ID once on component creation
  const generatedId = `authrim-input-${Math.random().toString(36).slice(2, 9)}`;
  $: inputId = id || generatedId;
  $: hasError = error || !!errorMessage;
</script>

<div
  class="authrim-input-wrap {className}"
  class:authrim-input-wrap--full={fullWidth}
>
  {#if label}
    <label for={inputId} class="authrim-input__label">
      {label}
      {#if required}
        <span class="authrim-input__required" aria-hidden="true">*</span>
      {/if}
    </label>
  {/if}

  <div class="authrim-input__container">
    <input
      id={inputId}
      {type}
      bind:value
      {placeholder}
      {disabled}
      {required}
      class="authrim-input authrim-input--{size}"
      class:authrim-input--error={hasError}
      aria-invalid={hasError}
      aria-describedby={errorMessage ? `${inputId}-error` : undefined}
      on:input
      on:focus
      on:blur
      on:keydown
      on:keyup
      {...$$restProps}
    />
    {#if $$slots.suffix}
      <div class="authrim-input__suffix">
        <slot name="suffix" />
      </div>
    {/if}
  </div>

  {#if errorMessage}
    <p id="{inputId}-error" class="authrim-input__error" role="alert">
      <svg class="authrim-input__error-icon" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 10.5a.75.75 0 110-1.5.75.75 0 010 1.5zM8.75 8a.75.75 0 01-1.5 0V5a.75.75 0 011.5 0v3z"/>
      </svg>
      {errorMessage}
    </p>
  {/if}
</div>

<style>
  .authrim-input-wrap {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-2);
  }

  .authrim-input-wrap--full {
    width: 100%;
  }

  .authrim-input__label {
    font-size: var(--authrim-text-sm);
    font-weight: 500;
    color: var(--authrim-color-text);
    letter-spacing: var(--authrim-tracking-tight);
  }

  .authrim-input__required {
    color: var(--authrim-color-error);
    margin-left: 2px;
  }

  .authrim-input__container {
    position: relative;
    display: flex;
  }

  .authrim-input {
    width: 100%;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    background: var(--authrim-color-bg);
    border: 1.5px solid var(--authrim-color-border);
    border-radius: var(--authrim-radius-md);
    color: var(--authrim-color-text);
    transition:
      border-color var(--authrim-duration-fast) var(--authrim-ease-default),
      box-shadow var(--authrim-duration-fast) var(--authrim-ease-default),
      background-color var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-input::placeholder {
    color: var(--authrim-color-text-muted);
  }

  .authrim-input:hover:not(:disabled):not(:focus) {
    border-color: var(--authrim-color-border-strong);
  }

  .authrim-input:focus {
    outline: none;
    border-color: var(--authrim-color-border-focus);
    box-shadow: var(--authrim-shadow-focus);
  }

  .authrim-input:disabled {
    background: var(--authrim-color-bg-subtle);
    color: var(--authrim-color-text-muted);
    cursor: not-allowed;
  }

  .authrim-input--error {
    border-color: var(--authrim-color-error);
  }

  .authrim-input--error:focus {
    border-color: var(--authrim-color-error);
    box-shadow: var(--authrim-shadow-focus-error);
  }

  /* Sizes */
  .authrim-input--sm {
    height: 34px;
    padding: 0 var(--authrim-space-3);
    border-radius: var(--authrim-radius-sm);
  }

  .authrim-input--md {
    height: 42px;
    padding: 0 var(--authrim-space-3);
  }

  .authrim-input--lg {
    height: 50px;
    padding: 0 var(--authrim-space-4);
    font-size: var(--authrim-text-base);
    border-radius: var(--authrim-radius-lg);
  }

  .authrim-input__suffix {
    position: absolute;
    right: var(--authrim-space-3);
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    color: var(--authrim-color-text-muted);
  }

  .authrim-input__error {
    display: flex;
    align-items: center;
    gap: var(--authrim-space-1);
    font-size: var(--authrim-text-xs);
    color: var(--authrim-color-error);
    margin: 0;
    animation: authrim-fade-up var(--authrim-duration-fast) var(--authrim-ease-out);
  }

  .authrim-input__error-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
</style>
