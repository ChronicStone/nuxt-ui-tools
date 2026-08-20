<script setup lang="ts">
import UAlert from '@nuxt/ui/components/Alert.vue'
import { computed } from 'vue'

import { useFieldControl } from '../../composables/use-field-control'
import type { FormInfoField } from '../../types'
import { invokeFormFunction, isNumber, isString } from '../../utils/predicate'

const props = defineProps<{
  field: FormInfoField
  path: readonly string[]
}>()

const { params } = useFieldControl(
  () => props.field,
  () => props.path,
)

const description = computed(() => {
  const content = props.field.content
  const resolved = invokeFormFunction(content, [params.value]) ?? content
  return isString(resolved) || isNumber(resolved) ? String(resolved) : undefined
})
</script>

<template>
  <UAlert color="neutral" variant="soft" icon="i-lucide-info" :description="description" />
</template>
