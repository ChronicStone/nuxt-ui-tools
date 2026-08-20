<script setup lang="ts">
import { defineTableSchema, useTable } from '#ui-tools/table'

type QueueState = 'Queued' | 'Running' | 'Complete'
type OperationRow = {
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
    state: 'Running',
    records: 18240,
    startedAt: '08:42',
  },
  {
    id: 'job-02',
    job: 'Sync billing exports',
    owner: 'Finance',
    state: 'Queued',
    records: 4680,
    startedAt: '08:31',
  },
  {
    id: 'job-03',
    job: 'Generate archive',
    owner: 'Operations',
    state: 'Complete',
    records: 92100,
    startedAt: '07:58',
  },
  {
    id: 'job-04',
    job: 'Refresh customer facets',
    owner: 'Data',
    state: 'Queued',
    records: 12400,
    startedAt: '07:46',
  },
  {
    id: 'job-05',
    job: 'Rebuild search index',
    owner: 'Platform',
    state: 'Complete',
    records: 18320,
    startedAt: '07:18',
  },
  {
    id: 'job-06',
    job: 'Sync billing exports',
    owner: 'Finance',
    state: 'Running',
    records: 5200,
    startedAt: '06:55',
  },
  {
    id: 'job-07',
    job: 'Refresh customer facets',
    owner: 'Data',
    state: 'Complete',
    records: 11880,
    startedAt: '06:32',
  },
  {
    id: 'job-08',
    job: 'Generate archive',
    owner: 'Operations',
    state: 'Queued',
    records: 64000,
    startedAt: '06:18',
  },
]

const schema = defineTableSchema({
  tableKey: 'operations-selection-overlay',
  rowKey: 'id',
  defaultLayout: 'table',
  pagination: { defaultSize: 8, showPagesCount: false, showPageSizePicker: false },
  source: {
    mode: 'client',
    query: () => ({
      queryKey: ['table-composition-operations'],
      queryFn: async () => operations,
    }),
  },
  selection: { mode: 'auto', scope: 'page' },
  actions: [
    {
      key: 'mark-ready',
      label: 'Mark ready',
      icon: 'i-lucide-check-check',
      requiresSelection: true,
      action: async () => Promise.resolve(),
    },
    {
      key: 'retry-selected',
      label: 'Retry selected',
      icon: 'i-lucide-refresh-cw',
      requiresSelection: true,
      action: async () => Promise.resolve(),
    },
  ],
  filters: {
    search: { fields: ['job', 'owner'], placeholder: 'Search operations' },
    ui: (filter) => [
      filter.option('state', {
        label: 'State',
        display: { location: 'tag-dynamic' },
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
  table: {
    columns: (column) => [
      column.field('job', { label: 'Job' }),
      column.field('owner', { label: 'Owner' }),
      column.field('state', { label: 'State' }),
      column.field('records', { label: 'Records' }),
      column.field('startedAt', { label: 'Started' }),
    ],
  },
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
