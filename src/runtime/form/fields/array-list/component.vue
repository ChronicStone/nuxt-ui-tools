<script setup lang="ts">
import UAlert from '@nuxt/ui/components/Alert.vue'

import type { FormArrayListField, FormArrayTabsField, FormArrayVariantField } from '../../types'

defineProps<{
  field: FormArrayListField | FormArrayTabsField | FormArrayVariantField
  path: readonly string[]
}>()
</script>

<template>
  <UAlert
    color="neutral"
    variant="soft"
    icon="i-lucide-list-plus"
    title="Array field"
    description="Array rendering is reserved for the next form runtime slice."
  />
</template>
