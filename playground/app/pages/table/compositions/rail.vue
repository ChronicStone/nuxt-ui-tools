<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import { defineTableSchema, useTable } from '#ui-tools/table'
import { executeClientQuery } from '#ui-tools/table/utils'

type KnowledgeStatus = 'Published' | 'Draft' | 'Archived'
type KnowledgeType = 'Guide' | 'Reference' | 'Runbook'
type KnowledgeRow = {
  id: string
  title: string
  status: KnowledgeStatus
  type: KnowledgeType
  owner: 'Design' | 'Operations' | 'Platform'
  readTime: number
  updatedAt: string
  featured: boolean
}

const documents: KnowledgeRow[] = [
  {
    id: 'doc-001',
    title: 'Escalation playbook',
    status: 'Published',
    type: 'Runbook',
    owner: 'Operations',
    readTime: 12,
    updatedAt: '2026-08-18',
    featured: true,
  },
  {
    id: 'doc-002',
    title: 'Release checklist',
    status: 'Published',
    type: 'Guide',
    owner: 'Platform',
    readTime: 8,
    updatedAt: '2026-08-17',
    featured: true,
  },
  {
    id: 'doc-003',
    title: 'Design token reference',
    status: 'Published',
    type: 'Reference',
    owner: 'Design',
    readTime: 6,
    updatedAt: '2026-08-16',
    featured: false,
  },
  {
    id: 'doc-004',
    title: 'Incident handoff',
    status: 'Draft',
    type: 'Runbook',
    owner: 'Operations',
    readTime: 10,
    updatedAt: '2026-08-15',
    featured: false,
  },
  {
    id: 'doc-005',
    title: 'Query state guide',
    status: 'Published',
    type: 'Guide',
    owner: 'Platform',
    readTime: 14,
    updatedAt: '2026-08-14',
    featured: true,
  },
  {
    id: 'doc-006',
    title: 'Form field reference',
    status: 'Published',
    type: 'Reference',
    owner: 'Design',
    readTime: 9,
    updatedAt: '2026-08-13',
    featured: false,
  },
  {
    id: 'doc-007',
    title: 'On-call opening steps',
    status: 'Archived',
    type: 'Runbook',
    owner: 'Operations',
    readTime: 5,
    updatedAt: '2026-08-12',
    featured: false,
  },
  {
    id: 'doc-008',
    title: 'Table composition guide',
    status: 'Draft',
    type: 'Guide',
    owner: 'Platform',
    readTime: 11,
    updatedAt: '2026-08-11',
    featured: true,
  },
  {
    id: 'doc-009',
    title: 'Color usage reference',
    status: 'Published',
    type: 'Reference',
    owner: 'Design',
    readTime: 7,
    updatedAt: '2026-08-10',
    featured: false,
  },
  {
    id: 'doc-010',
    title: 'Remote query runbook',
    status: 'Published',
    type: 'Runbook',
    owner: 'Platform',
    readTime: 13,
    updatedAt: '2026-08-09',
    featured: false,
  },
  {
    id: 'doc-011',
    title: 'Support response guide',
    status: 'Draft',
    type: 'Guide',
    owner: 'Operations',
    readTime: 9,
    updatedAt: '2026-08-08',
    featured: false,
  },
  {
    id: 'doc-012',
    title: 'Layout density reference',
    status: 'Archived',
    type: 'Reference',
    owner: 'Design',
    readTime: 4,
    updatedAt: '2026-08-07',
    featured: false,
  },
]

function optionCounts<TValue extends string>(
  values: readonly TValue[],
  valueForRow: (row: KnowledgeRow) => TValue,
) {
  return values.map((value) => ({
    label: value,
    value,
    count: documents.filter((row) => valueForRow(row) === value).length,
  }))
}

const statusOptions = optionCounts(['Published', 'Draft', 'Archived'] as const, (row) => row.status)
const typeOptions = optionCounts(['Guide', 'Reference', 'Runbook'] as const, (row) => row.type)
const ownerOptions = optionCounts(['Design', 'Operations', 'Platform'] as const, (row) => row.owner)

const schema = defineTableSchema({
  tableKey: 'knowledge-base-filter-rail',
  rowKey: 'id',
  defaultLayout: 'table',
  pagination: { mode: 'cursor', pageSize: 10, count: 'exact' },
  source: {
    mode: 'remote',
    query: (request) => ({
      queryKey: ['table-composition-knowledge-base', request],
      queryFn: async () => {
        const prepared = executeClientQuery({
          rows: documents,
          request: { ...request, pagination: { mode: 'none' } },
        })
        const pagination = request.pagination
        const cursor = pagination.mode === 'cursor' ? Number(pagination.cursor ?? 0) : 0
        const pageSize = pagination.mode === 'cursor' ? pagination.pageSize : prepared.rows.length
        const rows = prepared.rows.slice(cursor, cursor + pageSize)
        const nextOffset = cursor + rows.length

        await new Promise((resolve) => setTimeout(resolve, 160))

        return {
          rows,
          pageInfo: {
            mode: 'cursor' as const,
            pageSize,
            nextCursor: nextOffset < prepared.rowCount ? String(nextOffset) : null,
            count: 'exact' as const,
            rowCount: prepared.rowCount,
          },
        }
      },
    }),
  },
  filters: {
    search: { fields: ['title', 'owner'], placeholder: 'Search knowledge base' },
    ui: (filter) => [
      filter.option('status', {
        label: 'Status',
        display: { location: 'panel' },
        source: { options: statusOptions },
        editor: {
          searchable: false,
          closeOnSelect: false,
          selection: { mode: 'multiple' },
          row: { showCounts: true },
        },
      }),
      filter.option('type', {
        label: 'Document type',
        display: { location: 'panel' },
        source: { options: typeOptions },
        editor: {
          searchable: false,
          closeOnSelect: false,
          selection: { mode: 'multiple' },
          row: { showCounts: true },
        },
      }),
      filter.option('owner', {
        label: 'Owner',
        display: { location: 'panel' },
        source: { options: ownerOptions },
        editor: {
          searchable: false,
          closeOnSelect: false,
          selection: { mode: 'multiple' },
          row: { showCounts: true },
        },
      }),
      filter.boolean('featured', {
        label: 'Featured only',
        display: { location: 'panel' },
      }),
      filter.number('readTime', {
        label: 'Reading time',
        behavior: { operators: ['lte', 'between'] },
        display: { location: 'panel' },
      }),
    ],
  },
  table: {
    columns: (column) => [
      column.field('title', { label: 'Document' }),
      column.field('status', { label: 'Status' }),
      column.field('type', { label: 'Type' }),
      column.field('owner', { label: 'Owner' }),
      column.field('readTime', { label: 'Read · min' }),
      column.field('updatedAt', { label: 'Updated' }),
    ],
    defaultSorting: { key: 'updatedAt', dir: 'desc' },
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
        <div class="flex items-baseline gap-3">
          <h1 class="text-xl font-semibold tracking-tight text-highlighted">Knowledge base</h1>
          <NutDataListResultCount />
        </div>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <NutDataListSearch />
          <NutDataListSortMenu />
          <UButton :size="tableSize" color="primary" icon="i-lucide-plus" label="New document" />
        </div>
      </header>

      <div
        class="flex min-h-12 flex-wrap items-center gap-2 border-b border-default bg-elevated/25 px-4 py-2"
      >
        <NutDataListAddFilter />
        <NutDataListClearFilters label="Reset filters" />
        <div class="ml-auto text-sm text-muted">
          <NutDataListResultCount>
            <template #default="{ loadedCount, totalCount }">
              {{ loadedCount }} of {{ totalCount ?? 'many' }} documents
            </template>
          </NutDataListResultCount>
        </div>
      </div>

      <section
        class="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] overflow-y-auto lg:grid-rows-1 lg:grid-cols-[18rem_minmax(0,1fr)] lg:overflow-hidden"
      >
        <aside
          class="max-h-64 overflow-y-auto border-b border-default p-4 lg:max-h-none lg:min-h-0 lg:border-b-0 lg:border-r"
        >
          <div class="mb-4 grid gap-1">
            <h2 class="text-sm font-semibold text-highlighted">Filter rail</h2>
            <p class="text-xs leading-5 text-muted">
              Counts and options come from the knowledge rows in this route.
            </p>
          </div>
          <NutDataListFilterPanel mode="panel" commit-mode="live" />
        </aside>

        <NutDataListContent fit="fill" surface="contained" class="min-w-0">
          <template #error="{ retry }">
            <div class="grid min-h-64 place-items-center gap-3 text-center">
              <UIcon name="i-lucide-cloud-alert" class="mx-auto size-7 text-danger" />
              <p class="text-sm text-muted">Knowledge documents could not be loaded.</p>
              <UButton :size="tableSize" color="neutral" variant="outline" label="Retry" @click="retry" />
            </div>
          </template>
          <template #empty>
            <div class="grid min-h-64 place-items-center gap-2 text-center">
              <UIcon name="i-lucide-book-open" class="mx-auto size-7 text-muted" />
              <h2 class="font-medium text-highlighted">No matching documents</h2>
              <p class="text-sm text-muted">Reset filters or broaden the search.</p>
            </div>
          </template>
          <template #after>
            <NutDataListInfiniteLoader>
              <template #end="{ loadedCount }">
                <span class="text-sm text-muted">All {{ loadedCount }} documents loaded</span>
              </template>
            </NutDataListInfiniteLoader>
          </template>
        </NutDataListContent>
      </section>
    </NutDataListRoot>
  </PlaygroundContent>
</template>
