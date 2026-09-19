<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'

import { defineTableSchema, useTable } from '#ui-tools/table'

type InvoiceStatus = 'Open' | 'Paid' | 'Overdue'
interface InvoiceRow {
  id: string
  number: string
  customer: string
  status: InvoiceStatus
  amount: number
  due: string
}

const invoices: InvoiceRow[] = [
  {
    amount: 1840,
    customer: 'Atlas Studio',
    due: '2026-08-22',
    id: 'inv-1001',
    number: 'INV-1001',
    status: 'Open',
  },
  {
    amount: 920,
    customer: 'Northstar Labs',
    due: '2026-08-18',
    id: 'inv-1002',
    number: 'INV-1002',
    status: 'Paid',
  },
  {
    amount: 4210,
    customer: 'Rivet Systems',
    due: '2026-08-12',
    id: 'inv-1003',
    number: 'INV-1003',
    status: 'Overdue',
  },
  {
    amount: 2680,
    customer: 'Monarch Health',
    due: '2026-08-28',
    id: 'inv-1004',
    number: 'INV-1004',
    status: 'Open',
  },
  {
    amount: 740,
    customer: 'Helio Works',
    due: '2026-08-16',
    id: 'inv-1005',
    number: 'INV-1005',
    status: 'Paid',
  },
  {
    amount: 3190,
    customer: 'Vela Commerce',
    due: '2026-08-09',
    id: 'inv-1006',
    number: 'INV-1006',
    status: 'Overdue',
  },
  {
    amount: 1560,
    customer: 'Kumo Design',
    due: '2026-09-02',
    id: 'inv-1007',
    number: 'INV-1007',
    status: 'Open',
  },
  {
    amount: 2120,
    customer: 'Cinder Group',
    due: '2026-08-20',
    id: 'inv-1008',
    number: 'INV-1008',
    status: 'Paid',
  },
]

const schema = defineTableSchema({
  defaultLayout: 'table',
  filters: {
    search: { fields: ['number', 'customer'], placeholder: 'Search invoices' },
    ui: (filter) => [
      filter.option('status', {
        behavior: { defaultOperator: 'isAnyOf' },
        display: { location: 'tag' },
        editor: { closeOnSelect: false, selection: { mode: 'multiple' } },
        label: 'Status',
        source: {
          options: [
            { label: 'Open', value: 'Open' },
            { label: 'Paid', value: 'Paid' },
            { label: 'Overdue', value: 'Overdue' },
          ],
        },
      }),
      filter.text('customer', {
        behavior: { operators: ['contains', 'is'] },
        display: { location: 'panel' },
        editor: { leadingIcon: 'i-lucide-building-2', placeholder: 'Customer name' },
        label: 'Customer',
      }),
      filter.number('amount', {
        behavior: { operators: ['gte', 'lte', 'between'] },
        display: { location: 'panel' },
        editor: { max: 5000, min: 0, step: 100 },
        label: 'Amount',
      }),
      filter.text('due', {
        behavior: { operators: ['contains', 'is'] },
        display: { location: 'tag-dynamic' },
        editor: { leadingIcon: 'i-lucide-calendar-days', placeholder: 'YYYY-MM-DD' },
        label: 'Due date',
      }),
    ],
  },
  pagination: { defaultSize: 8, showPageSizePicker: false, showPagesCount: false },
  rowKey: 'id',
  source: {
    mode: 'client',
    query: () => ({
      queryFn: async () => invoices,
      queryKey: ['table-composition-staged-invoices'],
    }),
  },
  table: {
    columns: (column) => [
      column.field('number', { label: 'Invoice' }),
      column.field('customer', { label: 'Customer' }),
      column.field('status', { label: 'Status' }),
      column.field('amount', { label: 'Amount' }),
      column.field('due', { label: 'Due' }),
    ],
    defaultSorting: { dir: 'asc', key: 'due' },
  },
  tableKey: 'invoices-staged-filters',
})

const table = useTable(schema)
const { tableSize } = usePlaygroundShell()
</script>

<template>
  <PlaygroundContent mode="fixed" class="flex flex-col overflow-hidden bg-default">
    <NutDataListRoot :table="table" :size="tableSize">
      <header class="border-b border-default px-4 py-4 sm:px-6">
        <div class="mx-auto flex w-full max-w-[92rem] flex-wrap items-center justify-between gap-4">
          <div class="flex min-w-0 items-center gap-4">
            <div
              class="grid size-10 shrink-0 place-items-center rounded-md bg-inverted text-inverted"
            >
              <UIcon name="i-lucide-receipt-text" class="size-5" />
            </div>
            <div class="min-w-0">
              <div class="flex items-baseline gap-2">
                <h1 class="text-lg font-semibold tracking-tight text-highlighted">Invoices</h1>
                <NutDataListResultCount />
              </div>
              <p class="truncate text-sm text-muted">Finance workspace · August 2026</p>
            </div>
          </div>
          <UButton :size="tableSize" color="primary" icon="i-lucide-plus" label="New invoice" />
        </div>
      </header>

      <div class="border-b border-default bg-elevated/20 px-4 py-2.5 sm:px-6">
        <div class="mx-auto flex w-full max-w-[92rem] flex-wrap items-center gap-2">
          <NutDataListSearch class="min-w-52 flex-1 sm:max-w-sm" />
          <NutDataListFilterTags />
          <NutDataListAddFilter />
          <div class="ml-auto flex items-center gap-2">
            <NutDataListFilterPanel />
            <NutDataListSortMenu />
            <NutDataListColumnPanel />
          </div>
        </div>
      </div>

      <main class="mx-auto flex min-h-0 w-full max-w-[92rem] flex-1 flex-col px-4 py-4 sm:px-6">
        <div class="mb-3 flex items-center justify-between gap-3 text-sm text-muted">
          <span
            >Filter tags apply immediately; the Filters drawer stages panel fields until
            Apply.</span
          >
          <NutDataListClearFilters label="Reset" />
        </div>
        <NutDataListContent fit="fill" surface="contained" class="min-h-0 flex-1" />
        <NutDataListPagination />
      </main>
    </NutDataListRoot>
  </PlaygroundContent>
</template>
