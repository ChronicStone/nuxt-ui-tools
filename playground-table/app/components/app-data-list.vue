<script setup lang="ts">
import type { ComputedRef } from 'vue'

import type { TableInternals } from '#ui-tools/table/composables/use-table-internals'
import type { DataListUiConfig } from '#ui-tools/table/types'
import { mergeDataListUiConfig } from '#ui-tools/table/utils'

interface DataListTable {
  schema: ComputedRef<{ tableKey: string }>
  __internals: TableInternals
}

const props = defineProps<{
  table: DataListTable
  title: string
  description?: string
  ui?: DataListUiConfig
}>()

const sharedUi: DataListUiConfig = {
  addFilter: { props: { trigger: { label: 'Filtre' } } },
  columnPanel: {
    props: {
      trigger: { color: 'neutral', icon: 'i-lucide-layers', variant: 'outline' },
    },
  },
  filterTags: {
    props: { clearTrigger: { color: 'neutral', variant: 'ghost' }, icon: false },
    ui: {
      activeRoot: 'bg-[#f7f3ee] ring-[var(--ui-border)] dark:bg-[#302d2a]',
      activeTrigger: 'text-[12.5px] pl-[11px]',
      addTrigger: 'text-[12.5px] px-3 font-normal',
      trigger: 'text-[12.5px]',
      value: 'text-[12.5px]',
    },
  },
  grid: { gap: 12, ui: { viewport: 'p-5 max-md:p-4' } },
  layoutSwitch: {
    props: { activeTrigger: { variant: 'ghost' }, trigger: { color: 'neutral', variant: 'ghost' } },
    size: 'sm',
    ui: {
      root: 'h-[34px] items-center gap-0.5 rounded-md bg-[#f7f3ee] p-0.5 dark:bg-[#242220]',
      trigger:
        'h-7 w-7 rounded-[4px] text-muted hover:text-default hover:bg-transparent data-[active=true]:bg-[var(--ex-surface)] data-[active=true]:text-highlighted data-[active=true]:shadow-[0_0_0_1px_var(--ui-border)]',
    },
  },
  mobile: {
    control: { size: 'lg' },
    grid: { gap: 10, ui: { viewport: 'px-4 pt-0.5 pb-4' } },
    pagination: { size: 'md', ui: { button: 'h-8 w-8 rounded-lg', root: 'px-4 py-2.5' } },
    search: { ui: { root: 'flex-1 min-w-0' }, width: '100%' },
  },
  pagination: {
    props: {
      firstLast: false,
      pageSize: { color: 'neutral', size: 'sm', variant: 'outline' },
      pagination: {
        activeColor: 'neutral',
        activeVariant: 'solid',
        color: 'neutral',
        variant: 'ghost',
      },
    },
    size: 'sm',
    ui: {
      button: 'h-7 min-w-7 text-[12.5px] font-medium',
      pageSize: 'text-[12.5px] ring-[var(--ui-border)]',
      root: 'px-5 py-2.5 text-[12.5px]',
    },
  },
  search: { props: { input: { color: 'neutral', variant: 'outline' } }, width: '340px' },
  table: {
    gutter: 20,
    props: {
      checkbox: { color: 'primary' },
      rowActions: { color: 'neutral', size: 'sm', variant: 'ghost' },
    },
    ui: { td: 'font-light' },
  },
}

const resolvedUi = computed(() => mergeDataListUiConfig(sharedUi, props.ui))
</script>

<template>
  <NutDataListRoot :table="table" :ui="resolvedUi">
    <div class="ex-list">
      <header class="ex-ph">
        <div>
          <h1>{{ title }}</h1>
          <p v-if="description">{{ description }}</p>
        </div>
        <div v-if="$slots.actions" class="ex-ph-acts">
          <slot name="actions" />
        </div>
      </header>
      <div class="ex-tb">
        <div class="ex-tb-l">
          <NutDataListSearch />
          <NutDataListFilterTags show-add show-clear />
        </div>
        <div class="ex-tb-r">
          <NutDataListFilterPanel />
          <NutDataListSortMenu label="Tri" />
          <NutDataListColumnPanel />
          <NutDataListRefresh />
          <NutDataListLayoutSwitch />
        </div>
      </div>
      <div class="relative flex min-h-0 flex-1 flex-col">
        <NutDataListContent fit="fill" surface="plain" class="min-h-0 flex-1" />
        <NutDataListSelectionActions />
      </div>
      <NutDataListPagination />
    </div>
  </NutDataListRoot>
</template>
