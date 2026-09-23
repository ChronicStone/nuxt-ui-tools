<script setup lang="ts">
import { provideDashboardView } from '../../composables/use-dashboard-context'

/**
 * Renders the content of one view and tells the components inside which view it is, so a tab
 * component resolves `useDashboardView(consumptionView)` to it. Keyed by view by its parent.
 */
const { dashboard, view } = defineProps<{ dashboard: object; view: string }>()

provideDashboardView(dashboard, view)
</script>

<template>
  <slot />
</template>
