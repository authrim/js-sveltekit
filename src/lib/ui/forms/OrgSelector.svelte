<!--
  OrgSelector Component
  Organization selection dropdown for consent screens
-->
<script context="module" lang="ts">
  export interface OrgItem {
    id: string;
    name: string;
    type: string;
    is_primary: boolean;
    plan?: string;
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let organizations: OrgItem[] = [];
  export let selectedOrgId: string | null = null;
  export let label = "Organization";
  export let primaryLabel = "Primary";
  let className = "";
  export { className as class };

  const dispatch = createEventDispatcher<{
    change: { orgId: string | null };
  }>();

  function handleChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    const value = target.value || null;
    dispatch("change", { orgId: value });
  }
</script>

<div class="authrim-org-selector {className}" {...$$restProps}>
  <label for="authrim-org-select" class="authrim-org-selector__label">
    {label}
  </label>
  <select
    id="authrim-org-select"
    class="authrim-org-selector__select"
    value={selectedOrgId || ""}
    on:change={handleChange}
  >
    {#each organizations as org (org.id)}
      <option value={org.id}>
        {org.name}
        {#if org.is_primary}
          ({primaryLabel})
        {/if}
      </option>
    {/each}
  </select>
</div>

<style>
  .authrim-org-selector {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-2);
  }

  .authrim-org-selector__label {
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    font-weight: 500;
    color: var(--authrim-color-text-secondary);
  }

  .authrim-org-selector__select {
    width: 100%;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text);
    background: var(--authrim-color-bg);
    border: 1.5px solid var(--authrim-color-border);
    border-radius: var(--authrim-radius-md);
    padding: var(--authrim-space-2) var(--authrim-space-3);
    cursor: pointer;
    transition:
      border-color var(--authrim-duration-fast) var(--authrim-ease-default),
      box-shadow var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-org-selector__select:hover {
    border-color: var(--authrim-color-border-strong);
  }

  .authrim-org-selector__select:focus-visible {
    outline: none;
    box-shadow: var(--authrim-shadow-focus);
    border-color: var(--authrim-color-primary);
  }
</style>
