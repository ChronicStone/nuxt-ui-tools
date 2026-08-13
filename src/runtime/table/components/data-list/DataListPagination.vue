<script setup lang="ts">
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListControlSize, DataListPaginationUi } from '../../types'
import TableFooter from '../layout/TableFooter.vue'

defineProps<{ size?: DataListControlSize; ui?: DataListPaginationUi }>()
const internals = useTableInternals()
</script>

<template>
  <slot
    v-if="internals.pagination.mode.value === 'offset'"
    :state="internals.pagination.state.value"
    :set-page="internals.pagination.setPage"
    :set-page-size="internals.pagination.setPageSize"
    :next="internals.pagination.next"
    :previous="internals.pagination.previous"
  >
    <TableFooter :size="size" :ui="ui">
      <template v-for="(_, name) in $slots" #[name]="scope">
        <slot v-if="name !== 'default'" :name="name" v-bind="scope ?? {}" />
      </template>
    </TableFooter>
  </slot>
</template>
