<!--
  LoginTemplate Component

  Reference implementation for login screens.
  Copy and customize for production use.

  @example
  <LoginTemplate
    availableProviders={['google', 'github']}
    enablePasskey={true}
    enableEmailCode={true}
    on:passkey-login={handlePasskeyLogin}
    on:social-login={handleSocialLogin}
    on:email-submit={handleEmailSubmit}
    on:code-submit={handleCodeSubmit}
  />
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SocialProvider } from '../../types.js';
  import type { EmailCodeStep } from '../types.js';
  import Card from '../shared/Card.svelte';
  import Button from '../shared/Button.svelte';
  import AuthError from '../helpers/AuthError.svelte';
  import EmailCodeForm from '../forms/EmailCodeForm.svelte';
  import SocialLoginButtons from '../forms/SocialLoginButtons.svelte';
  import PasskeyConditionalInput from '../forms/PasskeyConditionalInput.svelte';

  export let availableProviders: SocialProvider[] = [];
  export let enablePasskey = true;
  export let enableEmailCode = true;
  export let loading = false;
  export let loadingProvider: SocialProvider | undefined = undefined;
  export let error = '';
  export let title = 'Welcome back';
  export let subtitle = 'Sign in to your account';
  let className = '';
  export { className as class };

  const dispatch = createEventDispatcher<{
    'passkey-login': void;
    'social-login': { provider: SocialProvider };
    'email-submit': { email: string };
    'code-submit': { code: string };
    'code-resend': void;
    'dismiss-error': void;
  }>();

  let emailStep: EmailCodeStep = 'email';
  let email = '';

  function handlePasskeySubmit() {
    dispatch('passkey-login');
  }

  function handleSocialClick(e: CustomEvent<{ provider: SocialProvider }>) {
    dispatch('social-login', e.detail);
  }

  function handleEmailSubmit(e: CustomEvent<{ email: string }>) {
    email = e.detail.email;
    dispatch('email-submit', e.detail);
  }

  function handleCodeSubmit(e: CustomEvent<{ code: string }>) {
    dispatch('code-submit', e.detail);
  }

  function handleBack() {
    emailStep = 'email';
  }

  export function setEmailStep(step: EmailCodeStep) {
    emailStep = step;
  }
</script>

<div class="authrim-login-template {className}">
  <Card padding="lg" shadow="lg" class="authrim-login-template__card">
    <div class="authrim-login-template__header">
      <h1 class="authrim-login-template__title">{title}</h1>
      <p class="authrim-login-template__subtitle">{subtitle}</p>
    </div>

    {#if error}
      <AuthError message={error} on:dismiss={() => dispatch('dismiss-error')} />
    {/if}

    <div class="authrim-login-template__content">
      {#if enablePasskey && emailStep === 'email'}
        <div class="authrim-login-template__passkey">
          <PasskeyConditionalInput
            placeholder="Email or username"
            disabled={loading}
          />
          <Button
            fullWidth
            size="lg"
            {loading}
            on:click={handlePasskeySubmit}
          >
            Continue with Passkey
          </Button>
        </div>
      {/if}

      {#if enableEmailCode}
        {#if enablePasskey && emailStep === 'email'}
          <div class="authrim-login-template__divider">
            <span>or continue with email</span>
          </div>
        {/if}

        <EmailCodeForm
          step={emailStep}
          {email}
          {loading}
          on:submit-email={handleEmailSubmit}
          on:submit-code={handleCodeSubmit}
          on:back={handleBack}
          on:resend={() => dispatch('code-resend')}
        />
      {/if}

      {#if availableProviders.length > 0 && emailStep === 'email'}
        <div class="authrim-login-template__divider">
          <span>or</span>
        </div>

        <SocialLoginButtons
          providers={availableProviders}
          {loading}
          {loadingProvider}
          on:click={handleSocialClick}
        />
      {/if}
    </div>

    <div slot="footer" class="authrim-login-template__footer">
      <slot name="footer">
        <p>
          Don't have an account?
          <a href="/signup" class="authrim-login-template__link">Sign up</a>
        </p>
      </slot>
    </div>
  </Card>
</div>

<style>
  .authrim-login-template {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: var(--authrim-space-4);
    background:
      linear-gradient(135deg, var(--authrim-color-bg-subtle) 0%, var(--authrim-color-bg) 100%);
  }

  :global(.authrim-login-template__card) {
    width: 100%;
    max-width: 420px;
  }

  .authrim-login-template__header {
    text-align: center;
    margin-bottom: var(--authrim-space-6);
  }

  .authrim-login-template__title {
    margin: 0 0 var(--authrim-space-2);
    font-size: var(--authrim-text-2xl);
    font-weight: 700;
    color: var(--authrim-color-text);
    letter-spacing: var(--authrim-tracking-tight);
  }

  .authrim-login-template__subtitle {
    margin: 0;
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-secondary);
  }

  .authrim-login-template__content {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-5);
  }

  .authrim-login-template__passkey {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-4);
  }

  .authrim-login-template__divider {
    display: flex;
    align-items: center;
    gap: var(--authrim-space-3);
    color: var(--authrim-color-text-muted);
    font-size: var(--authrim-text-sm);
  }

  .authrim-login-template__divider::before,
  .authrim-login-template__divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--authrim-color-border);
  }

  .authrim-login-template__footer {
    text-align: center;
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-secondary);
  }

  .authrim-login-template__footer p {
    margin: 0;
  }

  .authrim-login-template__link {
    color: var(--authrim-color-primary);
    font-weight: 500;
    text-decoration: none;
    transition: color var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-login-template__link:hover {
    color: var(--authrim-color-primary-hover);
    text-decoration: underline;
  }
</style>
