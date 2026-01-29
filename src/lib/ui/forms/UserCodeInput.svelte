<!--
  UserCodeInput Component
  8-character user code input in XXXX-XXXX format
  Used for Device Flow verification
-->
<script lang="ts">
  import { createEventDispatcher } from "svelte";

  /** Current code value (without hyphen) */
  export let value = "";
  export let disabled = false;
  export let placeholder = "";
  export let label = "User Code";
  export let hint = "Enter the code displayed on your device";
  let className = "";
  export { className as class };

  const dispatch = createEventDispatcher<{
    change: { value: string };
    submit: { value: string };
  }>();

  let inputs: HTMLInputElement[] = [];

  function getCleanValue(): string {
    return value.replace(/-/g, "").toUpperCase();
  }

  function handleInput(index: number, e: Event) {
    const target = e.target as HTMLInputElement;
    const char = target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");

    // Update value
    const chars = getCleanValue().split("");
    chars[index] = char.charAt(0) || "";
    value = chars.join("");
    dispatch("change", { value: getCleanValue() });

    // Auto-advance to next input
    if (char && index < 7) {
      const nextIndex = index === 3 ? 4 : index + 1; // Skip the visual hyphen position
      inputs[nextIndex]?.focus();
    }

    // Auto-submit when complete
    if (getCleanValue().length === 8) {
      dispatch("submit", { value: getCleanValue() });
    }
  }

  function handleKeydown(index: number, e: KeyboardEvent) {
    if (e.key === "Backspace" && !inputs[index]?.value && index > 0) {
      const prevIndex = index === 4 ? 3 : index - 1;
      inputs[prevIndex]?.focus();
    }
    if (e.key === "Enter" && getCleanValue().length === 8) {
      dispatch("submit", { value: getCleanValue() });
    }
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    const pasted = (e.clipboardData?.getData("text") || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8);

    value = pasted;
    dispatch("change", { value: pasted });

    // Focus last filled or next empty input
    const focusIndex = Math.min(pasted.length, 7);
    inputs[focusIndex]?.focus();

    if (pasted.length === 8) {
      dispatch("submit", { value: pasted });
    }
  }

  $: chars = getCleanValue().padEnd(8, "").split("").slice(0, 8);
</script>

<div class="authrim-user-code {className}" {...$$restProps}>
  <!-- Label is for visual display; inputs have individual aria-labels -->
  <span class="authrim-user-code__label" aria-hidden="true">{label}</span>

  <div
    class="authrim-user-code__inputs"
    role="group"
    aria-label={label}
    on:paste={handlePaste}
  >
    {#each Array(8) as _, i}
      {#if i === 4}
        <span class="authrim-user-code__separator" aria-hidden="true">-</span>
      {/if}
      <input
        bind:this={inputs[i]}
        type="text"
        inputmode="text"
        maxlength="1"
        class="authrim-user-code__cell"
        value={chars[i] || ""}
        {disabled}
        placeholder={placeholder ? placeholder[i >= 4 ? i + 1 : i] || "" : ""}
        aria-label="Character {i + 1}"
        autocomplete="off"
        on:input={(e) => handleInput(i, e)}
        on:keydown={(e) => handleKeydown(i, e)}
      />
    {/each}
  </div>

  {#if hint}
    <p class="authrim-user-code__hint">{hint}</p>
  {/if}
</div>

<style>
  .authrim-user-code {
    display: flex;
    flex-direction: column;
    gap: var(--authrim-space-2);
  }

  .authrim-user-code__label {
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-sm);
    font-weight: 500;
    color: var(--authrim-color-text-secondary);
  }

  .authrim-user-code__inputs {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--authrim-space-2);
  }

  .authrim-user-code__cell {
    width: 48px;
    height: 56px;
    text-align: center;
    font-family: var(--authrim-font-mono, monospace);
    font-size: var(--authrim-text-xl);
    font-weight: 700;
    color: var(--authrim-color-text);
    background: var(--authrim-color-bg);
    border: 2px solid var(--authrim-color-border);
    border-radius: var(--authrim-radius-md);
    text-transform: uppercase;
    transition:
      border-color var(--authrim-duration-fast) var(--authrim-ease-default),
      box-shadow var(--authrim-duration-fast) var(--authrim-ease-default);
  }

  .authrim-user-code__cell:focus {
    outline: none;
    border-color: var(--authrim-color-primary);
    box-shadow: var(--authrim-shadow-focus);
  }

  .authrim-user-code__cell:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .authrim-user-code__separator {
    font-family: var(--authrim-font-mono, monospace);
    font-size: var(--authrim-text-2xl);
    font-weight: 700;
    color: var(--authrim-color-text-muted);
    padding: 0 var(--authrim-space-1);
  }

  .authrim-user-code__hint {
    margin: 0;
    font-family: var(--authrim-font-sans);
    font-size: var(--authrim-text-xs);
    color: var(--authrim-color-text-muted);
    text-align: center;
  }
</style>
