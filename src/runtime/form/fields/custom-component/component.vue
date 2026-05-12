<script setup lang="ts">
import { computed } from 'vue'

import type { FormCustomComponentField } from '../../types'
import { useFieldControl } from '../../composables/use-field-control'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'

const props = defineProps<{
  field: FormCustomComponentField
  path: readonly string[]
}>()

const { params } = useFieldControl(() => props.field, () => props.path)
const rendered = computed(() => props.field.render?.(params.value))
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <component
      :is="field.component"
      v-if="field.component"
    />
    <component
      :is="() => rendered"
      v-else-if="rendered"
    />
  </FormFieldShell>
</template>
