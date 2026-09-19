import { h } from 'vue'

import { defineTableSchema } from '#ui-tools/table/schema'
import type { TableCursorPageResult, TableQueryDefinition, TableSummariesSchema } from '#ui-tools/table/types'

export type AccountStatus = 'active' | 'pending' | 'inactive'

export interface AccountRow {
  id: string
  name: string
  legalEntity: string
  status: AccountStatus
  country: 'FR' | 'DE' | 'ES'
  contracts: number
  consumption: number
  edofSync: boolean
  updatedAt: string
}

export const STATUS_COLOR = { active: '#ff9600', pending: '#b8b1a7', inactive: '#c0392b' } as const
export const STATUS_LABEL = { active: 'Actif', pending: 'En attente', inactive: 'Inactif' } as const
const STATUSES: AccountStatus[] = ['active', 'pending', 'inactive']
const COUNTRIES = ['FR', 'DE', 'ES'] as const

export function createAccounts(count: number): AccountRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `acc-${index + 1}`,
    name: `Compte ${String(index + 1).padStart(3, '0')}`,
    legalEntity: `Entité ${index + 1}`,
    status: STATUSES[index % 3]!,
    country: COUNTRIES[index % 3]!,
    contracts: (index % 7) + 1,
    consumption: (index + 1) * 10,
    edofSync: index % 2 === 0,
    updatedAt: new Date(Date.UTC(2026, 0, 1 + (index % 28))).toISOString(),
  }))
}

export interface AccountsSchemaOptions {
  rows?: AccountRow[]
  delay?: number
  onQuery?: (context: unknown) => void
  pagination?: false | Record<string, unknown>
  actions?: boolean
  rowActions?: boolean
  selection?: { mode?: boolean | 'auto'; scope?: 'page' | 'all' }
  grid?: boolean
  tableEnabled?: boolean | string
  summaries?: boolean
  summariesResolve?: TableSummariesSchema['resolve']
  panelFilters?: boolean
  statusDefault?: AccountStatus[]
  fail?: boolean
}

export const bulkActionCalls: string[] = []

export function createAccountsSchema(options: AccountsSchemaOptions = {}) {
  const rows = options.rows ?? createAccounts(60)
  return defineTableSchema({
    tableKey: 'accounts',
    rowKey: 'id',
    defaultLayout: 'table',
    pagination:
      options.pagination === false
        ? false
        : {
            defaultSize: { table: 20, grid: 12 },
            sizeOptions: { table: [10, 20, 50], grid: [12, 24] },
            ...(options.pagination ?? {}),
          },
    selection: { mode: options.selection?.mode ?? 'auto', scope: options.selection?.scope ?? 'all' },
    source: {
      mode: 'client',
      query: (context): TableQueryDefinition<AccountRow[]> => ({
        queryKey: ['accounts', rows.length, options.fail ? 'fail' : 'ok'],
        queryFn: async () => {
          options.onQuery?.(context)
          if (options.delay) await new Promise((resolve) => setTimeout(resolve, options.delay))
          if (options.fail) throw new Error('boom')
          return rows
        },
      }),
    },
    filters: {
      search: { fields: ['name', 'legalEntity'], placeholder: 'Rechercher un compte…' },
      ui: (filter) => [
        filter.option('status', {
          label: 'Statut',
          behavior: {
            defaultOperator: 'isAnyOf',
            ...(options.statusDefault ? { defaultValue: options.statusDefault } : {}),
            commitMode: 'auto',
          },
          display: { location: 'tag', order: 1 },
          source: {
            options: STATUSES.map((value) => ({ value, label: STATUS_LABEL[value], color: STATUS_COLOR[value] })),
          },
          editor: { searchable: false, selection: { mode: 'multiple' } },
        }),
        filter.option('country', {
          label: 'Pays',
          behavior: { defaultOperator: 'isAnyOf', operators: ['isAnyOf', 'is', 'isNot'], commitMode: 'auto' },
          display: options.panelFilters ? { location: 'panel', order: 2, group: 'Identité' } : { location: 'tag-dynamic', order: 2 },
          source: { options: COUNTRIES.map((value) => ({ value, label: value })), facet: 'exclude-self' },
          editor: { selection: { mode: 'multiple' } },
        }),
        filter.boolean('edofSync', { label: 'Synchronisation EDOF', display: { location: 'tag-dynamic', order: 3 } }),
        ...(options.panelFilters
          ? [
              filter.text('legalEntity', {
                label: 'Entité légale',
                behavior: { operators: ['contains', 'is', 'isNot'] },
                display: { location: 'panel', order: 4, group: 'Identité' },
                editor: { placeholder: 'Entité…' },
              }),
              filter.number('contracts', {
                label: 'Contrats',
                behavior: { operators: ['is', 'gte', 'lte', 'between'] },
                display: { location: 'panel', order: 5, group: 'Volumes' },
              }),
            ]
          : []),
      ],
    },
    grid:
      options.grid === false
        ? undefined
        : {
            mode: 'contained',
            gridSize: '1 md:2 xl:3',
            defaultSorting: { key: 'name', dir: 'asc' },
            sortOptions: [
              { key: 'name', label: 'Nom' },
              { key: 'status', label: 'Statut' },
            ],
            renderItem: ({ row }) => h('article', { class: 'card', 'data-row': (row as AccountRow).id }, (row as AccountRow).name),
          },
    table: {
      enabled: options.tableEnabled ?? true,
      defaultSorting: { key: 'name', dir: 'asc' },
      ...(options.summaries === false
        ? {}
        : { summaries: { scope: 'filtered', ...(options.summariesResolve ? { resolve: options.summariesResolve } : {}) } }),
      columns: (column) => [
        column.field('name', {
          label: 'Nom',
          sortable: true,
          width: 228,
          minWidth: 200,
          required: true,
          pinned: 'left',
          skeleton: 'avatar',
          render: ({ row }) => h('b', { class: 'name' }, (row as AccountRow).name),
        }),
        column.field('status', {
          label: 'Statut',
          sortable: true,
          width: 110,
          skeleton: 'dot',
          render: ({ row }) => STATUS_LABEL[(row as AccountRow).status],
        }),
        column.field('country', { label: 'Pays', sortable: true, lines: 2 }),
        column.field('legalEntity', { label: 'Entité légale', ellipsis: true, visible: false }),
        column.field('edofSync', {
          label: 'EDOF',
          skeleton: 'check',
          render: ({ row }) => ((row as AccountRow).edofSync ? '✓' : '—'),
        }),
        column.field('contracts', {
          label: 'Contrats',
          sortable: true,
          align: 'right',
          summary: 'sum',
          render: ({ row }) => String((row as AccountRow).contracts),
        }),
        column.field('consumption', {
          label: 'Conso.',
          sortable: true,
          align: 'right',
          summary: {
            resolve: async ({ rows: scoped }) => {
              await new Promise((resolve) => setTimeout(resolve, 5))
              return (scoped as AccountRow[]).reduce((total, row) => total + row.consumption, 0)
            },
            format: (value) => `${String(value)} t`,
          },
          render: ({ row }) => String((row as AccountRow).consumption),
        }),
      ],
    },
    ...(options.actions === false
      ? {}
      : {
          actions: [
            { key: 'export', label: 'Exporter', icon: 'i-lucide-download', action: () => bulkActionCalls.push('export') },
            { key: 'sync', label: 'Synchroniser', icon: 'i-lucide-refresh-cw', action: () => bulkActionCalls.push('sync') },
            { key: 'archive', label: 'Archiver', icon: 'i-lucide-archive', action: () => bulkActionCalls.push('archive') },
            { key: 'inactive', label: 'Passer inactif', icon: 'i-lucide-clock', action: () => bulkActionCalls.push('inactive') },
            { key: 'delete', label: 'Supprimer', icon: 'i-lucide-trash-2', action: () => bulkActionCalls.push('delete') },
          ],
        }),
    ...(options.rowActions === false
      ? {}
      : {
          rowActions: ({ row }) => [
            { key: 'view', label: 'Voir la fiche', icon: 'i-lucide-arrow-right', action: () => {} },
            ...((row as AccountRow).status === 'pending'
              ? [{ key: 'activate', label: 'Activer', icon: 'i-lucide-check', action: () => {} }]
              : []),
          ],
        }),
  })
}

export interface AuditRow {
  id: string
  action: string
  actor: string
  at: string
}

export function createAuditSchema(options: { total?: number; pageSize?: number; delay?: number; onPage?: (cursor: string | null) => void } = {}) {
  const total = options.total ?? 45
  const pageSize = options.pageSize ?? 20
  const rows: AuditRow[] = Array.from({ length: total }, (_, index) => ({
    id: `evt-${index + 1}`,
    action: index % 2 ? 'update' : 'create',
    actor: `user-${(index % 5) + 1}`,
    at: new Date(Date.UTC(2026, 1, 1, index)).toISOString(),
  }))
  return defineTableSchema({
    tableKey: 'audit',
    rowKey: 'id',
    pagination: { mode: 'cursor', pageSize, count: 'exact' },
    source: {
      mode: 'remote',
      query: (context): TableQueryDefinition<TableCursorPageResult<AuditRow>> => ({
        queryKey: ['audit', context.pagination.mode === 'cursor' ? context.pagination.cursor : null, context.search.value],
        queryFn: async () => {
          const cursor = context.pagination.mode === 'cursor' ? context.pagination.cursor : null
          options.onPage?.(cursor)
          if (options.delay) await new Promise((resolve) => setTimeout(resolve, options.delay))
          const start = cursor ? Number(cursor) : 0
          const page = rows.slice(start, start + pageSize)
          const next = start + pageSize < rows.length ? String(start + pageSize) : null
          return {
            rows: page,
            pageInfo: { mode: 'cursor' as const, pageSize, nextCursor: next, count: 'exact' as const, rowCount: rows.length },
          }
        },
      }),
    },
    filters: { search: { fields: ['action', 'actor'] } },
    table: {
      columns: (column) => [
        column.field('action', { label: 'Action', width: 160 }),
        column.field('actor', { label: 'Acteur' }),
        column.field('at', { label: 'Date' }),
      ],
    },
    grid: {
      mode: 'contained',
      gridSize: 1,
      renderItem: ({ row }) => h('article', { class: 'card', 'data-row': (row as AuditRow).id }, (row as AuditRow).action),
    },
  })
}
