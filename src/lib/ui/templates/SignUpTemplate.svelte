<!--
  SignUpTemplate Component

  Reference implementation for sign-up screens.
  Copy and customize for production use.

  @example
  <SignUpTemplate
    availableProviders={['google', 'github']}
    enablePasskey={true}
    on:passkey-signup={handlePasskeySignup}
    on:social-signup={handleSocialSignup}
    on:email-submit={handleEmailSubmit}
  />
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SocialProvider } from '../../types.js';
  import Card from '../shared/Card.svelte';
  import Button from '../shared/Button.svelte';
  import Input from '../shared/Input.svelte';
  import AuthError from '../helpers/AuthError.svelte';
  import SocialLoginButtons from '../forms/SocialLoginButtons.svelte';
  import OTPInput from '../helpers/OTPInput.svelte';
  import ResendCodeButton from '../helpers/ResendCodeButton.svelte';

  export let availableProviders: SocialProvider[] = [];
  export let enablePasskey = true;
  export let enableEmailCode = true;
  export let loading = false;
  export let loadingProvider: SocialProvider | undefined = undefined;
  export let error = '';
  export let title = 'Create account';
  export let subtitle = 'Get started with your free account';
  let className = '';
  export { className as class };

  const dispatch = createEventDispatcher<{
    'passkey-signup': { name: string };
    'social-signup': { provider: SocialProvider };
    'email-submit': { email: string; name: string };
    'code-submit': { code: string };
    'code-resend': void;
    'dismiss-error': void;
  }>();

  let step: 'form' | 'code' = 'form';
  let name = '';
  let email = '';
  let code = '';
  let resendTime = 0;

  function handlePasskeySignup() {
    if (name.trim()) {
      dispatch('passkey-signup', { name: name.trim() });
    }
  }

  function handleSocialClick(e: CustomEvent<{ provider: SocialProvider }>) {
    dispatch('social-signup', e.detail);
  }

  function handleEmailSubmit() {
    if (email.trim() && name.trim()) {
      dispatch('email-submit', { email: email.trim(), name: name.trim() });
    }
  }

  function handleCodeComplete(e: CustomEvent<{ value: string }>) {
    code = e.detail.value;
    dispatch('code-submit', { code });
  }

  function handleBack() {
    step = 'form';
    code = '';
  }

  export function setStep(newStep: 'form' | 'code') {
    step = newStep;
  }

  export function setResendTime(time: number) {
    resendTime = time;
  }
</script>

<div class="authrim-signup-template {className}">
  <Card padding="lg" shadow="lg" class="authrim-signup-template__card">
    {#if step === 'form'}
      <div class="authrim-signup-template__header">
        <h1 class="authrim-signup-template__title">{title}</h1>
        <p class="authrim-signup-template__subtitle">{subtitle}</p>
      </div>

      {#if error}
        <AuthError message={error} on:dismiss={() => dispatch('dismiss-error')} />
      {/if}

      <div class="authrim-signup-template__content">
        <form on:submit|preventDefault={enablePasskey ? handlePasskeySignup : handleEmailSubmit} class="authrim-signup-template__form">
          <Input
            label="Name"
            placeholder="Your name"
            bind:value={name}
            disabled={loading}
            required
            fullWidth
            size="lg"
          />

          {#if enableEmailCode && !enablePasskey}
            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              bind:value={email}
              disabled={loading}
              required
              fullWidth
              size="lg"
            />
          {/if}

          {#if enablePasskey}
            <Button type="submit" fullWidth size="lg" {loading} disabled={!name.trim()}>
              Create account with Passkey
            </Button>
          {:else if enableEmailCode}
            <Button type="submit" fullWidth size="lg" {loading} disabled={!name.trim() || !email.trim()}>
              Continue
            </Button>
          {/if}
        </form>

        {#if availableProviders.length > 0}
          <div class="authrim-signup-template__divider">
            <span>or sign up with</span>
          </div>

          <SocialLoginButtons
            providers={availableProviders}
            {loading}
            {loadingProvider}
            on:click={handleSocialClick}
          />
        {/if}
      </div>

    {:else}
      <button type="button" class="authrim-signup-template__back" on:click={handleBack}>
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/>
        </svg>
        Back
      </button>

      <div class="authrim-signup-template__header">
        <h1 class="authrim-signup-template__title">Verify your email</h1>
        <p class="authrim-signup-template__subtitle">
          We sent a code to <strong>{email}</strong>
        </p>
      </div>

      {#if error}
        <AuthError message={error} on:dismiss={() => dispatch('dismiss-error')} />
      {/if}

      <div class="authrim-signup-template__code">
        <OTPInput
          bind:value={code}
          disabled={loading}
          on:complete={handleCodeComplete}
        />

        <div class="authrim-signup-template__resend">
          <span>Didn't receive the code?</span>
          <ResendCodeButton
            remainingTime={resendTime}
            {loading}
            on:click={() => dispatch('code-resend')}
          />
        </div>

        <Button
          fullWidth
          size="lg"
          {loading}
          disabled={code.length < 6}
          on:click={() => dispatch('code-submit', { code })}
        >
          Verify
        </Button>
      </div>
    {/if}
  </Card>

  {#if step === 'form'}
    <div class="authrim-signup-template__footer">
      <slot name="footer">
        <p>
          Already have an account?
          <a href="/login" class="authrim-signup-template__link">Sign in</a>
        </p>
      </slot>
    </div>
  {/if}
</div>

<style>
  .authrim-signup-template {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: var(--authrim-space-4);
    background:
      linear-gradient(135deg, var(--authrim-color-bg-subtle) 0%, var(--authrim-color-bg) 100%);
  }

  :global(.authrim-signup-template__card) {
    width: 100%;
    max-width: 420px;
  }

  .authrim-signup-template__header {
    text-align: center;
    margin-bottom: var(--authrim-space-6);
  }

  .authrim-signup-template__title {
    margin: 0 0 var(--authrim-space-2);
    font-size: var(--authrim-text-2xl);
    font-weight: 700;
    color: var(--authrim-color-text);
    letter-spacing: var(--authrim-tracking-tight);
  }

  .authrim-signup-template__subtitle {
    margin: 0;
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-secondary);
    line-height: var(--authrim-leading-relaxed);
  }

  .authrim-signup-template__subtitle strong {
    color: var(--authrim-color-text);
    font-weight: 600;
  }

  .authrim-signup-template__content {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-5);
  }

  .authrim-signup-template__form {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-4);
  }

  .authrim-signup-template__divider {
    display: flex;
    align-items: center;
    gap: var(--authrim-space-3);
    color: var(--authrim-color-text-muted);
    font-size: var(--authrim-text-sm);
  }

  .authrim-signup-template__divider::before,
  .authrim-signup-template__divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--authrim-color-border);
  }

  .authrim-signup-template__back {
    display: inline-flex;
    align-items: center;
    gap: var(--authrim-space-1);
    padding: var(--authrim-space-1) var(--authrim-space-2);
    margin: 0 0 var(--authrim-space-4) calc(-1 * var(--authrim-space-2));
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

  .authrim-signup-template__back:hover {
    color: var(--authrim-color-text);
    background: var(--authrim-color-bg-subtle);
  }

  .authrim-signup-template__back svg {
    width: 18px;
    height: 18px;
  }

  .authrim-signup-template__code {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-5);
  }

  .authrim-signup-template__resend {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--authrim-space-1);
    flex-wrap: wrap;
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-muted);
  }

  .authrim-signup-template__footer {
    text-align: center;
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-secondary);
  }

  .authrim-signup-template__footer p {
    margin: 0;
  }

  .authrim-signup-template__link {
    color: var(--authrim-color-primary);
    font-weight: 500;
    text-decoration: none;
    transition: color var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-signup-template__link:hover {
    color: var(--authrim-color-primary-hover);
    text-decoration: underline;
  }
</style>
