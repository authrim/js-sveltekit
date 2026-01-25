/**
 * @authrim/sveltekit UI Components
 *
 * Styled, accessible UI components for authentication flows.
 * These components are thin facades - they handle styling and events,
 * while parent components control auth API calls.
 *
 * @example
 * ```svelte
 * <script>
 *   import { getAuthContext } from '@authrim/sveltekit';
 *   import { SocialLoginButtons, AuthError } from '@authrim/sveltekit/ui';
 *
 *   const auth = getAuthContext();
 *   let loading = false;
 *   let error = null;
 *
 *   async function handleSocialClick(e) {
 *     const { provider } = e.detail;
 *     loading = true;
 *     const result = await auth.social.loginWithPopup(provider);
 *     if (result.error) error = result.error.message;
 *     loading = false;
 *   }
 * </script>
 *
 * <SocialLoginButtons
 *   providers={['google', 'github']}
 *   {loading}
 *   on:click={handleSocialClick}
 * />
 * {#if error}<AuthError message={error} on:dismiss={() => error = null} />{/if}
 * ```
 */

// Types
export type {
  Size,
  Variant,
  EmailCodeStep,
  PasskeyItemDisplay,
  SessionItemDisplay,
  LinkedAccountDisplay,
  EmailSubmitEvent,
  CodeSubmitEvent,
  SocialClickEvent,
  PasskeyDeleteEvent,
  SessionRevokeEvent,
  AccountUnlinkEvent,
} from './types.js';

// Context
export {
  type Theme,
  type ThemeContext,
  THEME_CONTEXT_KEY,
  createThemeContext,
  getThemeContext,
  hasThemeContext,
  loadSavedTheme,
} from './context.js';

// Shared Components
export { Button, Input, Card, Spinner, Badge } from './shared/index.js';

// Helper Components
export { AuthLoading, AuthError, OTPInput, ResendCodeButton } from './helpers/index.js';

// Form Components
export { EmailCodeForm, PasskeyConditionalInput, SocialLoginButtons } from './forms/index.js';

// Passkey Components
export { PasskeyList, PasskeyRegisterButton, PasskeyDeleteButton } from './passkey/index.js';

// Session Components
export { SessionList, SessionRevokeButton, SessionExpiryIndicator } from './session/index.js';

// Account Components
export { LinkedAccountsList, LinkAccountButton, UnlinkAccountButton } from './account/index.js';
