<!--
  ConsentTemplate
  - 認可UIの「枠」を提供する
  - ポリシー判断・遷移はSDK hook側に委譲する
  - スコープ表示とユーザー選択のUIのみ担当
-->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Card from "../shared/Card.svelte";
  import Button from "../shared/Button.svelte";
  import Alert from "../shared/Alert.svelte";
  import Spinner from "../shared/Spinner.svelte";
  import ClientInfo from "../forms/ClientInfo.svelte";
  import ConsentScopesList from "../forms/ConsentScopesList.svelte";
  import OrgSelector from "../forms/OrgSelector.svelte";
  import type { ClientInfoData } from "../forms/ClientInfo.svelte";
  import type { ScopeItem } from "../forms/ConsentScopesList.svelte";
  import type { OrgItem } from "../forms/OrgSelector.svelte";

  // Data props
  export let client: ClientInfoData | null = null;
  export let scopes: ScopeItem[] = [];
  export let scopeLabelMap: Record<string, string> = {};
  export let user: {
    id: string;
    email: string;
    name?: string;
    picture?: string;
  } | null = null;
  export let organizations: OrgItem[] = [];
  export let selectedOrgId: string | null = null;
  export let roles: string[] = [];
  export let actingAs: {
    id: string;
    name?: string;
    email: string;
    relationship_type: string;
    permission_level: string;
  } | null = null;

  // Feature flags
  export let showOrgSelector = false;
  export let showActingAs = false;
  export let showRoles = false;

  // State props
  export let loading = false;
  export let allowLoading = false;
  export let denyLoading = false;
  export let error = "";

  // Labels (i18n support)
  export let title = "";
  export let subtitle = "This application is requesting access to your account";
  export let scopesTitle = "This application will be able to:";
  export let userInfoLabel = "Signed in as";
  export let switchAccountLabel = "Not you?";
  export let orgLabel = "Organization";
  export let primaryOrgLabel = "Primary";
  export let rolesLabel = "Your roles";
  export let actingAsTitle = "Delegated Access";
  export let actingAsWarning = "";
  export let allowLabel = "Allow";
  export let denyLabel = "Deny";
  export let trustedLabel = "Trusted";
  export let privacyPolicyLabel = "Privacy Policy";
  export let termsLabel = "Terms of Service";

  let className = "";
  export { className as class };

  const dispatch = createEventDispatcher<{
    allow: { selectedOrgId: string | null; actingAsUserId?: string };
    deny: void;
    "switch-account": void;
    "org-change": { orgId: string | null };
    "dismiss-error": void;
  }>();

  function handleAllow() {
    dispatch("allow", {
      selectedOrgId,
      actingAsUserId: actingAs?.id,
    });
  }

  function handleOrgChange(e: CustomEvent<{ orgId: string | null }>) {
    selectedOrgId = e.detail.orgId;
    dispatch("org-change", e.detail);
  }

  $: selectedOrg = organizations.find((o) => o.id === selectedOrgId) || null;
</script>

<div class="authrim-consent-template {className}">
  {#if loading}
    <Card padding="lg" shadow="lg" class="authrim-consent-template__card">
      <div class="authrim-consent-template__loading">
        <Spinner size="lg" />
        <p class="authrim-consent-template__loading-text">Loading...</p>
      </div>
    </Card>
  {:else if client}
    <Card padding="lg" shadow="lg" class="authrim-consent-template__card">
      {#if title}
        <h2 class="authrim-consent-template__title">{title}</h2>
      {/if}
      <!-- Client info -->
      <ClientInfo {client} {trustedLabel} {privacyPolicyLabel} {termsLabel} />

      <p class="authrim-consent-template__subtitle">{subtitle}</p>

      {#if error}
        <Alert
          variant="error"
          dismissible
          on:dismiss={() => dispatch("dismiss-error")}
        >
          {error}
        </Alert>
      {/if}

      <!-- Acting-As Warning -->
      {#if actingAs && showActingAs}
        <div class="authrim-consent-template__acting-as">
          <svg
            class="authrim-consent-template__acting-as-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clip-rule="evenodd"
            />
          </svg>
          <div>
            <p class="authrim-consent-template__acting-as-title">
              {actingAsTitle}
            </p>
            <p class="authrim-consent-template__acting-as-name">
              Acting on behalf of {actingAs.name || actingAs.email}
            </p>
            {#if actingAsWarning}
              <p class="authrim-consent-template__acting-as-warn">
                {actingAsWarning}
              </p>
            {/if}
          </div>
        </div>
      {/if}

      <div class="authrim-consent-template__body">
        <!-- Organization Selector -->
        {#if showOrgSelector && organizations.length > 1}
          <OrgSelector
            {organizations}
            {selectedOrgId}
            label={orgLabel}
            primaryLabel={primaryOrgLabel}
            on:change={handleOrgChange}
          />
        {:else if selectedOrg}
          <div class="authrim-consent-template__org-display">
            <p class="authrim-consent-template__org-label">{orgLabel}</p>
            <p class="authrim-consent-template__org-name">
              {selectedOrg.name}
              {#if selectedOrg.is_primary}
                <span class="authrim-consent-template__org-primary"
                  >({primaryOrgLabel})</span
                >
              {/if}
            </p>
          </div>
        {/if}

        <!-- Roles -->
        {#if showRoles && roles.length > 0}
          <div class="authrim-consent-template__roles">
            <p class="authrim-consent-template__roles-label">{rolesLabel}</p>
            <div class="authrim-consent-template__roles-list">
              {#each roles as role (role)}
                <span class="authrim-consent-template__role-badge">{role}</span>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Scopes -->
        <div class="authrim-consent-template__scopes-section">
          <h3 class="authrim-consent-template__scopes-title">{scopesTitle}</h3>
          <ConsentScopesList {scopes} labelMap={scopeLabelMap} />
        </div>

        <!-- User Info -->
        {#if user}
          <div class="authrim-consent-template__user">
            <p class="authrim-consent-template__user-label">{userInfoLabel}</p>
            <div class="authrim-consent-template__user-info">
              {#if user.picture}
                <img
                  src={user.picture}
                  alt={user.name || user.email}
                  class="authrim-consent-template__user-avatar"
                />
              {:else}
                <div class="authrim-consent-template__user-avatar-placeholder">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path
                      d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z"
                    />
                  </svg>
                </div>
              {/if}
              <div>
                {#if user.name}
                  <p class="authrim-consent-template__user-name">{user.name}</p>
                {/if}
                <p class="authrim-consent-template__user-email">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              class="authrim-consent-template__switch-account"
              on:click={() => dispatch("switch-account")}
            >
              {switchAccountLabel}
            </button>
          </div>
        {/if}
      </div>

      <!-- Actions -->
      <div class="authrim-consent-template__actions">
        <Button
          variant="secondary"
          fullWidth
          loading={denyLoading}
          disabled={allowLoading}
          on:click={() => dispatch("deny")}
        >
          {denyLabel}
        </Button>
        <Button
          variant="primary"
          fullWidth
          loading={allowLoading}
          disabled={denyLoading}
          on:click={handleAllow}
        >
          {allowLabel}
        </Button>
      </div>
    </Card>
  {:else}
    <!-- Error: no data -->
    <Card padding="lg" shadow="lg" class="authrim-consent-template__card">
      <div class="authrim-consent-template__error">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          class="authrim-consent-template__error-icon"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
            clip-rule="evenodd"
          />
        </svg>
        <p class="authrim-consent-template__error-text">
          {error || "Failed to load consent data"}
        </p>
      </div>
    </Card>
  {/if}
</div>

<style>
  .authrim-consent-template {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: var(--authrim-space-4);
    background: linear-gradient(
      135deg,
      var(--authrim-color-bg-subtle) 0%,
      var(--authrim-color-bg) 100%
    );
  }

  :global(.authrim-consent-template__card) {
    width: 100%;
    max-width: 560px;
  }

  .authrim-consent-template__title {
    margin: 0 0 var(--authrim-space-4);
    text-align: center;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-xl);
    font-weight: 600;
    color: var(--authrim-color-text);
  }

  .authrim-consent-template__subtitle {
    margin: var(--authrim-space-2) 0 0;
    text-align: center;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-secondary);
  }

  .authrim-consent-template__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--authrim-space-4);
    padding: var(--authrim-space-8) 0;
  }

  .authrim-consent-template__loading-text {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-muted);
  }

  .authrim-consent-template__acting-as {
    display: flex;
    gap: var(--authrim-space-3);
    padding: var(--authrim-space-4);
    margin-top: var(--authrim-space-4);
    background: var(--authrim-color-warning-subtle, #fffbeb);
    border: 1px solid var(--authrim-color-warning, #f59e0b);
    border-radius: var(--authrim-radius-md);
  }

  .authrim-consent-template__acting-as-icon {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    margin-top: 1px;
    color: var(--authrim-color-warning, #f59e0b);
  }

  .authrim-consent-template__acting-as-title {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    font-weight: 500;
    color: var(--authrim-color-warning-text, #92400e);
  }

  .authrim-consent-template__acting-as-name {
    margin: var(--authrim-space-1) 0 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-warning-text, #92400e);
  }

  .authrim-consent-template__acting-as-warn {
    margin: var(--authrim-space-2) 0 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-xs);
    color: var(--authrim-color-warning-text, #92400e);
    opacity: 0.8;
  }

  .authrim-consent-template__body {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-5);
    margin-top: var(--authrim-space-5);
    padding-top: var(--authrim-space-5);
    border-top: 1px solid var(--authrim-color-border);
  }

  .authrim-consent-template__org-display {
    padding: var(--authrim-space-3);
    background: var(--authrim-color-bg-subtle);
    border-radius: var(--authrim-radius-md);
  }

  .authrim-consent-template__org-label {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-xs);
    color: var(--authrim-color-text-muted);
  }

  .authrim-consent-template__org-name {
    margin: var(--authrim-space-1) 0 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    font-weight: 500;
    color: var(--authrim-color-text);
  }

  .authrim-consent-template__org-primary {
    font-size: var(--authrim-text-xs);
    color: var(--authrim-color-primary);
  }

  .authrim-consent-template__roles {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-2);
  }

  .authrim-consent-template__roles-label {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-xs);
    color: var(--authrim-color-text-muted);
  }

  .authrim-consent-template__roles-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--authrim-space-2);
  }

  .authrim-consent-template__role-badge {
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-xs);
    font-weight: 500;
    color: var(--authrim-color-primary);
    background: var(--authrim-color-bg-subtle);
    padding: 2px var(--authrim-space-2);
    border-radius: var(--authrim-radius-full);
  }

  .authrim-consent-template__scopes-section {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-4);
  }

  .authrim-consent-template__scopes-title {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    font-weight: 500;
    color: var(--authrim-color-text);
  }

  .authrim-consent-template__user {
    padding: var(--authrim-space-4);
    background: var(--authrim-color-bg-subtle);
    border-radius: var(--authrim-radius-md);
  }

  .authrim-consent-template__user-label {
    margin: 0 0 var(--authrim-space-2);
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-xs);
    color: var(--authrim-color-text-muted);
  }

  .authrim-consent-template__user-info {
    display: flex;
    align-items: center;
    gap: var(--authrim-space-3);
  }

  .authrim-consent-template__user-avatar {
    width: 40px;
    height: 40px;
    border-radius: var(--authrim-radius-full);
    object-fit: cover;
  }

  .authrim-consent-template__user-avatar-placeholder {
    width: 40px;
    height: 40px;
    border-radius: var(--authrim-radius-full);
    background: var(--authrim-color-bg-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--authrim-color-primary);
  }

  .authrim-consent-template__user-avatar-placeholder svg {
    width: 20px;
    height: 20px;
  }

  .authrim-consent-template__user-name {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    font-weight: 500;
    color: var(--authrim-color-text);
  }

  .authrim-consent-template__user-email {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-secondary);
  }

  .authrim-consent-template__switch-account {
    margin-top: var(--authrim-space-2);
    padding: 0;
    background: transparent;
    border: none;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-xs);
    color: var(--authrim-color-primary);
    cursor: pointer;
    transition: color var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-consent-template__switch-account:hover {
    color: var(--authrim-color-primary-hover);
    text-decoration: underline;
  }

  .authrim-consent-template__actions {
    display: flex;
    gap: var(--authrim-space-3);
    margin-top: var(--authrim-space-5);
  }

  .authrim-consent-template__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--authrim-space-4);
    padding: var(--authrim-space-8) 0;
    text-align: center;
  }

  .authrim-consent-template__error-icon {
    width: 48px;
    height: 48px;
    color: var(--authrim-color-error);
  }

  .authrim-consent-template__error-text {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-error);
  }
</style>
