<script setup lang="ts">
import { computed } from 'vue'

import { useDashboardTime } from '../composables/use-dashboard-time'
import type { DashboardTimeValue } from '../types'
import { toDashboardTime } from '../utils/time'

/**
 * A time relative to now (`3 min ago`, `yesterday`), kept current by a shared 30-second clock, with
 * the full date as a tooltip. Pairs with `dashboard.updatedAt` for a page-level freshness line.
 */
const props = defineProps<{
  /** A `Date`, epoch milliseconds, or an ISO string. Renders nothing while `null` / `undefined`. */
  value: DashboardTimeValue | null | undefined
}>()

const time = useDashboardTime()
const at = computed(() =>
  props.value === null || props.value === undefined ? Number.NaN : toDashboardTime(props.value),
)
</script>

<template>
  <time
    v-if="Number.isFinite(at)"
    :datetime="new Date(at).toISOString()"
    :title="time.absolute(at)"
    data-allow-mismatch="text"
  >
    {{ time.relative(at) }}
  </time>
</template>
