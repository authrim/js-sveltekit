<!--
  PasskeyRegisterButton Component
  Button to register a new passkey
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '../shared/Button.svelte';

  export let loading = false;
  export let disabled = false;
  export let variant: 'primary' | 'secondary' | 'outline' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let fullWidth = false;
  let className = '';
  export { className as class };

  const dispatch = createEventDispatcher<{ click: void }>();
</script>

<Button
  {variant}
  {size}
  {loading}
  {disabled}
  {fullWidth}
  class="authrim-passkey-register {className}"
  on:click={() => dispatch('click')}
  {...$$restProps}
>
  <svg
    class="authrim-passkey-register__icon"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M13.125 4.375a2.5 2.5 0 012.5 2.5m2.5 0a5 5 0 01-5.858 4.927c-.469-.081-.966.021-1.302.358L8.75 14.375H6.875v1.875H5v1.875H2.188v-2.348c0-.498.197-.976.549-1.327l5.416-5.416c.337-.336.44-.833.358-1.302A5 5 0 1118.125 6.875z"/>
  </svg>
  <slot>Add passkey</slot>
</Button>

<style>
  :global(.authrim-passkey-register) {
    gap: var(--authrim-space-2);
  }

  .authrim-passkey-register__icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
</style>
