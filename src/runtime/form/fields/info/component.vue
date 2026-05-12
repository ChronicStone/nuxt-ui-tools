<script setup lang="ts">
import { computed } from 'vue'

import UAlert from '@nuxt/ui/components/Alert.vue'

import type { FormInfoField } from '../../types'
import { useFieldControl } from '../../composables/use-field-control'
import { resolveFormText } from '../../utils/text'

const props = defineProps<{
  field: FormInfoField
  path: readonly string[]
}>()

const { params } = useFieldControl(() => props.field, () => props.path)

const description = computed(() => {
  const content = props.field.content
  if (typeof content === 'function') {
    const value = content(params.value)
    return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined
  }

  if (typeof content === 'string' || typeof content === 'number' || typeof content === 'function')
    return resolveFormText(content)

  return undefined
})
</script>

<template>
  <UAlert
    color="neutral"
    variant="soft"
    icon="i-lucide-info"
    :description="description"
  />
</template>
