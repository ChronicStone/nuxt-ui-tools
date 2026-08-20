<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'

import { defineTableSchema, useTable } from '#ui-tools/table'

type InvoiceStatus = 'Open' | 'Paid' | 'Overdue'
type InvoiceRow = {
  id: string
  number: string
  customer: string
  status: InvoiceStatus
  amount: number
  due: string
}

const invoices: InvoiceRow[] = [
  {
    id: 'inv-1001',
    number: 'INV-1001',
    customer: 'Atlas Studio',
    status: 'Open',
    amount: 1840,
    due: '2026-08-22',
  },
  {
    id: 'inv-1002',
    number: 'INV-1002',
    customer: 'Northstar Labs',
    status: 'Paid',
    amount: 920,
    due: '2026-08-18',
  },
  {
    id: 'inv-1003',
    number: 'INV-1003',
    customer: 'Rivet Systems',
    status: 'Overdue',
    amount: 4210,
    due: '2026-08-12',
  },
  {
    id: 'inv-1004',
    number: 'INV-1004',
    customer: 'Monarch Health',
    status: 'Open',
    amount: 2680,
    due: '2026-08-28',
  },
  {
    id: 'inv-1005',
    number: 'INV-1005',
    customer: 'Helio Works',
    status: 'Paid',
    amount: 740,
    due: '2026-08-16',
  },
  {
    id: 'inv-1006',
    number: 'INV-1006',
    customer: 'Vela Commerce',
    status: 'Overdue',
    amount: 3190,
    due: '2026-08-09',
  },
  {
    id: 'inv-1007',
    number: 'INV-1007',
    customer: 'Kumo Design',
    status: 'Open',
    amount: 1560,
    due: '2026-09-02',
  },
  {
    id: 'inv-1008',
    number: 'INV-1008',
    customer: 'Cinder Group',
    status: 'Paid',
    amount: 2120,
    due: '2026-08-20',
  },
]

const schema = defineTableSchema({
  tableKey: 'invoices-staged-filters',
  rowKey: 'id',
  defaultLayout: 'table',
  pagination: { defaultSize: 8, showPagesCount: false, showPageSizePicker: false },
  source: {
    mode: 'client',
    query: () => ({
      queryKey: ['table-composition-staged-invoices'],
      queryFn: async () => invoices,
    }),
  },
  filters: {
    search: { fields: ['number', 'customer'], placeholder: 'Search invoices' },
    ui: (filter) => [
      filter.option('status', {
        label: 'Status',
        behavior: { defaultOperator: 'isAnyOf' },
        display: { location: 'tag' },
        source: {
          options: [
            { label: 'Open', value: 'Open' },
            { label: 'Paid', value: 'Paid' },
            { label: 'Overdue', value: 'Overdue' },
          ],
        },
        editor: { selection: { mode: 'multiple' }, closeOnSelect: false },
      }),
      filter.text('customer', {
        label: 'Customer',
        behavior: { operators: ['contains', 'is'] },
        display: { location: 'panel' },
        editor: { placeholder: 'Customer name', leadingIcon: 'i-lucide-building-2' },
      }),
      filter.number('amount', {
        label: 'Amount',
        behavior: { operators: ['gte', 'lte', 'between'] },
        display: { location: 'panel' },
        editor: { min: 0, max: 5000, step: 100 },
      }),
      filter.text('due', {
        label: 'Due date',
        behavior: { operators: ['contains', 'is'] },
        display: { location: 'tag-dynamic' },
        editor: { placeholder: 'YYYY-MM-DD', leadingIcon: 'i-lucide-calendar-days' },
      }),
    ],
  },
  table: {
    columns: (column) => [
      column.field('number', { label: 'Invoice' }),
      column.field('customer', { label: 'Customer' }),
      column.field('status', { label: 'Status' }),
      column.field('amount', { label: 'Amount' }),
      column.field('due', { label: 'Due' }),
    ],
    defaultSorting: { key: 'due', dir: 'asc' },
  },
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
