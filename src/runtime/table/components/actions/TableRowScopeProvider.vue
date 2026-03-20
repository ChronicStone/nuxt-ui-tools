<script setup lang="ts">
import { computed } from 'vue'

import {
  provideTableRowActionScope,
  type TableInjectedRowActionScope,
} from '../../composables/use-table-row-actions'

const props = defineProps<{
  scope: TableInjectedRowActionScope
}>()

provideTableRowActionScope(computed(() => props.scope))
</script>

<template>
  <slot />
</template>
