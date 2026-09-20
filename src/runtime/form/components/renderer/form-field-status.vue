<script setup lang="ts">
import { computed, watch } from 'vue'

import { useFormRuntimeContext } from '../../composables/use-form-runtime'

const props = defineProps<{
  path: readonly string[]
}>()

const emit = defineEmits<{ invalid: [] }>()
const form = useFormRuntimeContext()
const prefix = computed(() => `${props.path.join('.')}.`)
const invalid = computed(() =>
  form.errors.value.some(
    (error) => error.path === props.path.join('.') || error.path.startsWith(prefix.value),
  ),
)

watch(invalid, (value) => {
  if (value) {
    emit('invalid')
  }
})
</script>

<template>
  <slot :invalid="invalid" />
</template>
