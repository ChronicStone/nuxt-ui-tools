<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import { defineTableSchema, useTable } from '#ui-tools/table'
import { executeClientQuery } from '#ui-tools/table/utils'

type KnowledgeStatus = 'Published' | 'Draft' | 'Archived'
type KnowledgeType = 'Guide' | 'Reference' | 'Runbook'
interface KnowledgeRow {
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
    featured: true,
    id: 'doc-001',
    owner: 'Operations',
    readTime: 12,
    status: 'Published',
    title: 'Escalation playbook',
    type: 'Runbook',
    updatedAt: '2026-08-18',
  },
  {
    featured: true,
    id: 'doc-002',
    owner: 'Platform',
    readTime: 8,
    status: 'Published',
    title: 'Release checklist',
    type: 'Guide',
    updatedAt: '2026-08-17',
  },
  {
    featured: false,
    id: 'doc-003',
    owner: 'Design',
    readTime: 6,
    status: 'Published',
    title: 'Design token reference',
    type: 'Reference',
    updatedAt: '2026-08-16',
  },
  {
    featured: false,
    id: 'doc-004',
    owner: 'Operations',
    readTime: 10,
    status: 'Draft',
    title: 'Incident handoff',
    type: 'Runbook',
    updatedAt: '2026-08-15',
  },
  {
    featured: true,
    id: 'doc-005',
    owner: 'Platform',
    readTime: 14,
    status: 'Published',
    title: 'Query state guide',
    type: 'Guide',
    updatedAt: '2026-08-14',
  },
  {
    featured: false,
    id: 'doc-006',
    owner: 'Design',
    readTime: 9,
    status: 'Published',
    title: 'Form field reference',
    type: 'Reference',
    updatedAt: '2026-08-13',
  },
  {
    featured: false,
    id: 'doc-007',
    owner: 'Operations',
    readTime: 5,
    status: 'Archived',
    title: 'On-call opening steps',
    type: 'Runbook',
    updatedAt: '2026-08-12',
  },
  {
    featured: true,
    id: 'doc-008',
    owner: 'Platform',
    readTime: 11,
    status: 'Draft',
    title: 'Table composition guide',
    type: 'Guide',
    updatedAt: '2026-08-11',
  },
  {
    featured: false,
    id: 'doc-009',
    owner: 'Design',
    readTime: 7,
    status: 'Published',
    title: 'Color usage reference',
    type: 'Reference',
    updatedAt: '2026-08-10',
  },
  {
    featured: false,
    id: 'doc-010',
    owner: 'Platform',
    readTime: 13,
    status: 'Published',
    title: 'Remote query runbook',
    type: 'Runbook',
    updatedAt: '2026-08-09',
  },
  {
    featured: false,
    id: 'doc-011',
    owner: 'Operations',
    readTime: 9,
    status: 'Draft',
    title: 'Support response guide',
    type: 'Guide',
    updatedAt: '2026-08-08',
  },
  {
    featured: false,
    id: 'doc-012',
    owner: 'Design',
    readTime: 4,
    status: 'Archived',
    title: 'Layout density reference',
    type: 'Reference',
    updatedAt: '2026-08-07',
  },
]

function optionCounts<TValue extends string>(
  values: readonly TValue[],
  valueForRow: (row: KnowledgeRow) => TValue,
) {
  return values.map((value) => ({
    count: documents.filter((row) => valueForRow(row) === value).length,
    label: value,
    value,
  }))
}

const statusOptions = optionCounts(['Published', 'Draft', 'Archived'] as const, (row) => row.status)
const typeOptions = optionCounts(['Guide', 'Reference', 'Runbook'] as const, (row) => row.type)
const ownerOptions = optionCounts(['Design', 'Operations', 'Platform'] as const, (row) => row.owner)

const schema = defineTableSchema({
  defaultLayout: 'table',
  filters: {
    search: { fields: ['title', 'owner'], placeholder: 'Search knowledge base' },
    ui: (filter) => [
      filter.option('status', {
        display: { location: 'panel' },
        editor: {
          closeOnSelect: false,
          row: { showCounts: true },
          searchable: false,
          selection: { mode: 'multiple' },
        },
        label: 'Status',
        source: { options: statusOptions },
      }),
      filter.option('type', {
        display: { location: 'panel' },
        editor: {
          closeOnSelect: false,
          row: { showCounts: true },
          searchable: false,
          selection: { mode: 'multiple' },
        },
        label: 'Document type',
        source: { options: typeOptions },
      }),
      filter.option('owner', {
        display: { location: 'panel' },
        editor: {
          closeOnSelect: false,
          row: { showCounts: true },
          searchable: false,
          selection: { mode: 'multiple' },
        },
        label: 'Owner',
        source: { options: ownerOptions },
      }),
      filter.boolean('featured', {
        display: { location: 'panel' },
        label: 'Featured only',
      }),
      filter.number('readTime', {
        behavior: { operators: ['lte', 'between'] },
        display: { location: 'panel' },
        label: 'Reading time',
      }),
    ],
  },
  pagination: { count: 'exact', mode: 'cursor', pageSize: 10 },
  rowKey: 'id',
  source: {
    mode: 'remote',
    query: (request) => ({
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
      queryKey: ['table-composition-knowledge-base', request],
    }),
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
    defaultSorting: { dir: 'desc', key: 'updatedAt' },
  },
  tableKey: 'knowledge-base-filter-rail',
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
              <UButton
                :size="tableSize"
                color="neutral"
                variant="outline"
                label="Retry"
                @click="retry"
              />
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
