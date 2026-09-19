import { h } from 'vue'

import { defineTableSchema } from '#ui-tools/table/schema'
import type {
  TableCursorPageResult,
  TableQueryDefinition,
  TableSummariesSchema,
} from '#ui-tools/table/types'

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

export const STATUS_COLOR = { active: '#ff9600', inactive: '#c0392b', pending: '#b8b1a7' } as const
export const STATUS_LABEL = { active: 'Actif', inactive: 'Inactif', pending: 'En attente' } as const
const STATUSES: AccountStatus[] = ['active', 'pending', 'inactive']
const COUNTRIES = ['FR', 'DE', 'ES'] as const

export function createAccounts(count: number): AccountRow[] {
  return Array.from({ length: count }, (_, index) => ({
    consumption: (index + 1) * 10,
    contracts: (index % 7) + 1,
    country: COUNTRIES[index % 3]!,
    edofSync: index % 2 === 0,
    id: `acc-${index + 1}`,
    legalEntity: `Entité ${index + 1}`,
    name: `Compte ${String(index + 1).padStart(3, '0')}`,
    status: STATUSES[index % 3]!,
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
    defaultLayout: 'table',
    filters: {
      search: { fields: ['name', 'legalEntity'], placeholder: 'Rechercher un compte…' },
      ui: (filter) => [
        filter.option('status', {
          behavior: {
            defaultOperator: 'isAnyOf',
            ...(options.statusDefault ? { defaultValue: options.statusDefault } : {}),
            commitMode: 'auto',
          },
          display: { location: 'tag', order: 1 },
          editor: { searchable: false, selection: { mode: 'multiple' } },
          label: 'Statut',
          source: {
            options: STATUSES.map((value) => ({
              color: STATUS_COLOR[value],
              label: STATUS_LABEL[value],
              value,
            })),
          },
        }),
        filter.option('country', {
          behavior: {
            commitMode: 'auto',
            defaultOperator: 'isAnyOf',
            operators: ['isAnyOf', 'is', 'isNot'],
          },
          display: options.panelFilters
            ? { group: 'Identité', location: 'panel', order: 2 }
            : { location: 'tag-dynamic', order: 2 },
          editor: { selection: { mode: 'multiple' } },
          label: 'Pays',
          source: {
            facet: 'exclude-self',
            options: COUNTRIES.map((value) => ({ label: value, value })),
          },
        }),
        filter.boolean('edofSync', {
          display: { location: 'tag-dynamic', order: 3 },
          label: 'Synchronisation EDOF',
        }),
        ...(options.panelFilters
          ? [
              filter.text('legalEntity', {
                behavior: { operators: ['contains', 'is', 'isNot'] },
                display: { group: 'Identité', location: 'panel', order: 4 },
                editor: { placeholder: 'Entité…' },
                label: 'Entité légale',
              }),
              filter.number('contracts', {
                behavior: { operators: ['is', 'gte', 'lte', 'between'] },
                display: { group: 'Volumes', location: 'panel', order: 5 },
                label: 'Contrats',
              }),
            ]
          : []),
      ],
    },
    grid:
      options.grid === false
        ? undefined
        : {
            defaultSorting: { dir: 'asc', key: 'name' },
            gridSize: '1 md:2 xl:3',
            mode: 'contained',
            renderItem: ({ row }) =>
              h(
                'article',
                { class: 'card', 'data-row': (row as AccountRow).id },
                (row as AccountRow).name,
              ),
            sortOptions: [
              { key: 'name', label: 'Nom' },
              { key: 'status', label: 'Statut' },
            ],
          },
    pagination:
      options.pagination === false
        ? false
        : {
            defaultSize: { grid: 12, table: 20 },
            sizeOptions: { grid: [12, 24], table: [10, 20, 50] },
            ...(options.pagination ?? {}),
          },
    rowKey: 'id',
    selection: {
      mode: options.selection?.mode ?? 'auto',
      scope: options.selection?.scope ?? 'all',
    },
    source: {
      mode: 'client',
      query: (context): TableQueryDefinition<AccountRow[]> => ({
        queryFn: async () => {
          options.onQuery?.(context)
          if (options.delay) {
            await new Promise((resolve) => setTimeout(resolve, options.delay))
          }
          if (options.fail) {
            throw new Error('boom')
          }
          return rows
        },
        queryKey: ['accounts', rows.length, options.fail ? 'fail' : 'ok'],
      }),
    },
    table: {
      defaultSorting: { dir: 'asc', key: 'name' },
      enabled: options.tableEnabled ?? true,
      ...(options.summaries === false
        ? {}
        : {
            summaries: {
              scope: 'filtered',
              ...(options.summariesResolve ? { resolve: options.summariesResolve } : {}),
            },
          }),
      columns: (column) => [
        column.field('name', {
          label: 'Nom',
          minWidth: 200,
          pinned: 'left',
          render: ({ row }) => h('b', { class: 'name' }, (row as AccountRow).name),
          required: true,
          skeleton: 'avatar',
          sortable: true,
          width: 228,
        }),
        column.field('status', {
          label: 'Statut',
          render: ({ row }) => STATUS_LABEL[(row as AccountRow).status],
          skeleton: 'dot',
          sortable: true,
          width: 110,
        }),
        column.field('country', { label: 'Pays', lines: 2, sortable: true }),
        column.field('legalEntity', { ellipsis: true, label: 'Entité légale', visible: false }),
        column.field('edofSync', {
          label: 'EDOF',
          render: ({ row }) => ((row as AccountRow).edofSync ? '✓' : '—'),
          skeleton: 'check',
        }),
        column.field('contracts', {
          align: 'right',
          label: 'Contrats',
          render: ({ row }) => String((row as AccountRow).contracts),
          sortable: true,
          summary: 'sum',
        }),
        column.field('consumption', {
          align: 'right',
          label: 'Conso.',
          render: ({ row }) => String((row as AccountRow).consumption),
          sortable: true,
          summary: {
            format: (value) => `${String(value)} t`,
            resolve: async ({ rows: scoped }) => {
              await new Promise((resolve) => setTimeout(resolve, 5))
              return (scoped as AccountRow[]).reduce((total, row) => total + row.consumption, 0)
            },
          },
        }),
      ],
    },
    tableKey: 'accounts',
    ...(options.actions === false
      ? {}
      : {
          actions: [
            {
              action: () => bulkActionCalls.push('export'),
              icon: 'i-lucide-download',
              key: 'export',
              label: 'Exporter',
            },
            {
              action: () => bulkActionCalls.push('sync'),
              icon: 'i-lucide-refresh-cw',
              key: 'sync',
              label: 'Synchroniser',
            },
            {
              action: () => bulkActionCalls.push('archive'),
              icon: 'i-lucide-archive',
              key: 'archive',
              label: 'Archiver',
            },
            {
              action: () => bulkActionCalls.push('inactive'),
              icon: 'i-lucide-clock',
              key: 'inactive',
              label: 'Passer inactif',
            },
            {
              action: () => bulkActionCalls.push('delete'),
              icon: 'i-lucide-trash-2',
              key: 'delete',
              label: 'Supprimer',
            },
          ],
        }),
    ...(options.rowActions === false
      ? {}
      : {
          rowActions: ({ row }) => [
            { action: () => {}, icon: 'i-lucide-arrow-right', key: 'view', label: 'Voir la fiche' },
            ...((row as AccountRow).status === 'pending'
              ? [{ action: () => {}, icon: 'i-lucide-check', key: 'activate', label: 'Activer' }]
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

export function createAuditSchema(
  options: {
    total?: number
    pageSize?: number
    delay?: number
    onPage?: (cursor: string | null) => void
  } = {},
) {
  const total = options.total ?? 45
  const pageSize = options.pageSize ?? 20
  const rows: AuditRow[] = Array.from({ length: total }, (_, index) => ({
    action: index % 2 ? 'update' : 'create',
    actor: `user-${(index % 5) + 1}`,
    at: new Date(Date.UTC(2026, 1, 1, index)).toISOString(),
    id: `evt-${index + 1}`,
  }))
  return defineTableSchema({
    filters: { search: { fields: ['action', 'actor'] } },
    grid: {
      gridSize: 1,
      mode: 'contained',
      renderItem: ({ row }) =>
        h('article', { class: 'card', 'data-row': (row as AuditRow).id }, (row as AuditRow).action),
    },
    pagination: { count: 'exact', mode: 'cursor', pageSize },
    rowKey: 'id',
    source: {
      mode: 'remote',
      query: (context): TableQueryDefinition<TableCursorPageResult<AuditRow>> => ({
        queryFn: async () => {
          const cursor = context.pagination.mode === 'cursor' ? context.pagination.cursor : null
          options.onPage?.(cursor)
          if (options.delay) {
            await new Promise((resolve) => setTimeout(resolve, options.delay))
          }
          const start = cursor ? Number(cursor) : 0
          const page = rows.slice(start, start + pageSize)
          const next = start + pageSize < rows.length ? String(start + pageSize) : null
          return {
            pageInfo: {
              count: 'exact' as const,
              mode: 'cursor' as const,
              nextCursor: next,
              pageSize,
              rowCount: rows.length,
            },
            rows: page,
          }
        },
        queryKey: [
          'audit',
          context.pagination.mode === 'cursor' ? context.pagination.cursor : null,
          context.search.value,
        ],
      }),
    },
    table: {
      columns: (column) => [
        column.field('action', { label: 'Action', width: 160 }),
        column.field('actor', { label: 'Acteur' }),
        column.field('at', { label: 'Date' }),
      ],
    },
    tableKey: 'audit',
  })
}
