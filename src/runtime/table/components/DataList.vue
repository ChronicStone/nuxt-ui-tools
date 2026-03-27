<script setup lang="ts">
import { computed } from 'vue'
import type { ComputedRef } from 'vue'

import { provideUiToolsLocale, useUiToolsLocaleRef } from '#ui-tools/i18n'
import type { UiToolsLocale, UiToolsMessages } from '#ui-tools/i18n'
import { provideTableInternals, type TableInternals } from '../composables/use-table-internals'
import GridRenderer from './grid/GridRenderer.vue'
import TableFooter from './layout/TableFooter.vue'
import TableHeader from './layout/TableHeader.vue'
import TableRenderer from './table/TableRenderer.vue'

type DataListTable = {
  schema: ComputedRef<{
    tableKey: string
  }>
  __internals: TableInternals
}

const props = defineProps<{
  table: DataListTable
  title?: string
  description?: string
  height?: string | number
  locale?: UiToolsLocale<UiToolsMessages>
}>()

defineSlots<{
  title?: () => any
  actions?: () => any
  empty?: () => any
  'empty-table'?: () => any
  'empty-grid'?: () => any
}>()

provideTableInternals(props.table.__internals)
provideUiToolsLocale(useUiToolsLocaleRef(computed(() => props.locale)))

const internals = props.table.__internals
const tableHeight = computed(() => normalizeDimension(props.height ?? '36rem'))
const titleText = computed(() => props.title ?? humanizeKey(props.table.schema.value.tableKey))
const descriptionText = computed(() => props.description)
const gridActive = computed(
  () => internals.controls.tableLayout.value === 'grid',
)
const contentShellClass = computed(() =>
  gridActive.value
    ? 'grid gap-5'
    : 'overflow-hidden rounded-md border border-default bg-default',
)
const footerClass = computed(() =>
  gridActive.value
    ? 'rounded-md border border-default/70 bg-default/80 shadow-sm backdrop-blur'
    : 'border-t border-default/70',
)

function normalizeDimension(value: string | number) {
  return typeof value === 'number' ? `${value}px` : value
}

function humanizeKey(value: string) {
  return (
    value
      .split('.')
      .at(-1)
      ?.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase()) ?? value
  )
}
</script>

<template>
  <div class="grid gap-4">
    <TableHeader
      :title="titleText"
      :description="descriptionText"
      :search-placeholder="internals.filters.searchPlaceholder.value"
      :search-loading="
        internals.queryContent.status.value.isFetching &&
        !internals.queryContent.status.value.isPending
      "
      v-model:search-query="internals.filters.searchQuery.value"
      v-model:table-layout="internals.controls.tableLayout.value"
      :grid-enabled="Boolean(internals.controls.gridEnabled.value)"
    >
      <template v-if="$slots.title" #title>
        <slot name="title" />
      </template>
      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>
    </TableHeader>

    <div :class="contentShellClass">
      <Transition
        :name="
          internals.controls.tableLayout.value === 'grid' ? 'slide-fade' : 'slide-fade-reverse'
        "
        mode="out-in"
      >
        <TableRenderer
          v-if="internals.controls.tableLayout.value === 'table'"
          :height="tableHeight"
        >
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

      <div :class="footerClass">
        <TableFooter />
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active,
.slide-fade-reverse-enter-active,
.slide-fade-reverse-leave-active {
  transition:
    opacity 240ms cubic-bezier(0.25, 1, 0.5, 1),
    transform 240ms cubic-bezier(0.25, 1, 0.5, 1);
}

.slide-fade-enter-from,
.slide-fade-reverse-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.995);
}

.slide-fade-leave-to,
.slide-fade-reverse-enter-from {
  opacity: 0;
  transform: translateY(-6px) scale(0.995);
}

@media (prefers-reduced-motion: reduce) {
  .slide-fade-enter-active,
  .slide-fade-leave-active,
  .slide-fade-reverse-enter-active,
  .slide-fade-reverse-leave-active {
    transition-duration: 0.01ms;
  }
}
</style>
