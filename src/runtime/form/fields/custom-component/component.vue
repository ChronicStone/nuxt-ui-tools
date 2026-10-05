<script setup lang="ts">
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormCustomComponentField } from '../../types'

const props = defineProps<{
  field: FormCustomComponentField
  path: readonly string[]
}>()

const { params } = useFieldControl(
  () => props.field,
  () => props.path,
)
const rendered = computed(() => props.field.render?.(params.value))
const Rendered = () => rendered.value
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <component :is="field.component" v-if="field.component" />
    <Rendered v-else-if="rendered" />
  </FormFieldShell>
</template>
