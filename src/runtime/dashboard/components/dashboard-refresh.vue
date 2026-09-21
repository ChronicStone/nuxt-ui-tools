<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import type { DropdownMenuItem } from '@nuxt/ui/components/DropdownMenu.vue'
import UFieldGroup from '@nuxt/ui/components/FieldGroup.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import DashboardRelativeTime from './dashboard-relative-time.vue'

/** What the control drives: the dashboard object returned by `useDashboard`. */
interface DashboardRefreshTarget {
  refresh: () => Promise<void>
  readonly refreshing: boolean
  readonly updatedAt: number | undefined
  autoRefresh: number
}

/**
 * Refresh control for a dashboard header: a refresh button, an auto-refresh interval menu (kept in
 * the URL by the dashboard), and "Updated 3 min ago".
 *
 * @example
 * ```vue
 * <UiDashboardRefresh :dashboard />
 * ```
 */
const {
  dashboard,
  intervals = [0, 30, 60, 300, 900],
  updated = true,
  label = true,
  size = 'sm',
} = defineProps<{
  dashboard: DashboardRefreshTarget
  /** Auto-refresh choices in seconds; `0` turns it off. */
  intervals?: readonly number[]
  /** Shows when the data on screen was last fetched. */
  updated?: boolean
  /** Shows the "Refresh" label next to the icon. */
  label?: boolean
  size?: 'xs' | 'sm' | 'md'
}>()

const { t, code } = useUiToolsLocale()

/** `30` → "30 sec", `300` → "5 min", in the current locale. */
const formatInterval = computed(() => {
  const seconds = new Intl.NumberFormat(code.value, {
    style: 'unit',
    unit: 'second',
    unitDisplay: 'short',
  })
  const minutes = new Intl.NumberFormat(code.value, {
    style: 'unit',
    unit: 'minute',
    unitDisplay: 'short',
  })
  return (value: number) =>
    value >= 60 && value % 60 === 0 ? minutes.format(value / 60) : seconds.format(value)
})

const items = computed<DropdownMenuItem[][]>(() => [
  [{ label: t('dashboard.refresh.auto'), type: 'label' }],
  intervals.map((seconds) => ({
    checked: dashboard.autoRefresh === seconds,
    label: seconds > 0 ? formatInterval.value(seconds) : t('dashboard.refresh.off'),
    onSelect: () => {
      dashboard.autoRefresh = seconds
    },
    type: 'checkbox' as const,
  })),
])

function refresh() {
  // Failures surface on the blocks themselves (error state with retry).
  dashboard.refresh().catch(() => undefined)
}
</script>

<template>
  <div class="flex items-center gap-3" data-dashboard-refresh>
    <span
      v-if="updated && dashboard.updatedAt !== undefined"
      class="text-xs whitespace-nowrap text-muted max-sm:hidden"
    >
      {{ t('dashboard.freshness.prefix') }}
      <DashboardRelativeTime :value="dashboard.updatedAt" />
    </span>
    <UFieldGroup :size>
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-refresh-cw"
        :label="label ? t('dashboard.refresh.label') : undefined"
        :aria-label="label ? undefined : t('dashboard.refresh.label')"
        :loading="dashboard.refreshing"
        @click="refresh"
      />
      <UDropdownMenu :items :content="{ align: 'end', side: 'bottom', sideOffset: 6 }">
        <UButton
          color="neutral"
          variant="outline"
          trailing-icon="i-lucide-chevron-down"
          :label="dashboard.autoRefresh > 0 ? formatInterval(dashboard.autoRefresh) : undefined"
          :aria-label="t('dashboard.refresh.auto')"
          :class="dashboard.autoRefresh > 0 && 'text-highlighted'"
        >
          <template v-if="dashboard.autoRefresh > 0" #leading>
            <span aria-hidden="true" class="size-1.5 animate-pulse rounded-full bg-primary" />
          </template>
        </UButton>
      </UDropdownMenu>
    </UFieldGroup>
  </div>
</template>
