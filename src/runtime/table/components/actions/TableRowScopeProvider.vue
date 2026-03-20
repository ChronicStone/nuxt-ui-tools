<script setup lang="ts">
import {
  provideTableRowActionScope,
  type TableInjectedRowActionScope,
} from '../../composables/use-table-row-actions'

const props = defineProps<{
  scope: TableInjectedRowActionScope
}>()

provideTableRowActionScope(props.scope)
</script>

<template>
  <slot />
</template>
