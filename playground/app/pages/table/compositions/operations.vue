<script setup lang="ts">
import { defineTableSchema, tableSource, useTable } from '#ui-tools/table'

type QueueState = 'Queued' | 'Running' | 'Complete'
interface OperationRow {
  id: string
  job: string
  owner: string
  state: QueueState
  records: number
  startedAt: string
}

const operations: OperationRow[] = [
  {
    id: 'job-01',
    job: 'Rebuild search index',
    owner: 'Platform',
    records: 18_240,
    startedAt: '08:42',
    state: 'Running',
  },
  {
    id: 'job-02',
    job: 'Sync billing exports',
    owner: 'Finance',
    records: 4680,
    startedAt: '08:31',
    state: 'Queued',
  },
  {
    id: 'job-03',
    job: 'Generate archive',
    owner: 'Operations',
    records: 92_100,
    startedAt: '07:58',
    state: 'Complete',
  },
  {
    id: 'job-04',
    job: 'Refresh customer facets',
    owner: 'Data',
    records: 12_400,
    startedAt: '07:46',
    state: 'Queued',
  },
  {
    id: 'job-05',
    job: 'Rebuild search index',
    owner: 'Platform',
    records: 18_320,
    startedAt: '07:18',
    state: 'Complete',
  },
  {
    id: 'job-06',
    job: 'Sync billing exports',
    owner: 'Finance',
    records: 5200,
    startedAt: '06:55',
    state: 'Running',
  },
  {
    id: 'job-07',
    job: 'Refresh customer facets',
    owner: 'Data',
    records: 11_880,
    startedAt: '06:32',
    state: 'Complete',
  },
  {
    id: 'job-08',
    job: 'Generate archive',
    owner: 'Operations',
    records: 64_000,
    startedAt: '06:18',
    state: 'Queued',
  },
]

const schema = defineTableSchema({
  actions: [
    {
      action: () => Promise.resolve(),
      icon: 'i-lucide-check-check',
      key: 'mark-ready',
      label: 'Mark ready',
      requiresSelection: true,
    },
    {
      action: () => Promise.resolve(),
      icon: 'i-lucide-refresh-cw',
      key: 'retry-selected',
      label: 'Retry selected',
      requiresSelection: true,
    },
  ],
  defaultLayout: 'table',
  filters: {
    search: { fields: ['job', 'owner'], placeholder: 'Search operations' },
    ui: (filter) => [
      filter.option('state', {
        display: { location: 'tag-dynamic' },
        label: 'State',
        source: {
          options: [
            { label: 'Queued', value: 'Queued' },
            { label: 'Running', value: 'Running' },
            { label: 'Complete', value: 'Complete' },
          ],
        },
      }),
    ],
  },
  pagination: { defaultSize: 8, showPageSizePicker: false, showPagesCount: false },
  rowKey: 'id',
  selection: { mode: 'auto', scope: 'page' },
  source: tableSource({
    mode: 'client',
    query: () => ({
      queryFn: () => operations,
      queryKey: ['table-composition-operations'],
    }),
  }),
  table: {
    columns: (column) => [
      column.field('job', { label: 'Job' }),
      column.field('owner', { label: 'Owner' }),
      column.field('state', { label: 'State' }),
      column.field('records', { label: 'Records' }),
      column.field('startedAt', { label: 'Started' }),
    ],
  },
  tableKey: 'operations-selection-overlay',
})

const table = useTable(schema)
const { tableSize } = usePlaygroundShell()
</script>

<template>
  <PlaygroundContent mode="fixed" class="flex flex-col overflow-hidden bg-default">
    <NutDataListRoot :table="table" :size="tableSize">
      <header
        class="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-default px-4 py-3"
      >
        <div class="grid gap-1">
          <h1 class="text-lg font-semibold tracking-tight text-highlighted">Operations queue</h1>
          <p class="text-sm text-muted">
            Select rows to reveal the schema-owned actions overlay at the bottom of the viewport.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <NutDataListSearch />
          <NutDataListFilterTags show-add show-clear />
        </div>
      </header>

      <NutDataListContent fit="fill" surface="contained" />
      <NutDataListSelectionActions />
      <NutDataListPagination />
    </NutDataListRoot>
  </PlaygroundContent>
</template>
