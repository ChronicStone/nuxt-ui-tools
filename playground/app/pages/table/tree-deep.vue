<script setup lang="tsx">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'

import { defineTableSchema, tableSource, useTable } from '#ui-tools/table'

interface LedgerRow {
  id: string
  code: string
  name: string
  kind: 'group' | 'account' | 'sub-account' | 'entry'
  balance: number
  children?: LedgerRow[]
}

const KINDS = ['group', 'account', 'sub-account', 'entry'] as const
const WIDTHS = [60, 4, 3, 2]
const NAMES = ['Revenue', 'Payroll', 'Cloud', 'Travel', 'Equipment', 'Marketing', 'Legal', 'Tax']

/** Rows that stop here on purpose, so branches and leaves share every level. */
function isLeaf(depth: number, position: number) {
  return (
    (depth === 0 && position % 4 === 2) ||
    (depth === 1 && position % 3 === 1) ||
    (depth === 2 && position % 2 === 1)
  )
}

/** Up to four levels, 60 × 4 × 3 × 2 rows, some stopping early; every id unique across the tree. */
function buildLevel(prefix: string, depth: number): LedgerRow[] {
  return Array.from({ length: WIDTHS[depth] ?? 0 }, (_, position) => {
    const code = `${prefix}${depth === 0 ? '' : '.'}${position + 1}`
    const children =
      depth < WIDTHS.length - 1 && !isLeaf(depth, position)
        ? buildLevel(code, depth + 1)
        : undefined
    return {
      balance: ((position + 1) * 7919 * (depth + 3)) % 90_000,
      children,
      code,
      id: code,
      kind: KINDS[depth] ?? 'entry',
      name: `${NAMES[(position + depth * 3) % NAMES.length]} ${depth === 0 ? position + 1 : ''}`.trim(),
    }
  })
}

const ledger = buildLevel('', 0)

const kindColor = {
  account: 'primary',
  entry: 'neutral',
  group: 'info',
  'sub-account': 'neutral',
} as const

const money = new Intl.NumberFormat('en', {
  currency: 'EUR',
  maximumFractionDigits: 0,
  style: 'currency',
})

const schema = defineTableSchema({
  filters: {
    search: { fields: ['code', 'name'], placeholder: 'Search the ledger' },
  },
  pagination: false,
  rowKey: 'id',
  source: tableSource({
    mode: 'client',
    query: () => ({
      queryFn: () => ledger,
      queryKey: ['table-tree-ledger'],
    }),
  }),
  table: {
    columns: (column) => [
      column.field('code', { label: 'Code', minWidth: 140, sortable: true }),
      column.field('name', {
        label: 'Account',
        minWidth: 240,
        render: ({ row }) => <span class="truncate font-medium text-highlighted">{row.name}</span>,
        sortable: true,
      }),
      column.field('kind', {
        label: 'Level',
        minWidth: 140,
        render: ({ value }) => (
          <UBadge color={kindColor[value]} variant="subtle" size="sm" label={value} />
        ),
      }),
      column.field('balance', {
        align: 'right',
        label: 'Balance',
        minWidth: 140,
        render: ({ value }) => <span class="tabular-nums">{money.format(value)}</span>,
        sortable: true,
      }),
    ],
    selection: true,
    /* Two levels open: groups and their accounts show, sub-accounts wait to be opened. */
    tree: { children: 'children', defaultExpanded: 2 },
  },
  tableKey: 'table-tree-ledger',
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
            <p class="text-sm font-medium text-muted">Accounting</p>
            <div class="flex items-baseline gap-3">
              <h1 class="text-2xl font-semibold tracking-tight text-highlighted">Ledger</h1>
              <NutDataListResultCount />
            </div>
            <p class="text-sm text-muted">
              Up to four levels, virtualized: only the rows that are open and on screen are
              rendered.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <NutDataListSearch />
            <span class="hidden text-xs tabular-nums text-muted sm:inline" aria-live="polite">
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
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              label="Reset"
              icon="i-lucide-rotate-ccw"
              @click="table.expansion.reset()"
            />
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
