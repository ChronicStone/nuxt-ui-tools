<script setup lang="ts">
import { useFieldControl } from '../../composables/use-field-control'
import type { FormHiddenField } from '../../types'

const props = defineProps<{
  field: FormHiddenField
  path: readonly string[]
}>()

useFieldControl(
  () => props.field,
  () => props.path,
)
</script>

<template>
  <input type="hidden" :name="path.join('.')" />
</template>
