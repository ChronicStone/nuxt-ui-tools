<script setup lang="ts" generic="TData">
import { computed } from 'vue'

import type {
  DashboardBlockBaseProps,
  DashboardLegendItem,
  DashboardSkeletonKind,
  DashboardSourceLike,
} from '../types'
import DashboardCard from './dashboard-card.vue'

const {
  source,
  card = true,
  isEmpty,
  skeleton = 'rows',
  ...block
} = defineProps<
  DashboardBlockBaseProps & {
    source: DashboardSourceLike<TData>
    /** Whether ready data has nothing to show. Defaults to `null` or an empty array. */
    isEmpty?: (data: TData & ({} | null)) => boolean
    legend?: readonly DashboardLegendItem[]
    /** Built-in skeleton drawn while the source loads, unless a `#skeleton` slot is given. */
    skeleton?: DashboardSkeletonKind
  }
>()

defineSlots<{
  default: (props: {
    data: TData & ({} | null)
    refreshing: boolean
    refresh: () => Promise<void>
  }) => unknown
  skeleton?: () => unknown
  'header-right'?: (props: { data: (TData & ({} | null)) | undefined }) => unknown
  toolbar?: () => unknown
  footer?: (props: { data: TData & ({} | null) }) => unknown
}>()

const ready = computed(() => {
  const data = source.data
  return data === undefined ? null : { data }
})
const blank = computed(() => {
  if (!ready.value) return false
  const { data } = ready.value
  if (isEmpty) return isEmpty(data)
  return data === null || (Array.isArray(data) && data.length === 0)
})
</script>

<template>
  <DashboardCard v-bind="block" :card :source :is-empty="blank" :skeleton>
    <template v-if="$slots.skeleton" #skeleton>
      <slot name="skeleton" />
    </template>
    <template v-if="$slots['header-right']" #header-right>
      <slot name="header-right" :data="ready?.data" />
    </template>
    <template v-if="$slots.toolbar" #toolbar>
      <slot name="toolbar" />
    </template>
    <template v-if="$slots.footer" #footer>
      <slot v-if="ready" name="footer" :data="ready.data" />
    </template>
    <slot
      v-if="ready"
      :data="ready.data"
      :refreshing="source.refreshing"
      :refresh="source.refresh"
    />
  </DashboardCard>
</template>
