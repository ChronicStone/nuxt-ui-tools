<script setup lang="tsx">
import { defineTableSchema, tableSource, useTable } from '#ui-tools/table'

import { accountInitials, createDemoAccounts } from '../../lib/demo-accounts'
import type { DemoAccount } from '../../lib/demo-accounts'

const { t } = useI18n()
const { tableSize } = usePlaygroundShell()
const sample = createDemoAccounts()
/** The workspace starts without a single account: that is what the empty state is for. */
const accounts = ref<DemoAccount[]>([])

function kindLabel(kind: DemoAccount['kind']) {
  return t(`playground.tableSummary.kind.${kind}`)
}

function setAccounts(next: DemoAccount[]): void {
  accounts.value = next
  void table.data.refresh()
}

const schema = defineTableSchema({
  defaultLayout: 'table',
  /* What the list shows before it holds a record. A list hidden by a search or a filter keeps
     its own reset button instead, whatever the action says. */
  empty: {
    action: {
      icon: 'i-lucide-plus',
      label: () => t('playground.tableFirstUse.action'),
      onClick: () => setAccounts(sample.slice(0, 1)),
    },
    description: () => t('playground.tableFirstUse.emptyDescription'),
    icon: 'i-lucide-building-2',
    title: () => t('playground.tableFirstUse.emptyTitle'),
  },
  filters: {
    search: {
      fields: ['name', 'city'],
      placeholder: () => t('playground.tableSummary.searchPlaceholder'),
    },
  },
  grid: {
    gridSize: '1 sm:2 lg:3',
    mode: 'contained',
    renderItem: ({ row }) => (
      <article class="grid gap-1 rounded-lg border border-default bg-default p-4">
        <h2 class="truncate text-sm font-semibold text-highlighted">{row.name}</h2>
        <p class="text-xs text-muted">
          {kindLabel(row.kind)} · {row.city}
        </p>
      </article>
    ),
  },
  pagination: { defaultSize: { grid: 12, table: 8 }, showPageSizePicker: false },
  rowKey: 'id',
  rowLabel: (row) => row.name,
  source: tableSource({
    mode: 'client',
    query: () => ({
      queryFn: () => accounts.value,
      queryKey: ['table-first-use', accounts.value.length],
    }),
  }),
  table: {
    columns: (column) => [
      column.field('name', {
        label: () => t('playground.tableSummary.columns.name'),
        minWidth: 260,
        render: ({ row }) => <span class="font-medium text-highlighted">{row.name}</span>,
      }),
      column.field('kind', {
        label: () => t('playground.tableSummary.columns.kind'),
        minWidth: 160,
        render: ({ row }) => kindLabel(row.kind),
      }),
      column.field('city', {
        label: () => t('playground.tableSummary.columns.city'),
        minWidth: 160,
      }),
    ],
    summary: {
      details: ({ row }) => [kindLabel(row.kind), row.city],
      /* On at every width, so the empty state can be compared across all three layouts. */
      enabled: true,
      leading: ({ row }) => accountInitials(row.name),
      title: ({ row }) => row.name,
    },
  },
  tableKey: 'table-first-use',
})

const table = useTable(schema)
</script>

<template>
  <PlaygroundContent mode="fixed" class="flex flex-col overflow-hidden bg-default">
    <NutDataListRoot :table="table" :size="tableSize">
      <header class="shrink-0 border-b border-default px-4 py-3 lg:px-8 lg:py-4">
        <p class="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
          {{ t('playground.tableSummary.eyebrow') }}
        </p>
        <div class="mt-0.5 flex items-baseline gap-2">
          <h1 class="truncate text-lg font-semibold tracking-tight text-highlighted lg:text-2xl">
            {{ t('playground.tableFirstUse.title') }}
          </h1>
          <NutDataListResultCount />
        </div>
        <p class="mt-1 max-w-2xl text-sm leading-5 text-muted">
          {{ t('playground.tableFirstUse.description') }}
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <div class="min-w-0 basis-full sm:flex-1 sm:basis-0 lg:max-w-sm lg:flex-none">
            <NutDataListSearch width="100%" />
          </div>
          <NutDataListLayoutSwitch mobile />
          <UButton
            class="ms-auto min-h-11 md:ms-0 md:min-h-0"
            color="neutral"
            variant="outline"
            icon="i-lucide-rotate-ccw"
            :label="t('playground.tableFirstUse.reset')"
            :disabled="accounts.length === 0"
            @click="setAccounts([])"
          />
        </div>
      </header>

      <NutDataListContent fit="fill" surface="plain" class="min-h-0 flex-1" />
      <NutDataListPagination />
    </NutDataListRoot>
  </PlaygroundContent>
</template>
