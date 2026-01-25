<!--
  OTPInput Component
  Segmented one-time password input with satisfying interactions
-->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  export let length = 6;
  export let value = '';
  export let disabled = false;
  export let autoFocus = true;
  export let error = false;
  let className = '';
  export { className as class };

  const dispatch = createEventDispatcher<{
    input: { value: string };
    complete: { value: string };
  }>();

  let inputs: HTMLInputElement[] = [];
  let digits: string[] = [];
  let activeIndex = -1;

  $: {
    digits = value.split('').slice(0, length);
    while (digits.length < length) digits.push('');
  }

  onMount(() => {
    if (autoFocus && inputs[0] && !disabled) {
      inputs[0].focus();
    }
  });

  function handleInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value.replace(/\D/g, '');

    if (inputValue.length === 1) {
      digits[index] = inputValue;
      updateValue();
      if (index < length - 1) inputs[index + 1]?.focus();
    } else if (inputValue.length > 1) {
      const chars = inputValue.split('').slice(0, length - index);
      chars.forEach((char, i) => {
        if (index + i < length) digits[index + i] = char;
      });
      updateValue();
      const next = Math.min(index + chars.length, length - 1);
      inputs[next]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (digits[index]) {
        digits[index] = '';
        updateValue();
      } else if (index > 0) {
        inputs[index - 1]?.focus();
        digits[index - 1] = '';
        updateValue();
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      inputs[index - 1]?.focus();
    } else if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      inputs[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '');
    if (pasted) {
      const chars = pasted.split('').slice(0, length);
      chars.forEach((char, i) => (digits[i] = char));
      for (let i = chars.length; i < length; i++) digits[i] = '';
      updateValue();
      inputs[Math.min(chars.length, length - 1)]?.focus();
    }
  }

  function handleFocus(index: number) {
    activeIndex = index;
    inputs[index]?.select();
  }

  function handleBlur() {
    activeIndex = -1;
  }

  function updateValue() {
    value = digits.join('');
    dispatch('input', { value });
    if (value.length === length && !digits.includes('')) {
      dispatch('complete', { value });
    }
  }
</script>

<div
  class="authrim-otp {className}"
  class:authrim-otp--error={error}
  role="group"
  aria-label="Verification code"
  {...$$restProps}
>
  {#each Array(length) as _, index}
    <input
      bind:this={inputs[index]}
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      maxlength="1"
      value={digits[index]}
      {disabled}
      class="authrim-otp__digit"
      class:authrim-otp__digit--filled={digits[index]}
      class:authrim-otp__digit--active={activeIndex === index}
      aria-label="Digit {index + 1} of {length}"
      on:input={(e) => handleInput(index, e)}
      on:keydown={(e) => handleKeyDown(index, e)}
      on:paste={handlePaste}
      on:focus={() => handleFocus(index)}
      on:blur={handleBlur}
    />
  {/each}
</div>

<style>
  .authrim-otp {
    display: flex;
    gap: var(--authrim-space-2);
    justify-content: center;
  }

  .authrim-otp__digit {
    width: 52px;
    height: 64px;
    padding: 0;
    font-family: var(--authrim-font-mono);
    font-size: var(--authrim-text-2xl);
    font-weight: 600;
    text-align: center;
    background: var(--authrim-color-bg);
    border: 2px solid var(--authrim-color-border);
    border-radius: var(--authrim-radius-md);
    color: var(--authrim-color-text);
    caret-color: var(--authrim-color-primary);
    transition:
      border-color var(--authrim-duration-fast) var(--authrim-ease-default),
      box-shadow var(--authrim-duration-fast) var(--authrim-ease-default),
      transform var(--authrim-duration-fast) var(--authrim-ease-bounce);
  }

  .authrim-otp__digit:hover:not(:disabled):not(:focus) {
    border-color: var(--authrim-color-border-strong);
  }

  .authrim-otp__digit:focus {
    outline: none;
    border-color: var(--authrim-color-primary);
    box-shadow: var(--authrim-shadow-focus);
  }

  .authrim-otp__digit--filled {
    border-color: var(--authrim-color-border-strong);
    animation: digit-pop var(--authrim-duration-fast) var(--authrim-ease-bounce);
  }

  @keyframes digit-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  .authrim-otp__digit--active {
    border-color: var(--authrim-color-primary);
  }

  .authrim-otp__digit:disabled {
    background: var(--authrim-color-bg-subtle);
    color: var(--authrim-color-text-muted);
    cursor: not-allowed;
  }

  .authrim-otp--error .authrim-otp__digit {
    border-color: var(--authrim-color-error);
    animation: shake 0.4s ease-in-out;
  }

  .authrim-otp--error .authrim-otp__digit:focus {
    box-shadow: var(--authrim-shadow-focus-error);
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-3px); }
    40%, 80% { transform: translateX(3px); }
  }

  /* Responsive */
  @media (max-width: 420px) {
    .authrim-otp__digit {
      width: 44px;
      height: 56px;
      font-size: var(--authrim-text-xl);
    }
  }
</style>
