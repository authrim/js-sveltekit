/**
 * Authrim UI Component Types
 */

import type { SocialProvider } from "../types.js";

// =============================================================================
// Common Types
// =============================================================================

export type Size = "sm" | "md" | "lg";
export type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";

// =============================================================================
// Form Types
// =============================================================================

export type EmailCodeStep = "email" | "code";

export interface EmailCodeFormProps {
  step: EmailCodeStep;
  email: string;
  maskedEmail?: string;
  loading?: boolean;
  error?: string;
}

export interface SocialLoginButtonsProps {
  providers: SocialProvider[];
  layout?: "horizontal" | "vertical" | "grid";
  loading?: boolean;
  loadingProvider?: SocialProvider;
  disabled?: boolean;
}

// =============================================================================
// Passkey Types
// =============================================================================

export interface PasskeyItemDisplay {
  credentialId: string;
  name?: string;
  createdAt?: Date;
  lastUsedAt?: Date;
  deviceType?: "platform" | "cross-platform";
}

export interface PasskeyListProps {
  passkeys: PasskeyItemDisplay[];
  loading?: boolean;
  deletingId?: string;
}

// =============================================================================
// Session Types
// =============================================================================

export interface SessionItemDisplay {
  sessionId: string;
  deviceName?: string;
  browser?: string;
  os?: string;
  ip?: string;
  location?: string;
  createdAt?: Date;
  lastActiveAt?: Date;
  expiresAt?: Date;
  isCurrent?: boolean;
}

export interface SessionListProps {
  sessions: SessionItemDisplay[];
  currentSessionId?: string;
  loading?: boolean;
  revokingId?: string;
}

// =============================================================================
// Account Types
// =============================================================================

export interface LinkedAccountDisplay {
  accountId: string;
  provider: SocialProvider;
  email?: string;
  name?: string;
  linkedAt?: Date;
}

export interface LinkedAccountsListProps {
  accounts: LinkedAccountDisplay[];
  loading?: boolean;
  unlinkingId?: string;
}

// =============================================================================
// Helper Types
// =============================================================================

export interface AuthLoadingProps {
  message?: string;
  size?: Size;
}

export interface AuthErrorProps {
  message: string;
  dismissible?: boolean;
}

export interface OTPInputProps {
  length?: number;
  value: string;
  disabled?: boolean;
}

export interface ResendCodeButtonProps {
  disabled?: boolean;
  remainingTime?: number;
}

// =============================================================================
// Event Types
// =============================================================================

export interface EmailSubmitEvent {
  email: string;
}

export interface CodeSubmitEvent {
  code: string;
}

export interface SocialClickEvent {
  provider: SocialProvider;
}

export interface PasskeyDeleteEvent {
  credentialId: string;
}

export interface SessionRevokeEvent {
  sessionId: string;
}

export interface AccountUnlinkEvent {
  accountId: string;
  provider: SocialProvider;
}

// =============================================================================
// Alert Types
// =============================================================================

export type AlertVariant = "success" | "error" | "warning" | "info";

// =============================================================================
// Consent Types
// =============================================================================

export interface ConsentAllowEvent {
  selectedOrgId: string | null;
  actingAsUserId?: string;
}

export interface OrgChangeEvent {
  orgId: string | null;
}

// =============================================================================
// Device Flow Types
// =============================================================================

export interface DeviceCodeEvent {
  userCode: string;
}

export interface DeviceCodeChangeEvent {
  value: string;
}

// =============================================================================
// CIBA Types
// =============================================================================

export interface CIBAApproveEvent {
  authReqId: string;
}

export interface CIBADenyEvent {
  authReqId: string;
}

// =============================================================================
// Reauth Types
// =============================================================================

export interface ReauthEvent {
  challengeId: string;
}

export interface ReauthSocialEvent {
  challengeId: string;
  provider: import("../types.js").SocialProvider;
}

// =============================================================================
// Language Types
// =============================================================================

export interface LanguageChangeEvent {
  locale: string;
}

// =============================================================================
// Template Types
// =============================================================================

export interface LoginTemplateProps {
  availableProviders?: SocialProvider[];
  enablePasskey?: boolean;
  enableEmailCode?: boolean;
  loading?: boolean;
  error?: string;
}

export interface SignUpTemplateProps {
  availableProviders?: SocialProvider[];
  enablePasskey?: boolean;
  enableEmailCode?: boolean;
  loading?: boolean;
  error?: string;
}

export interface AccountSettingsTemplateProps {
  passkeys?: PasskeyItemDisplay[];
  sessions?: SessionItemDisplay[];
  linkedAccounts?: LinkedAccountDisplay[];
  currentSessionId?: string;
  loading?: boolean;
}
