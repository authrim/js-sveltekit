<!--
  EmailCodeForm Component
  Two-step email + code verification form
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { EmailCodeStep } from '../types.js';
  import Button from '../shared/Button.svelte';
  import Input from '../shared/Input.svelte';
  import AuthError from '../helpers/AuthError.svelte';
  import OTPInput from '../helpers/OTPInput.svelte';
  import ResendCodeButton from '../helpers/ResendCodeButton.svelte';

  export let step: EmailCodeStep = 'email';
  export let email = '';
  export let maskedEmail = '';
  export let loading = false;
  export let error = '';
  export let resendRemainingTime = 0;
  let className = '';
  export { className as class };

  const dispatch = createEventDispatcher<{
    'submit-email': { email: string };
    'submit-code': { code: string };
    'dismiss-error': void;
    back: void;
    resend: void;
  }>();

  let code = '';
  let emailInput = '';

  $: emailInput = email;

  function handleEmailSubmit() {
    if (emailInput.trim() && !loading) {
      dispatch('submit-email', { email: emailInput.trim() });
    }
  }

  function handleCodeComplete(e: CustomEvent<{ value: string }>) {
    code = e.detail.value;
    if (!loading) {
      dispatch('submit-code', { code });
    }
  }

  function handleBack() {
    code = '';
    dispatch('back');
  }
</script>

<div class="authrim-email-form {className}" {...$$restProps}>
  {#if step === 'email'}
    <form on:submit|preventDefault={handleEmailSubmit} class="authrim-email-form__form">
      <div class="authrim-email-form__header">
        <h2 class="authrim-email-form__title">Sign in with email</h2>
        <p class="authrim-email-form__desc">
          Enter your email and we'll send you a verification code
        </p>
      </div>

      {#if error}
        <AuthError message={error} on:dismiss={() => dispatch('dismiss-error')} />
      {/if}

      <Input
        type="email"
        label="Email address"
        placeholder="you@example.com"
        bind:value={emailInput}
        disabled={loading}
        required
        fullWidth
        size="lg"
        error={!!error}
      />

      <Button type="submit" {loading} fullWidth size="lg">
        Continue
      </Button>
    </form>
  {:else}
    <div class="authrim-email-form__code">
      <button
        type="button"
        class="authrim-email-form__back"
        on:click={handleBack}
        disabled={loading}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" class="authrim-email-form__back-icon">
          <path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/>
        </svg>
        Back
      </button>

      <div class="authrim-email-form__header">
        <h2 class="authrim-email-form__title">Check your email</h2>
        <p class="authrim-email-form__desc">
          We sent a code to <strong>{maskedEmail || email}</strong>
        </p>
      </div>

      {#if error}
        <AuthError message={error} on:dismiss={() => dispatch('dismiss-error')} />
      {/if}

      <div class="authrim-email-form__otp-wrap">
        <OTPInput
          bind:value={code}
          disabled={loading}
          error={!!error}
          on:complete={handleCodeComplete}
        />
      </div>

      <div class="authrim-email-form__resend">
        <span class="authrim-email-form__resend-text">Didn't receive the code?</span>
        <ResendCodeButton
          remainingTime={resendRemainingTime}
          {loading}
          on:click={() => dispatch('resend')}
        />
      </div>

      <Button
        type="button"
        {loading}
        fullWidth
        size="lg"
        disabled={code.length < 6}
        on:click={() => dispatch('submit-code', { code })}
      >
        Verify
      </Button>
    </div>
  {/if}
</div>

<style>
  .authrim-email-form__form,
  .authrim-email-form__code {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-5);
  }

  .authrim-email-form__header {
    text-align: center;
  }

  .authrim-email-form__title {
    margin: 0 0 var(--authrim-space-2);
    font-size: var(--authrim-text-xl);
    font-weight: 700;
    color: var(--authrim-color-text);
    letter-spacing: var(--authrim-tracking-tight);
  }

  .authrim-email-form__desc {
    margin: 0;
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-secondary);
    line-height: var(--authrim-leading-relaxed);
  }

  .authrim-email-form__desc strong {
    color: var(--authrim-color-text);
    font-weight: 600;
  }

  .authrim-email-form__back {
    display: inline-flex;
    align-items: center;
    gap: var(--authrim-space-1);
    padding: var(--authrim-space-1) var(--authrim-space-2);
    margin: 0 0 var(--authrim-space-2) calc(-1 * var(--authrim-space-2));
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    font-weight: 500;
    color: var(--authrim-color-text-secondary);
    background: transparent;
    border: none;
    border-radius: var(--authrim-radius-sm);
    cursor: pointer;
    transition:
      color var(--authrim-duration-fast) var(--authrim-ease-default),
      background-color var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-email-form__back:hover:not(:disabled) {
    color: var(--authrim-color-text);
    background: var(--authrim-color-bg-subtle);
  }

  .authrim-email-form__back:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .authrim-email-form__back-icon {
    width: 18px;
    height: 18px;
  }

  .authrim-email-form__otp-wrap {
    padding: var(--authrim-space-4) 0;
  }

  .authrim-email-form__resend {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--authrim-space-1);
    flex-wrap: wrap;
  }

  .authrim-email-form__resend-text {
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-muted);
  }
</style>
