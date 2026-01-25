<!--
  Spinner Component
  Animated loading indicator with refined motion
-->
<script lang="ts">
  import type { Size } from '../types.js';

  export let size: Size = 'md';
  let className = '';
  export { className as class };
</script>

<svg
  class="authrim-spinner authrim-spinner--{size} {className}"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
  {...$$restProps}
>
  <circle
    class="authrim-spinner__track"
    cx="12"
    cy="12"
    r="10"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
  />
  <circle
    class="authrim-spinner__indicator"
    cx="12"
    cy="12"
    r="10"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-dasharray="62.83"
    stroke-dashoffset="47.12"
  />
</svg>

<style>
  .authrim-spinner {
    display: inline-block;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .authrim-spinner--sm {
    width: 16px;
    height: 16px;
  }

  .authrim-spinner--md {
    width: 24px;
    height: 24px;
  }

  .authrim-spinner--lg {
    width: 32px;
    height: 32px;
  }

  .authrim-spinner__track {
    opacity: 0.15;
  }

  .authrim-spinner__indicator {
    opacity: 0.9;
  }
</style>
