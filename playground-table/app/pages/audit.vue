<script setup lang="tsx">
import { defineTableSchema, useTable } from '#ui-tools/table'
import UiRowActions from '#ui-tools/table/components/actions/RowActions.vue'
import type { TableCursorPageResult, TableSourceRequestContext } from '#ui-tools/table/types'
import { filterClientRows, sortClientRows } from '#ui-tools/table/utils'

import { AUDIT_ACTIONS, makeAuditEvents } from '../data/audit'
import type { AuditEvent } from '../data/audit'

const events = makeAuditEvents(4000)
const PAGE = 60

const OUTCOME = { failed: 'Échec', skipped: 'Ignoré', succeeded: 'Succès' } as const
const OUTCOME_COLOR = { failed: '#c0392b', skipped: '#b8b1a7', succeeded: '#ff9600' } as const
const ACTOR_TYPE = { external: 'Externe', system: 'Système', user: 'Utilisateur' } as const
const TARGET_TYPE = {
  account: 'Compte',
  contact: 'Contact',
  contract: 'Contrat',
  export: 'Export',
  invoice: 'Facture',
  note: 'Mémo',
  user: 'Utilisateur',
} as const
const opts = (o: Record<string, string>) =>
  Object.entries(o).map(([value, label]) => ({ label, value }))
const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const Dash = () => <span class="text-dimmed">—</span>

async function queryAudit(
  request: TableSourceRequestContext<AuditEvent>,
): Promise<TableCursorPageResult<AuditEvent>> {
  await new Promise((r) => setTimeout(r, 450))
  const filtered = filterClientRows({
    filters: request.filters,
    rows: events,
    search: request.search,
  })
  const sorted = sortClientRows({ rows: filtered, sorting: request.sorting })
  const { pagination } = request
  const size = pagination.mode === 'cursor' ? pagination.pageSize || PAGE : PAGE
  const start = pagination.mode === 'cursor' && pagination.cursor ? Number(pagination.cursor) : 0
  const rows = sorted.slice(start, start + size)
  const next = start + size
  return {
    pageInfo: {
      count: 'exact',
      mode: 'cursor',
      nextCursor: next < sorted.length ? String(next) : null,
      pageSize: size,
      rowCount: sorted.length,
    },
    rows,
  }
}

const schema = defineTableSchema({
  defaultLayout: 'table',
  filters: {
    search: {
      fields: ['actor', 'target', 'details'],
      placeholder: 'Rechercher un acteur, une cible…',
    },
    ui: (filter) => [
      filter.option('action', {
        behavior: { commitMode: 'auto', defaultOperator: 'isAnyOf' },
        display: { location: 'tag' },
        editor: { selection: { mode: 'multiple' } },
        label: 'Action',
        source: { options: opts(AUDIT_ACTIONS) },
      }),
      filter.option('outcome', {
        behavior: { commitMode: 'auto', defaultOperator: 'isAnyOf' },
        display: { location: 'tag' },
        editor: { searchable: false, selection: { mode: 'multiple' } },
        label: 'Résultat',
        source: {
          options: opts(OUTCOME).map((o) => ({
            ...o,
            color: OUTCOME_COLOR[o.value as keyof typeof OUTCOME_COLOR],
          })),
        },
      }),
      filter.option('actorType', {
        behavior: { commitMode: 'auto', defaultOperator: 'isAnyOf' },
        display: { location: 'tag-dynamic' },
        editor: { searchable: false, selection: { mode: 'multiple' } },
        label: 'Type d’acteur',
        source: { options: opts(ACTOR_TYPE) },
      }),
      filter.option('targetType', {
        behavior: { commitMode: 'auto', defaultOperator: 'isAnyOf' },
        display: { location: 'tag-dynamic' },
        editor: { searchable: false, selection: { mode: 'multiple' } },
        label: 'Type de cible',
        source: { options: opts(TARGET_TYPE) },
      }),
      filter.date('at', { display: { location: 'tag-dynamic' }, label: 'Date' }),
    ],
  },
  grid: {
    defaultSorting: { dir: 'desc', key: 'at' },
    gridSize: '1',
    mode: 'contained',
    renderItem: ({ row }) => (
      <article class="ex-card ex-card--audit">
        <header class="ex-card__top">
          <span class={['ex-action__ic', `ex-action__ic--${row.action.split('.')[0]}`]} />
          <span class="min-w-0 flex-1">
            <b>{AUDIT_ACTIONS[row.action]}</b>
            <small>
              {dateFmt.format(new Date(row.at))}{' '}
              ·{' '}
              {timeFmt.format(new Date(row.at))}
            </small>
          </span>
          <span class="ex-st" style={{ '--dot': OUTCOME_COLOR[row.outcome] }}>
            {OUTCOME[row.outcome]}
          </span>
          <UiRowActions content={{ align: 'end', side: 'bottom', sideOffset: 6 }} size="sm">
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-lucide-ellipsis"
              square
              class="ex-card__more text-dimmed hover:text-default"
              aria-label="Actions"
            />
          </UiRowActions>
        </header>
        <dl class="ex-card__meta">
          <div>
            <dt>Acteur</dt>
            <dd>{row.actor}</dd>
          </div>
          <div>
            <dt>Cible</dt>
            <dd>{row.target}</dd>
          </div>
        </dl>
        <footer class="ex-card__ft">
          <span class="truncate">{row.details}</span>
        </footer>
      </article>
    ),
    sortOptions: [
      { key: 'at', label: 'Date' },
      { key: 'action', label: 'Action' },
      { key: 'actor', label: 'Acteur' },
    ],
  },
  pagination: { count: 'exact', mode: 'cursor', pageSize: PAGE },
  rowActions: () => [
    { icon: 'i-lucide-arrow-up-right', key: 'open', label: 'Voir la cible' },
    { icon: 'i-lucide-copy', key: 'copy', label: 'Copier l’identifiant' },
  ],
  rowKey: 'id',
  source: {
    mode: 'remote',
    query: (request: TableSourceRequestContext<AuditEvent>) => ({
      queryFn: () => queryAudit(request),
      queryKey: ['audit', request],
    }),
  },
  table: {
    columns: (column) => [
      column.field('at', {
        label: 'Date',
        render: ({ row }) => (
          <span class="ex-when">
            <b>{dateFmt.format(new Date(row.at))}</b>
            <small>{timeFmt.format(new Date(row.at))}</small>
          </span>
        ),
        required: true,
        sortable: true,
        width: 150,
      }),
      column.field('action', {
        label: 'Action',
        render: ({ row }) => (
          <span class="ex-action">
            <span class={['ex-action__ic', `ex-action__ic--${row.action.split('.')[0]}`]} />
            <span class="truncate">{AUDIT_ACTIONS[row.action]}</span>
          </span>
        ),
        sortable: true,
        width: 240,
      }),
      column.field('actor', {
        label: 'Acteur',
        render: ({ row }) => (
          <span class="ex-nm">
            <span class="ex-nm__av ex-nm__av--sm">
              {row.actorType === 'system'
                ? '⚙'
                : row.actor
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')}
            </span>
            <span class="min-w-0">
              <b>{row.actor}</b>
              <small>{ACTOR_TYPE[row.actorType]}</small>
            </span>
          </span>
        ),
        skeleton: 'avatar',
        sortable: true,
        width: 220,
      }),
      column.field('target', {
        label: 'Cible',
        render: ({ row }) => (
          <span class="min-w-0">
            <a href="#" class="ex-link" onClick={(e: Event) => e.preventDefault()}>
              {row.target}
            </a>
            <small class="block text-[11.5px] text-dimmed">{TARGET_TYPE[row.targetType]}</small>
          </span>
        ),
        width: 220,
      }),
      column.field('outcome', {
        label: 'Résultat',
        render: ({ row }) => (
          <span class="ex-st" style={{ '--dot': OUTCOME_COLOR[row.outcome] }}>
            {OUTCOME[row.outcome]}
          </span>
        ),
        skeleton: 'dot',
        sortable: true,
        width: 120,
      }),
      column.field('duration', {
        align: 'right',
        label: 'Durée',
        render: ({ row }) =>
          row.duration == null ? (
            <Dash />
          ) : (
            <span class="tabular-nums text-muted">{row.duration} ms</span>
          ),
        width: 100,
      }),
      column.field('ip', {
        label: 'IP',
        render: ({ row }) =>
          row.ip ? <span class="font-mono text-[12px] text-muted">{row.ip}</span> : <Dash />,
        width: 140,
      }),
      column.field('details', {
        label: 'Détails',
        render: ({ row }) => <span class="text-muted">{row.details}</span>,
        width: 360,
      }),
    ],
    defaultSorting: { dir: 'desc', key: 'at' },
    enabled: 'false md:true',
  },
  tableKey: 'audit',
})

const listUi = {
  addFilter: { props: { trigger: { label: 'Filtre' } } },
  columnPanel: {
    props: {
      count: { color: 'neutral', size: 'sm', variant: 'soft' },
      trigger: { color: 'neutral', icon: 'i-lucide-layers', variant: 'outline' },
    },
  },
  filterTags: {
    props: { icon: false },
    ui: {
      activeRoot: 'bg-[#f7f3ee] ring-[var(--ui-border)] dark:bg-[#302d2a]',
      activeTrigger: 'text-[12.5px] pl-[11px]',
      addTrigger: 'text-[12.5px] px-3 font-normal',
      trigger: 'text-[12.5px]',
      value: 'text-[12.5px]',
    },
  },
  grid: { gap: 12, ui: { viewport: 'p-5 max-md:px-4 max-md:pt-0.5 max-md:pb-4' } },
  layoutSwitch: {
    props: { activeTrigger: { variant: 'ghost' }, trigger: { color: 'neutral', variant: 'ghost' } },
    size: 'sm',
    ui: {
      root: 'h-[34px] items-center gap-0.5 rounded-md bg-[#f7f3ee] p-0.5 dark:bg-[#242220]',
      trigger:
        'h-7 w-7 rounded-[4px] text-muted hover:text-default hover:bg-transparent data-[active=true]:bg-[var(--ex-surface)] data-[active=true]:text-highlighted data-[active=true]:shadow-[0_0_0_1px_var(--ui-border)]',
    },
  },
  mobile: {
    control: { size: 'lg' },
    grid: { gap: 10 },
    search: { ui: { root: 'flex-1 min-w-0' }, width: '100%' },
  },
  search: { props: { input: { color: 'neutral', variant: 'outline' } }, width: '340px' },
  table: {
    gutter: 20,
    props: { rowActions: { color: 'neutral', size: 'sm', variant: 'ghost' } },
    ui: { td: 'font-light' },
  },
} as const

const table = useTable(schema)
</script>

<template>
  <NutDataListRoot :table="table" :ui="listUi">
    <div class="ex-list">
      <header class="ex-ph">
        <div>
          <h1>Journal d’audit</h1>
          <p>Toutes les actions effectuées sur la plateforme, en temps réel.</p>
        </div>
        <div class="ex-ph-acts">
          <UButton color="neutral" variant="outline" icon="i-lucide-download" label="Exporter" />
        </div>
      </header>
      <div class="ex-tb">
        <div class="ex-tb-l">
          <NutDataListSearch />
          <NutDataListFilterTags show-add show-clear />
        </div>
        <div class="ex-tb-r">
          <NutDataListSortMenu label="Tri" />
          <span class="max-md:hidden"><NutDataListResultCount /></span>
          <NutDataListColumnPanel />
          <NutDataListLayoutSwitch />
        </div>
      </div>
      <div class="relative flex min-h-0 flex-1 flex-col">
        <NutDataListContent fit="fill" surface="plain" class="min-h-0 flex-1" />
      </div>
    </div>
  </NutDataListRoot>
</template>
