<script setup lang="ts">
import { computed } from 'vue'

import { provideTableRowActionScope } from '../../composables/use-table-row-actions'
import type { TableInjectedRowActionScope } from '../../composables/use-table-row-actions'

const props = defineProps<{
  scope: TableInjectedRowActionScope
}>()

provideTableRowActionScope(computed(() => props.scope))
</script>

<template>
  <slot />
</template>
