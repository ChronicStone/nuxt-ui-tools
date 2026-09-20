<script setup lang="tsx">
import UButton from '@nuxt/ui/components/Button.vue'

import { isNullish } from '#ui-tools/shared/utils/predicate'
import { defineTableSchema, tableSource, useTable } from '#ui-tools/table'
import UiRowActions from '#ui-tools/table/components/actions/row-actions.vue'
import { filterClientRows, sortClientRows } from '#ui-tools/table/utils'

import { AUDIT_ACTIONS, makeAuditEvents } from '../data/audit'

const events = makeAuditEvents(4000)
const PAGE = 60

const OUTCOME = { failed: 'Échec', skipped: 'Ignoré', succeeded: 'Succès' } as const
const OUTCOME_COLOR = { failed: '#c0392b', skipped: '#b8b1a7', succeeded: '#ff9600' } as const
const OUTCOME_OPTIONS = [
  { color: OUTCOME_COLOR.failed, label: OUTCOME.failed, value: 'failed' },
  { color: OUTCOME_COLOR.skipped, label: OUTCOME.skipped, value: 'skipped' },
  { color: OUTCOME_COLOR.succeeded, label: OUTCOME.succeeded, value: 'succeeded' },
] as const
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
function opts(o: Record<string, string>) {
  return Object.entries(o).map(([value, label]) => ({ label, value }))
}
const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
function Dash() {
  return <span class="text-dimmed">—</span>
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
          options: OUTCOME_OPTIONS,
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
  source: tableSource({
    mode: 'remote',
    query: (request) => ({
      queryFn: async () => {
        await new Promise((resolve) => setTimeout(resolve, 450))
        const filtered = filterClientRows({
          filters: request.filters,
          rows: events,
          search: request.search,
        })
        const sorted = sortClientRows({ rows: filtered, sorting: request.sorting })
        const { pagination } = request
        const size = pagination.mode === 'cursor' ? pagination.pageSize || PAGE : PAGE
        const start =
          pagination.mode === 'cursor' && pagination.cursor ? Number(pagination.cursor) : 0
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
      },
      queryKey: ['audit', request],
    }),
  }),
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
          isNullish(row.duration) ? (
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

const table = useTable(schema)
</script>

<template>
  <AppDataList
    :table="table"
    title="Journal d’audit"
    description="Toutes les actions effectuées sur la plateforme, en temps réel."
  >
    <template #actions>
      <UButton color="neutral" variant="outline" icon="i-lucide-download" label="Exporter" />
    </template>
  </AppDataList>
</template>
