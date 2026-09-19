<script setup lang="tsx">
import { defineTableSchema, useTable } from '#ui-tools/table'
import type { TableCursorPageResult, TableSourceRequestContext } from '#ui-tools/table/types'
import { filterClientRows, sortClientRows } from '#ui-tools/table/utils'

import UiRowActions from '#ui-tools/table/components/actions/RowActions.vue'

import { AUDIT_ACTIONS, makeAuditEvents, type AuditEvent } from '../data/audit'

const events = makeAuditEvents(4000)
const PAGE = 60

const OUTCOME = { succeeded: 'Succès', failed: 'Échec', skipped: 'Ignoré' } as const
const OUTCOME_COLOR = { succeeded: '#ff9600', failed: '#c0392b', skipped: '#b8b1a7' } as const
const ACTOR_TYPE = { user: 'Utilisateur', system: 'Système', external: 'Externe' } as const
const TARGET_TYPE = {
  account: 'Compte',
  user: 'Utilisateur',
  contact: 'Contact',
  contract: 'Contrat',
  invoice: 'Facture',
  note: 'Mémo',
  export: 'Export',
} as const
const opts = (o: Record<string, string>) => Object.entries(o).map(([value, label]) => ({ value, label }))
const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const Dash = () => <span class="text-dimmed">—</span>

async function queryAudit(request: TableSourceRequestContext<AuditEvent>): Promise<TableCursorPageResult<AuditEvent>> {
  await new Promise((r) => setTimeout(r, 450))
  const filtered = filterClientRows({ rows: events, filters: request.filters, search: request.search })
  const sorted = sortClientRows({ rows: filtered, sorting: request.sorting })
  const pagination = request.pagination
  const size = pagination.mode === 'cursor' ? pagination.pageSize || PAGE : PAGE
  const start = pagination.mode === 'cursor' && pagination.cursor ? Number(pagination.cursor) : 0
  const rows = sorted.slice(start, start + size)
  const next = start + size
  return {
    rows,
    pageInfo: {
      mode: 'cursor',
      pageSize: size,
      nextCursor: next < sorted.length ? String(next) : null,
      count: 'exact',
      rowCount: sorted.length,
    },
  }
}

const schema = defineTableSchema({
  tableKey: 'audit',
  rowKey: 'id',
  defaultLayout: 'table',
  pagination: { mode: 'cursor', pageSize: PAGE, count: 'exact' },
  source: {
    mode: 'remote',
    query: (request) => ({
      queryKey: ['audit', request],
      queryFn: () => queryAudit(request as TableSourceRequestContext<AuditEvent>),
    }),
  },
  filters: {
    search: { fields: ['actor', 'target', 'details'], placeholder: 'Rechercher un acteur, une cible…' },
    ui: (filter) => [
      filter.option('action', {
        label: 'Action',
        behavior: { defaultOperator: 'isAnyOf', commitMode: 'auto' },
        display: { location: 'tag' },
        source: { options: opts(AUDIT_ACTIONS) },
        editor: { selection: { mode: 'multiple' } },
      }),
      filter.option('outcome', {
        label: 'Résultat',
        behavior: { defaultOperator: 'isAnyOf', commitMode: 'auto' },
        display: { location: 'tag' },
        source: { options: opts(OUTCOME).map((o) => ({ ...o, color: OUTCOME_COLOR[o.value as keyof typeof OUTCOME_COLOR] })) },
        editor: { searchable: false, selection: { mode: 'multiple' } },
      }),
      filter.option('actorType', {
        label: 'Type d’acteur',
        behavior: { defaultOperator: 'isAnyOf', commitMode: 'auto' },
        display: { location: 'tag-dynamic' },
        source: { options: opts(ACTOR_TYPE) },
        editor: { searchable: false, selection: { mode: 'multiple' } },
      }),
      filter.option('targetType', {
        label: 'Type de cible',
        behavior: { defaultOperator: 'isAnyOf', commitMode: 'auto' },
        display: { location: 'tag-dynamic' },
        source: { options: opts(TARGET_TYPE) },
        editor: { searchable: false, selection: { mode: 'multiple' } },
      }),
      filter.date('at', { label: 'Date', display: { location: 'tag-dynamic' } }),
    ],
  },
  table: {
    enabled: 'false md:true',
    defaultSorting: { key: 'at', dir: 'desc' },
    columns: (column) => [
      column.field('at', {
        label: 'Date',
        sortable: true,
        width: 150,
        required: true,
        render: ({ row }) => (
          <span class="ex-when">
            <b>{dateFmt.format(new Date(row.at))}</b>
            <small>{timeFmt.format(new Date(row.at))}</small>
          </span>
        ),
      }),
      column.field('action', {
        label: 'Action',
        sortable: true,
        width: 240,
        render: ({ row }) => (
          <span class="ex-action">
            <span class={['ex-action__ic', `ex-action__ic--${row.action.split('.')[0]}`]} />
            <span class="truncate">{AUDIT_ACTIONS[row.action]}</span>
          </span>
        ),
      }),
      column.field('actor', {
        label: 'Acteur',
        sortable: true,
        width: 220,
        skeleton: 'avatar',
        render: ({ row }) => (
          <span class="ex-nm">
            <span class="ex-nm__av ex-nm__av--sm">
              {row.actorType === 'system' ? '⚙' : row.actor.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </span>
            <span class="min-w-0">
              <b>{row.actor}</b>
              <small>{ACTOR_TYPE[row.actorType]}</small>
            </span>
          </span>
        ),
      }),
      column.field('target', {
        label: 'Cible',
        width: 220,
        render: ({ row }) => (
          <span class="min-w-0">
            <a href="#" class="ex-link" onClick={(e: Event) => e.preventDefault()}>{row.target}</a>
            <small class="block text-[11.5px] text-dimmed">{TARGET_TYPE[row.targetType]}</small>
          </span>
        ),
      }),
      column.field('outcome', {
        label: 'Résultat',
        sortable: true,
        width: 120,
        skeleton: 'dot',
        render: ({ row }) => (
          <span class="ex-st" style={{ '--dot': OUTCOME_COLOR[row.outcome] }}>{OUTCOME[row.outcome]}</span>
        ),
      }),
      column.field('duration', {
        label: 'Durée',
        align: 'right',
        width: 100,
        render: ({ row }) => (row.duration == null ? <Dash /> : <span class="tabular-nums text-muted">{row.duration} ms</span>),
      }),
      column.field('ip', { label: 'IP', width: 140, render: ({ row }) => (row.ip ? <span class="font-mono text-[12px] text-muted">{row.ip}</span> : <Dash />) }),
      column.field('details', { label: 'Détails', width: 360, render: ({ row }) => <span class="text-muted">{row.details}</span> }),
    ],
  },
  grid: {
    mode: 'contained',
    gridSize: '1',
    defaultSorting: { key: 'at', dir: 'desc' },
    sortOptions: [
      { key: 'at', label: 'Date' },
      { key: 'action', label: 'Action' },
      { key: 'actor', label: 'Acteur' },
    ],
    renderItem: ({ row }) => (
      <article class="ex-card ex-card--audit">
        <header class="ex-card__top">
          <span class={['ex-action__ic', `ex-action__ic--${row.action.split('.')[0]}`]} />
          <span class="min-w-0 flex-1">
            <b>{AUDIT_ACTIONS[row.action]}</b>
            <small>{dateFmt.format(new Date(row.at))} · {timeFmt.format(new Date(row.at))}</small>
          </span>
          <span class="ex-st" style={{ '--dot': OUTCOME_COLOR[row.outcome] }}>{OUTCOME[row.outcome]}</span>
          <UiRowActions content={{ align: 'end', side: 'bottom', sideOffset: 6 }} size="sm">
            <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-ellipsis" square class="ex-card__more text-dimmed hover:text-default" aria-label="Actions" />
          </UiRowActions>
        </header>
        <dl class="ex-card__meta">
          <div><dt>Acteur</dt><dd>{row.actor}</dd></div>
          <div><dt>Cible</dt><dd>{row.target}</dd></div>
        </dl>
        <footer class="ex-card__ft"><span class="truncate">{row.details}</span></footer>
      </article>
    ),
  },
  rowActions: () => [
    { key: 'open', label: 'Voir la cible', icon: 'i-lucide-arrow-up-right' },
    { key: 'copy', label: 'Copier l’identifiant', icon: 'i-lucide-copy' },
  ],
})

const listUi = {
  search: { width: '340px', props: { input: { color: 'neutral', variant: 'outline' } } },
  filterTags: { props: { icon: false } , ui: { activeRoot: 'bg-[#f7f3ee] ring-[var(--ui-border)] dark:bg-[#302d2a]', activeTrigger: 'text-[12.5px] pl-[11px]', value: 'text-[12.5px]', trigger: 'text-[12.5px]', addTrigger: 'text-[12.5px] px-3 font-normal' } },
  addFilter: { props: { trigger: { label: 'Filtre' } } },
  columnPanel: { props: { trigger: { color: 'neutral', variant: 'outline', icon: 'i-lucide-layers' }, count: { color: 'neutral', variant: 'soft', size: 'sm' } } },
  layoutSwitch: {
    size: 'sm',
    props: { trigger: { color: 'neutral', variant: 'ghost' }, activeTrigger: { variant: 'ghost' } },
    ui: { root: 'h-[34px] items-center gap-0.5 rounded-md bg-[#f7f3ee] p-0.5 dark:bg-[#242220]', trigger: 'h-7 w-7 rounded-[4px] text-muted hover:text-default hover:bg-transparent data-[active=true]:bg-[var(--ex-surface)] data-[active=true]:text-highlighted data-[active=true]:shadow-[0_0_0_1px_var(--ui-border)]' },
  },
  table: { gutter: 20, ui: { td: 'font-light' }, props: { rowActions: { color: 'neutral', variant: 'ghost', size: 'sm' } } },
  grid: { gap: 12, ui: { viewport: 'p-5 max-md:px-4 max-md:pt-0.5 max-md:pb-4' } },
  mobile: { control: { size: 'lg' }, search: { width: '100%', ui: { root: 'flex-1 min-w-0' } }, grid: { gap: 10 } },
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

