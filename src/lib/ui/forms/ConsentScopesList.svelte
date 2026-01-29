<!--
  ConsentScopesList Component
  Displays a list of requested OAuth scopes with check icons
-->
<script context="module" lang="ts">
  export interface ScopeItem {
    name: string;
    title: string;
    description: string;
    required: boolean;
  }
</script>

<script lang="ts">
  export let scopes: ScopeItem[] = [];
  /** Optional label map: scope name → display label. Falls back to scope.title or scope.name */
  export let labelMap: Record<string, string> = {};
  let className = "";
  export { className as class };

  function getLabel(scope: ScopeItem): string {
    return labelMap[scope.name] || scope.title || scope.name;
  }
</script>

<ul class="authrim-scopes {className}" role="list" {...$$restProps}>
  {#each scopes as scope (scope.name)}
    <li class="authrim-scopes__item">
      <svg
        class="authrim-scopes__icon"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clip-rule="evenodd"
        />
      </svg>
      <div class="authrim-scopes__content">
        <span class="authrim-scopes__label">{getLabel(scope)}</span>
        {#if scope.description}
          <span class="authrim-scopes__desc">{scope.description}</span>
        {/if}
      </div>
      {#if scope.required}
        <span class="authrim-scopes__required">Required</span>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .authrim-scopes {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-3);
  }

  .authrim-scopes__item {
    display: flex;
    align-items: flex-start;
    gap: var(--authrim-space-3);
  }

  .authrim-scopes__icon {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    margin-top: 1px;
    color: var(--authrim-color-success, #22c55e);
  }

  .authrim-scopes__content {
    flex: 1;
    min-width: 0;
  }

  .authrim-scopes__label {
    display: block;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text);
    line-height: var(--authrim-leading-snug);
  }

  .authrim-scopes__desc {
    display: block;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-xs);
    color: var(--authrim-color-text-muted);
    margin-top: var(--authrim-space-1);
  }

  .authrim-scopes__required {
    flex-shrink: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-xs);
    font-weight: 500;
    color: var(--authrim-color-text-muted);
    padding: 1px var(--authrim-space-2);
    border: 1px solid var(--authrim-color-border);
    border-radius: var(--authrim-radius-full);
  }
</style>
