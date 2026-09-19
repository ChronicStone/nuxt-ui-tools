<script setup lang="ts">
import UAlert from '@nuxt/ui/components/Alert.vue'
import { computed } from 'vue'

import { useFieldControl } from '../../composables/use-field-control'
import type { FormInfoField } from '../../types'
import { invokeFormFunction, isNumber, isString } from '../../utils/predicate'
import { resolveFormText } from '../../utils/text'

const props = defineProps<{
  field: FormInfoField
  path: readonly string[]
}>()

const { params } = useFieldControl(
  () => props.field,
  () => props.path,
)

const description = computed(() => {
  const { content } = props.field
  const resolved = invokeFormFunction(content, [params.value]) ?? content
  return isString(resolved) || isNumber(resolved) ? String(resolved) : undefined
})
</script>

<template>
  <UAlert
    :color="field.color ?? 'neutral'"
    :variant="field.variant ?? 'soft'"
    :icon="field.icon === false ? undefined : (field.icon ?? 'i-lucide-info')"
    :title="resolveFormText(field.title)"
    :description="description"
  />
</template>
