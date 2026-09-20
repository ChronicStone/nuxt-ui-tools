<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import type { FormValue } from '../../types'
import { isLoadMoreOption } from '../../utils/options'
import { isRecord } from '../../utils/path'
import { isNumber, isString } from '../../utils/predicate'

const props = defineProps<{
  item: FormValue
}>()

const loadMore = computed(() => isLoadMoreOption(props.item))
const label = computed(() => {
  if (isRecord(props.item)) {
    const value = props.item.label
    return isString(value) || isNumber(value) ? String(value) : ''
  }
  return isString(props.item) || isNumber(props.item) ? String(props.item) : ''
})
</script>

<template>
  <span
    v-if="loadMore"
    class="flex items-center gap-2 text-xs text-muted"
    data-form-option-loading=""
  >
    <UIcon name="i-lucide-loader-circle" class="size-3.5 animate-spin" aria-hidden="true" />
    {{ label }}
  </span>
  <template v-else>{{ label }}</template>
</template>
