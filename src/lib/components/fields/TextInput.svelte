<script lang="ts">
  import InputField from './InputField.svelte';

  let {
    label,
    value = $bindable(''),
    placeholder = '',
    optional = false,
    readonly = false,
    required = false,
    name,
    maxlength,
    pattern,
    autocomplete,
    spellcheck,
    hint = '',
    type = 'text',
    centerControl = false
  }: {
    label: string;
    value?: string;
    placeholder?: string;
    optional?: boolean;
    readonly?: boolean;
    required?: boolean;
    name?: string;
    maxlength?: number;
    pattern?: string;
    autocomplete?: string;
    spellcheck?: boolean | 'true' | 'false';
    hint?: string;
    type?: 'text' | 'url' | 'email' | 'password';
    centerControl?: boolean;
  } = $props();
</script>

<InputField {label} {optional} {hint} hasValue={!!value.trim()} {centerControl}>
  <input
    class="input-field__input"
    {type}
    {name}
    {placeholder}
    {readonly}
    {required}
    {maxlength}
    {pattern}
    {autocomplete}
    {spellcheck}
    bind:value
  />
</InputField>
