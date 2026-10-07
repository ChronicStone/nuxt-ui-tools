<script setup lang="tsx">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import { defineTableSchema, tableSource, useTable } from '#ui-tools/table'

type InvoiceStatus = 'Paid' | 'Open' | 'Overdue' | 'Credited'
interface InvoiceRow {
  id: string
  number: string
  kind: 'invoice' | 'credit-note'
  customer: string
  issuedAt: string
  status: InvoiceStatus
  amount: number
  /** Credit notes issued against the invoice; each opens beneath it. */
  creditNotes?: InvoiceRow[]
}

function creditNote(
  invoice: string,
  position: number,
  customer: string,
  issuedAt: string,
  amount: number,
): InvoiceRow {
  return {
    amount: -amount,
    customer,
    id: `${invoice}-CN${position}`,
    issuedAt,
    kind: 'credit-note',
    number: `CN-${invoice.slice(4)}-${position}`,
    status: 'Credited',
  }
}

const invoices: InvoiceRow[] = [
  {
    amount: 4820,
    creditNotes: [
      creditNote('INV-2041', 1, 'Northwind Traders', '2026-09-12', 620),
      creditNote('INV-2041', 2, 'Northwind Traders', '2026-09-19', 180),
    ],
    customer: 'Northwind Traders',
    id: 'INV-2041',
    issuedAt: '2026-09-02',
    kind: 'invoice',
    number: 'INV-2041',
    status: 'Paid',
  },
  {
    amount: 1260,
    customer: 'Globex Corporation',
    id: 'INV-2042',
    issuedAt: '2026-09-03',
    kind: 'invoice',
    number: 'INV-2042',
    status: 'Open',
  },
  {
    amount: 9340,
    creditNotes: [
      creditNote('INV-2043', 1, 'Initech', '2026-09-10', 1500),
      creditNote('INV-2043', 2, 'Initech', '2026-09-14', 800),
      creditNote('INV-2043', 3, 'Initech', '2026-09-25', 340),
    ],
    customer: 'Initech',
    id: 'INV-2043',
    issuedAt: '2026-09-04',
    kind: 'invoice',
    number: 'INV-2043',
    status: 'Overdue',
  },
  {
    amount: 760,
    customer: 'Umbrella Health',
    id: 'INV-2044',
    issuedAt: '2026-09-06',
    kind: 'invoice',
    number: 'INV-2044',
    status: 'Paid',
  },
  {
    amount: 2150,
    creditNotes: [creditNote('INV-2045', 1, 'Soylent Foods', '2026-09-18', 2150)],
    customer: 'Soylent Foods',
    id: 'INV-2045',
    issuedAt: '2026-09-07',
    kind: 'invoice',
    number: 'INV-2045',
    status: 'Credited',
  },
  {
    amount: 3980,
    customer: 'Hooli',
    id: 'INV-2046',
    issuedAt: '2026-09-09',
    kind: 'invoice',
    number: 'INV-2046',
    status: 'Open',
  },
  {
    amount: 540,
    customer: 'Stark Industries',
    id: 'INV-2047',
    issuedAt: '2026-09-11',
    kind: 'invoice',
    number: 'INV-2047',
    status: 'Paid',
  },
  {
    amount: 6120,
    creditNotes: [creditNote('INV-2048', 1, 'Wayne Enterprises', '2026-09-22', 410)],
    customer: 'Wayne Enterprises',
    id: 'INV-2048',
    issuedAt: '2026-09-13',
    kind: 'invoice',
    number: 'INV-2048',
    status: 'Paid',
  },
  {
    amount: 880,
    customer: 'Acme Corporation',
    id: 'INV-2049',
    issuedAt: '2026-09-15',
    kind: 'invoice',
    number: 'INV-2049',
    status: 'Open',
  },
  {
    amount: 1740,
    customer: 'Vandelay Industries',
    id: 'INV-2050',
    issuedAt: '2026-09-16',
    kind: 'invoice',
    number: 'INV-2050',
    status: 'Overdue',
  },
]

const statusColor = {
  Credited: 'info',
  Open: 'warning',
  Overdue: 'error',
  Paid: 'success',
} as const

const money = new Intl.NumberFormat('en', { currency: 'EUR', style: 'currency' })
const dateFormat = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const schema = defineTableSchema({
  filters: {
    search: {
      /* A dotted path reaches into the children, so a credit note number finds its invoice. */
      fields: ['number', 'customer', 'creditNotes.number'],
      placeholder: 'Search invoices or credit notes',
    },
  },
  pagination: false,
  rowKey: 'id',
  source: tableSource({
    mode: 'client',
    query: () => ({
      queryFn: () => invoices,
      queryKey: ['table-tree-invoices'],
    }),
  }),
  table: {
    columns: (column) => [
      column.field('number', {
        icon: 'i-lucide-receipt-text',
        label: 'Document',
        minWidth: 200,
        render: ({ row }) => (
          <div class="flex min-w-0 items-center gap-2">
            <UIcon
              name={row.kind === 'invoice' ? 'i-lucide-file-text' : 'i-lucide-file-minus'}
              class={['size-4 shrink-0', row.kind === 'invoice' ? 'text-muted' : 'text-info']}
            />
            <span class="truncate font-medium text-highlighted">{row.number}</span>
          </div>
        ),
        sortable: true,
      }),
      column.field('customer', { label: 'Customer', minWidth: 200, sortable: true }),
      column.field('issuedAt', {
        label: 'Issued',
        minWidth: 140,
        render: ({ value }) => (
          <span class="text-muted">{dateFormat.format(new Date(String(value)))}</span>
        ),
        sortable: true,
      }),
      column.field('status', {
        label: 'Status',
        minWidth: 130,
        render: ({ value }) => (
          <UBadge color={statusColor[value]} variant="subtle" size="sm" label={value} />
        ),
      }),
      column.field('amount', {
        align: 'right',
        label: 'Amount',
        minWidth: 140,
        render: ({ row, value }) => (
          <span
            class={['tabular-nums', row.kind === 'credit-note' ? 'text-info' : 'text-highlighted']}
          >
            {money.format(value)}
          </span>
        ),
        sortable: true,
      }),
    ],
    defaultSorting: { dir: 'asc', key: 'number' },
    selection: true,
    tree: { children: 'creditNotes', defaultExpanded: false },
  },
  tableKey: 'table-tree-invoices',
})

const table = useTable(schema)
const { tableSize } = usePlaygroundShell()
const expansion = computed(() => table.expansion.state.value)
</script>

<template>
  <PlaygroundContent mode="fixed" class="flex flex-col overflow-hidden bg-default">
    <NutDataListRoot :table="table" :size="tableSize">
      <header class="border-b border-default px-4 py-4 lg:px-8">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div class="grid gap-1.5">
            <p class="text-sm font-medium text-muted">Billing</p>
            <div class="flex items-baseline gap-3">
              <h1 class="text-2xl font-semibold tracking-tight text-highlighted">Invoices</h1>
              <NutDataListResultCount />
            </div>
            <p class="text-sm text-muted">
              Credit notes open beneath the invoice they were issued against.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <NutDataListSearch />
            <div class="flex items-center gap-1.5" aria-live="polite">
              <span class="hidden text-xs tabular-nums text-muted sm:inline">
                {{ expansion.expandedCount }} of {{ expansion.branchCount }} open
              </span>
              <UButton
                size="sm"
                color="neutral"
                variant="outline"
                label="Expand all"
                icon="i-lucide-chevrons-up-down"
                @click="table.expansion.expandAll()"
              />
              <UButton
                size="sm"
                color="neutral"
                variant="outline"
                label="Collapse all"
                icon="i-lucide-chevrons-down-up"
                @click="table.expansion.collapseAll()"
              />
            </div>
          </div>
        </div>
      </header>

      <NutDataListContent
        fit="fill"
        surface="plain"
        class="min-h-0 flex-1"
        :ui="{ root: 'rounded-none border-0' }"
      />
    </NutDataListRoot>
  </PlaygroundContent>
</template>
