<script setup lang="ts">
import { computed } from 'vue'

import type { UseTableReturn } from '../composables/use-table'
import type { TableSchemaView } from '../types'
import { useTableInternals } from '../composables/use-table-internals'
import GridRenderer from './grid/GridRenderer.vue'
import TableFooter from './layout/TableFooter.vue'
import TableHeader from './layout/TableHeader.vue'
import TableRenderer from './table/TableRenderer.vue'

const props = defineProps<{
  table: UseTableReturn<TableSchemaView>
  title?: string
  description?: string
  height?: string | number
}>()

defineSlots<{
  title?: () => any
  actions?: () => any
  empty?: () => any
  'empty-table'?: () => any
  'empty-grid'?: () => any
}>()

const internals = useTableInternals()
const tableHeight = computed(() => normalizeDimension(props.height ?? '36rem'))
const titleText = computed(() => props.title ?? humanizeKey(props.table.schema.value.tableKey))
const descriptionText = computed(() => props.description)

function normalizeDimension(value: string | number) {
  return typeof value === 'number' ? `${value}px` : value
}

function humanizeKey(value: string) {
  return value
    .split('.')
    .at(-1)
    ?.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase()) ?? value
}
</script>

<template>
  <div class="grid gap-4">
    <TableHeader
      :title="titleText"
      :description="descriptionText"
      :search-placeholder="internals.filters.searchPlaceholder.value"
      :search-loading="internals.queryContent.status.value.isFetching && !internals.queryContent.status.value.isPending"
      :search-query="internals.filters.searchQuery.value"
      :table-layout="internals.controls.tableLayout.value"
      :grid-enabled="Boolean(internals.controls.gridEnabled.value)"
      @update:search-query="internals.filters.searchQuery.value = $event"
      @update:table-layout="table.api.setLayout($event)"
    >
      <template v-if="$slots.title" #title>
        <slot name="title" />
      </template>
      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>
    </TableHeader>

    <div class="overflow-hidden rounded-xl border border-default bg-default shadow-sm">
      <Transition :name="internals.controls.tableLayout.value === 'grid' ? 'slide-fade' : 'slide-fade-reverse'" mode="out-in">
        <TableRenderer v-if="internals.controls.tableLayout.value === 'table'" :height="tableHeight">
          <template v-if="$slots['empty-table'] || $slots.empty" #empty>
            <slot name="empty-table">
              <slot name="empty" />
            </slot>
          </template>
        </TableRenderer>

        <GridRenderer v-else :height="tableHeight">
          <template v-if="$slots['empty-grid'] || $slots.empty" #empty>
            <slot name="empty-grid">
              <slot name="empty" />
            </slot>
          </template>
        </GridRenderer>
      </Transition>

      <TableFooter />
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 180ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active,
.slide-fade-leave-active,
.slide-fade-reverse-enter-active,
.slide-fade-reverse-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.slide-fade-enter-from,
.slide-fade-reverse-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.slide-fade-leave-to,
.slide-fade-reverse-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
