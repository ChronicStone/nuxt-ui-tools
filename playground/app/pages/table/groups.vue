<script setup lang="tsx">
import UBadge from '@nuxt/ui/components/Badge.vue'

import { defineTableSchema, tableSource, useTable } from '#ui-tools/table'
import type { TableGroupBySchema } from '#ui-tools/table/types'

interface Exam {
  id: string
  family: string | null
  name: string
  status: 'Active' | 'Draft'
  online: number
  onSite: number
}

const FAMILIES = {
  'Academic English': ['4 Skills', 'Listening', 'Reading', 'Speaking', 'Writing'],
  'Business English': ['4 Skills', 'Listening & Reading', 'Speaking & Writing'],
  'English for Schools: Ages 11-15': ['4 Skills', 'Listening', 'Reading'],
  'English for Schools: Ages 7-10': ['4 Skills', 'Listening'],
  'General English': ['4 Skills', 'Listening & Reading', 'Reading', 'Writing'],
}

const exams: Exam[] = [
  ...Object.entries(FAMILIES).flatMap(([family, names]) =>
    names.map((name, index): Exam => ({
      family,
      id: `${family}-${name}`,
      name,
      online: 30 + index * 6,
      onSite: 24 + index * 5,
      status: index % 3 === 2 ? 'Draft' : 'Active',
    })),
  ),
  {
    family: null,
    id: 'legacy',
    name: 'Workforce Readiness',
    online: 40,
    onSite: 35,
    status: 'Draft',
  },
]

const money = new Intl.NumberFormat('en', { currency: 'EUR', style: 'currency' })

const groupBy: TableGroupBySchema<Exam> = { key: 'family' }

const schema = defineTableSchema({
  actions: [{ action: () => undefined, key: 'export', label: 'Export', requiresSelection: true }],
  filters: { search: { fields: ['name', 'family'], placeholder: 'Search exams' } },
  grid: {
    gridSize: '1 md:2 xl:3',
    groupBy,
    renderItem: ({ row }) => (
      <div class="rounded-md border border-default p-3 text-sm">
        <p class="font-medium text-highlighted">{row.name}</p>
        <p class="text-muted">{money.format(row.online)}</p>
      </div>
    ),
  },
  pagination: false,
  rowKey: 'id',
  source: tableSource({
    mode: 'client',
    query: () => ({ queryFn: () => exams, queryKey: ['table-groups'] }),
  }),
  table: {
    columns: (column) => [
      column.field('name', {
        label: 'Exam',
        pinned: 'left',
        render: ({ row }) => <span class="font-medium text-highlighted">{row.name}</span>,
        sortable: true,
        width: 300,
      }),
      column.field('status', {
        label: 'Status',
        render: ({ row }) => (
          <UBadge
            color={row.status === 'Active' ? 'success' : 'neutral'}
            label={row.status}
            size="sm"
            variant="subtle"
          />
        ),
        sortable: true,
        width: 130,
      }),
      column.field('online', {
        label: 'Online',
        render: ({ row }) => money.format(row.online),
        sortable: true,
        width: 130,
      }),
      column.field('onSite', {
        label: 'On site',
        render: ({ row }) => money.format(row.onSite),
        sortable: true,
        width: 130,
      }),
    ],
    groupBy,
  },
  tableKey: 'playground-table-groups',
})

const table = useTable(schema)
</script>

<template>
  <PlaygroundContent>
    <NutDataListRoot :table="table">
      <NutDataListContent
        fit="fill"
        class="min-h-0 flex-1"
        :ui="{ root: 'rounded-none border-0' }"
      />
    </NutDataListRoot>
  </PlaygroundContent>
</template>
