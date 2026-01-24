<!--
  UserProfile Component

  Displays user information from the auth stores.
-->
<script lang="ts">
  import { getAuthContext } from '../utils/context.js';

  /** Show avatar */
  export let showAvatar: boolean = true;

  /** Show email */
  export let showEmail: boolean = true;

  /** Custom class */
  let className: string = '';
  export { className as class };

  const auth = getAuthContext();
  const { user, isAuthenticated } = auth.stores;
</script>

{#if $isAuthenticated && $user}
  <div class={className} {...$$restProps}>
    <slot name="avatar" user={$user}>
      {#if showAvatar && $user.picture}
        <img src={$user.picture} alt={$user.name || 'User avatar'} class="authrim-avatar" />
      {/if}
    </slot>

    <slot name="info" user={$user}>
      <div class="authrim-user-info">
        {#if $user.name}
          <span class="authrim-user-name">{$user.name}</span>
        {/if}
        {#if showEmail && $user.email}
          <span class="authrim-user-email">{$user.email}</span>
        {/if}
      </div>
    </slot>

    <slot user={$user} />
  </div>
{:else}
  <slot name="unauthenticated">
    <!-- Empty by default -->
  </slot>
{/if}

<style>
  .authrim-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }

  .authrim-user-info {
    display: flex;
    flex-direction: column;
  }

  .authrim-user-name {
    font-weight: 500;
  }

  .authrim-user-email {
    font-size: 0.875em;
    opacity: 0.7;
  }
</style>
