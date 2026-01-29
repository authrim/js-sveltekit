<!--
  LanguageSwitcher Component
  Language selection dropdown with globe icon
  Framework-agnostic: emits events for parent to handle locale changes
-->
<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let currentLocale = "en";
  export let locales: Array<{ code: string; label: string }> = [
    { code: "en", label: "English" },
    { code: "ja", label: "日本語" },
  ];
  let className = "";
  export { className as class };

  const dispatch = createEventDispatcher<{ change: { locale: string } }>();

  function handleChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    dispatch("change", { locale: target.value });
  }
</script>

<div class="authrim-lang {className}" {...$$restProps}>
  <svg
    class="authrim-lang__icon"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fill-rule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM5.354 5.354a1 1 0 011.414 0l.354.353.354-.353a1 1 0 011.414 1.414l-.353.354.353.354a1 1 0 01-1.414 1.414L7.122 8.182l-.354.354a1 1 0 01-1.414-1.414l.354-.354-.354-.354a1 1 0 010-1.414zm5.2 1.96a.75.75 0 10-1.108 1.012L10.95 10l-1.504 1.674a.75.75 0 101.108 1.012l1.152-1.282 1.152 1.282a.75.75 0 101.108-1.012L12.462 10l1.504-1.674a.75.75 0 10-1.108-1.012L11.706 8.596l-1.152-1.282z"
      clip-rule="evenodd"
    />
  </svg>

  <select
    value={currentLocale}
    on:change={handleChange}
    aria-label="Select language"
    class="authrim-lang__select"
  >
    {#each locales as locale (locale.code)}
      <option value={locale.code}>{locale.label}</option>
    {/each}
  </select>
</div>

<style>
  .authrim-lang {
    display: inline-flex;
    align-items: center;
    gap: var(--authrim-space-2);
  }

  .authrim-lang__icon {
    width: 16px;
    height: 16px;
    color: var(--authrim-color-text-muted);
    flex-shrink: 0;
  }

  .authrim-lang__select {
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    color: var(--authrim-color-text-secondary);
    background: transparent;
    border: 1.5px solid var(--authrim-color-border);
    border-radius: var(--authrim-radius-sm);
    padding: var(--authrim-space-1) var(--authrim-space-6)
      var(--authrim-space-1) var(--authrim-space-2);
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right var(--authrim-space-1) center;
    background-size: 16px;
    transition:
      border-color var(--authrim-duration-fast) var(--authrim-ease-default),
      box-shadow var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-lang__select:hover {
    border-color: var(--authrim-color-border-strong);
  }

  .authrim-lang__select:focus-visible {
    outline: none;
    box-shadow: var(--authrim-shadow-focus);
    border-color: var(--authrim-color-primary);
  }

  .authrim-lang__select option {
    background: var(--authrim-color-bg);
    color: var(--authrim-color-text);
  }
</style>
