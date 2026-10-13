<script setup lang="tsx">
import UBadge from '@nuxt/ui/components/Badge.vue'

import { defineTableSchema, tableSource, useTable } from '#ui-tools/table'

import { accountInitials, createDemoAccounts } from '../../lib/demo-accounts'
import type { DemoAccount, DemoAccountStatus } from '../../lib/demo-accounts'

const { t } = useI18n()
const { tableSize } = usePlaygroundShell()
const accounts = createDemoAccounts()
const opened = ref<DemoAccount | undefined>()

const STATUSES = ['active', 'pending', 'inactive'] as const
const KINDS = ['partner', 'client', 'testCenter'] as const
const STATUS_COLOR = {
  active: 'success',
  inactive: 'neutral',
  pending: 'warning',
} as const satisfies Record<DemoAccountStatus, 'success' | 'neutral' | 'warning'>

function statusLabel(status: DemoAccountStatus) {
  return t(`playground.tableSummary.status.${status}`)
}
function kindLabel(kind: DemoAccount['kind']) {
  return t(`playground.tableSummary.kind.${kind}`)
}

const schema = defineTableSchema({
  actions: [
    {
      action: () => Promise.resolve(),
      icon: 'i-lucide-download',
      key: 'export',
      label: () => t('playground.tableSummary.actions.export'),
      requiresSelection: true,
    },
    {
      action: () => Promise.resolve(),
      icon: 'i-lucide-archive',
      key: 'archive',
      label: () => t('playground.tableSummary.actions.archive'),
      requiresSelection: true,
    },
  ],
  defaultLayout: 'table',
  filters: {
    search: {
      fields: ['name', 'city'],
      placeholder: () => t('playground.tableSummary.searchPlaceholder'),
    },
    ui: (filter) => [
      filter.option('status', {
        behavior: { defaultOperator: 'isAnyOf' },
        display: { location: 'panel' },
        editor: { searchable: false, selection: { mode: 'multiple' } },
        label: () => t('playground.tableSummary.filters.status'),
        source: {
          options: STATUSES.map((value) => ({ label: () => statusLabel(value), value })),
        },
      }),
      filter.option('kind', {
        behavior: { defaultOperator: 'isAnyOf' },
        display: { location: 'panel' },
        editor: { searchable: false, selection: { mode: 'multiple' } },
        label: () => t('playground.tableSummary.filters.kind'),
        source: {
          options: KINDS.map((value) => ({ label: () => kindLabel(value), value })),
        },
      }),
    ],
  },
  pagination: { defaultSize: 8, showPageSizePicker: false },
  rowActions: ({ row, tableApi }) => [
    {
      action: () => {
        opened.value = row
      },
      icon: 'i-lucide-external-link',
      key: 'open',
      label: () => t('playground.tableSummary.actions.open'),
    },
    {
      action: () =>
        tableApi.updateRow({ ...row, status: row.status === 'inactive' ? 'active' : 'inactive' }),
      icon: row.status === 'inactive' ? 'i-lucide-play' : 'i-lucide-pause',
      key: 'toggle',
      label: () =>
        row.status === 'inactive'
          ? t('playground.tableSummary.actions.reactivate')
          : t('playground.tableSummary.actions.suspend'),
    },
  ],
  rowKey: 'id',
  rowLabel: (row) => row.name,
  selection: { mode: 'auto', scope: 'page' },
  source: tableSource({
    mode: 'client',
    query: () => ({
      queryFn: () => accounts,
      queryKey: ['table-summary-rows'],
    }),
  }),
  table: {
    columns: (column) => [
      column.field('name', {
        label: () => t('playground.tableSummary.columns.name'),
        minWidth: 260,
        pinned: 'left',
        render: ({ row }) => <span class="font-medium text-highlighted">{row.name}</span>,
        sortable: true,
      }),
      column.field('kind', {
        label: () => t('playground.tableSummary.columns.kind'),
        minWidth: 160,
        render: ({ row }) => kindLabel(row.kind),
        sortable: true,
      }),
      column.field('city', {
        label: () => t('playground.tableSummary.columns.city'),
        minWidth: 160,
        sortable: true,
      }),
      column.field('status', {
        label: () => t('playground.tableSummary.columns.status'),
        minWidth: 140,
        render: ({ row }) => (
          <UBadge
            color={STATUS_COLOR[row.status]}
            variant="soft"
            size="sm"
            label={statusLabel(row.status)}
          />
        ),
        sortable: true,
      }),
    ],
    defaultSorting: { dir: 'asc', key: 'name' },
    summary: {
      details: ({ row }) => [kindLabel(row.kind), row.city],
      /* On at every width so the footer toggle can be inspected from a desktop browser; the
         package default shows summary rows below the `md` breakpoint only. */
      enabled: true,
      leading: ({ row }) => accountInitials(row.name),
      onSelect: ({ row }) => {
        opened.value = row
      },
      status: ({ row }) => (
        <UBadge
          color={STATUS_COLOR[row.status]}
          variant="soft"
          size="sm"
          label={statusLabel(row.status)}
        />
      ),
      title: ({ row }) => row.name,
    },
  },
  tableKey: 'table-summary-rows',
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
            {{ t('playground.tableSummary.title') }}
          </h1>
          <NutDataListResultCount />
        </div>
        <p class="mt-1 max-w-2xl text-sm leading-5 text-muted">
          {{ t('playground.tableSummary.description') }}
        </p>
        <div class="mt-3 flex items-center gap-2">
          <div class="min-w-0 flex-1 lg:max-w-sm lg:flex-none">
            <NutDataListSearch width="100%" />
          </div>
          <NutDataListFilterPanel />
          <NutDataListSortMenu />
        </div>
        <p class="mt-2 min-h-4 text-xs text-muted" role="status">
          {{
            opened
              ? t('playground.tableSummary.opened', { name: opened.name })
              : t('playground.tableSummary.hint')
          }}
        </p>
      </header>

      <NutDataListContent fit="fill" surface="plain" class="min-h-0 flex-1" />
      <NutDataListSelectionActions />
      <NutDataListPagination />
    </NutDataListRoot>
  </PlaygroundContent>
</template>
