<script setup>
import { ref, useId } from 'vue'

defineOptions({ inheritAttrs: false })
const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, required: true },
  error: { type: String, default: '' },
  submitted: Boolean,
  formatter: { type: Function, default: null },
  hint: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'blur'])
const touched = ref(false)
const id = useId()

function input(event) {
  const element = event.target
  const raw = element.value
  const caret = element.selectionStart
  const value = props.formatter ? props.formatter(raw) : raw
  emit('update:modelValue', value)
  // Atualiza também quando a sanitização mantém o valor do modelo inalterado.
  element.value = value
  if (props.formatter && caret !== null && element.setSelectionRange) {
    const count = [...raw.slice(0, caret).matchAll(/[\p{L}\p{N}]/gu)].length
    let remaining = count
    let position = 0
    while (position < value.length && remaining > 0) {
      if (/[\p{L}\p{N}]/u.test(value[position])) remaining--
      position++
    }
    element.setSelectionRange(caret === raw.length ? value.length : position, caret === raw.length ? value.length : position)
  }
}
</script>

<template>
  <label class="form-field" :class="$attrs.class" :for="id">
    <span>{{ label }}</span>
    <input
      :id="id"
      v-bind="{ ...$attrs, class: undefined }"
      :value="modelValue"
      :class="{ invalid: (submitted || touched) && error }"
      :aria-invalid="!!((submitted || touched) && error)"
      :aria-describedby="(submitted || touched) && error ? `${id}-error` : hint ? `${id}-hint` : undefined"
      @input="input"
      @blur="touched = true; emit('blur', $event)"
    />
    <small v-if="(submitted || touched) && error" :id="`${id}-error`" class="field-error">{{ error }}</small>
    <small v-else-if="hint" :id="`${id}-hint`">{{ hint }}</small>
  </label>
</template>
