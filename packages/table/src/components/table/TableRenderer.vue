<script setup lang="ts">
import { computed } from 'vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UTable from '@nuxt/ui/components/Table.vue'

import { useTableInternals } from '../../composables/use-table-internals'

const internals = useTableInternals()
defineProps<{
  height: string
}>()

const tableRows = computed(() => internals.rows.value)
const tableRowCount = computed(() => internals.queryContent.data.value.rowCount)
const tableLoading = computed(() => internals.queryContent.status.value.isPending)
const tableRevalidating = computed(() => internals.queryContent.status.value.isRevalidating)
</script>

<template>
  <div class="overflow-hidden" :style="{ height }">
    <UTable
      :data="tableRows"
      :columns="internals.tableColumns.tableColumns.value"
      :state="internals.tableColumns.tableState.value"
      :on-state-change="(updater: any) => {
        internals.tableColumns.tableState.value = typeof updater === 'function'
          ? updater(internals.tableColumns.tableState.value)
          : updater
      }"
      :get-row-id="(row: any) => String(row?.__$rowId ?? row?.id ?? '')"
      :sorting-options="{ manualSorting: true }"
      sticky="header"
      :loading="tableLoading"
      class="h-full"
      :ui="{
        root: 'h-full overflow-auto bg-transparent',
        base: 'min-w-full border-separate border-spacing-0 bg-transparent text-sm',
        thead: 'border-b border-default/60 bg-default/95 backdrop-blur supports-[backdrop-filter]:bg-default/80',
        tbody: 'bg-transparent',
        tr: 'group transition-colors duration-150',
        th: 'h-8 border-b-0 bg-default px-3 text-left align-middle text-sm font-medium text-default',
        td: 'h-12 border-b border-default/50 px-3 align-middle text-sm text-toned transition-colors duration-150 group-hover:bg-elevated/70',
        loading: 'bg-primary',
        empty: 'py-16 text-sm text-muted'
      }"
    >
      <template #empty>
        <slot name="empty">
          <div class="flex flex-col items-center justify-center gap-3 py-14">
            <UIcon
              :name="tableRevalidating ? 'i-lucide-loader-circle' : 'i-lucide-database-zap'"
              class="size-6 text-muted"
              :class="{ 'animate-spin': tableRevalidating }"
            />
            <div class="text-sm text-muted">
              {{ tableRowCount ? 'Refreshing rows…' : 'No rows match the current state.' }}
            </div>
          </div>
        </slot>
      </template>
    </UTable>
  </div>
</template>
