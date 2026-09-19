<script setup lang="tsx">
import { defineTableSchema, useTable } from '#ui-tools/table'
import UiRowActions from '#ui-tools/table/components/actions/RowActions.vue'

import { ACCOUNT_STATUS, ACCOUNT_TYPE, COUNTRY, GROUPS, MANAGER_LOCATIONS } from '../data/enums'

const route = useRoute()
const {
  accounts: baseAccounts,
  contacts,
  contactName,
} = useAccountsData(Number(route.query.n) || 154)
const accounts = route.query.stress ? withStress(baseAccounts, contacts) : baseAccounts

function withStress(rows: typeof baseAccounts, people: typeof contacts) {
  const out = rows.map((row) => ({ ...row }))
  const long =
    'Groupement Interprofessionnel des Établissements de Formation Continue et de Certification Linguistique du Grand Ouest'
  Object.assign(out[0]!, {
    consumption: 9876543,
    contracts: 12345,
    erpId: 'ERP-2026-0000000000123456',
    generalContacts: people.slice(0, 6).map((c) => c.id),
    group: 'Réseau Européen des Centres Partenaires Accrédités · Zone Nord-Ouest',
    legalEntity: `${long} — Société par Actions Simplifiée à Associé Unique`,
    metadata:
      'Documentation initiale complète, incluant les pièces justificatives et annexes contractuelles',
    name: long,
    testCenter: 'Centre de test principal — Campus de Nantes, bâtiment C, salle 204',
    vtestId: 'VT-9999999999999999',
  })
  Object.assign(out[1]!, {
    billingContactId: null,
    businessManagerId: null,
    consumption: 0,
    contracts: 0,
    erpId: null,
    generalContacts: [],
    group: null,
    legalEntity: '',
    legalRepresentativeId: null,
    managerLocation: null,
    metadata: null,
    name: 'A',
    testCenter: null,
    vtestId: null,
  })
  Object.assign(out[2]!, {
    country: 'DE',
    legalEntity: 'Ünïcødé & Co. GmbH',
    name: 'Établissement Œcuménique « Zürich » — Straße 12 ½',
  })
  return out
}

const opts = (o: Record<string, string>) =>
  Object.entries(o).map(([value, label]) => ({ label, value }))
const contactOpts = (role: string) =>
  contacts
    .filter((c) => c.roles.includes(role as never))
    .map((c) => ({ label: c.label, value: c.id }))
const fmtNum = (v: number) => new Intl.NumberFormat('fr-FR').format(v).replaceAll(' ', '\u00A0')
const fmtDate = (v: string) =>
  new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
const Bool = ({ v }: { v: boolean }) =>
  v ? <span class="text-highlighted">✓</span> : <span class="text-dimmed">—</span>
const Dash = () => <span class="text-dimmed">—</span>
const STATUS_COLOR = { active: '#ff9600', inactive: '#c0392b', pending: '#b8b1a7' } as const

const schema = defineTableSchema({
  actions: [
    { key: 'export', label: 'Exporter', icon: 'i-lucide-download', action: () => {} },
    { key: 'sync', label: 'Synchroniser', icon: 'i-lucide-refresh-cw', action: () => {} },
    {
      key: 'candidates',
      label: 'Exporter les candidats',
      icon: 'i-lucide-award',
      action: () => {},
    },
    { key: 'inactive', label: 'Passer inactif', icon: 'i-lucide-clock', action: () => {} },
    { key: 'delete', label: 'Supprimer', icon: 'i-lucide-trash-2', action: () => {} },
  ],
  defaultLayout: 'table',
  filters: {
    search: {
      fields: ['name', 'legalEntity', 'erpId', 'vtestId'],
      placeholder: 'Rechercher un compte…',
    },
    ui: (filter) => [
      filter.option('status', {
        label: 'Statut',
        behavior: {
          defaultOperator: 'isAnyOf',
          defaultValue: ['active', 'pending'],
          commitMode: 'auto',
        },
        display: { location: 'tag' },
        source: {
          options: opts(ACCOUNT_STATUS).map((o) => ({
            ...o,
            color: STATUS_COLOR[o.value as keyof typeof STATUS_COLOR],
          })),
          facet: 'exclude-self',
        },
        editor: { searchable: false, selection: { mode: 'multiple' }, row: { showCounts: true } },
      }),
      filter.option('accountType', {
        label: 'Type de compte',
        behavior: { defaultOperator: 'isAnyOf', commitMode: 'auto' },
        display: { location: 'tag-dynamic' },
        source: { options: opts(ACCOUNT_TYPE), facet: 'exclude-self' },
        editor: { selection: { mode: 'multiple' }, row: { showCounts: true } },
      }),
      filter.option('group', {
        label: 'Groupe',
        behavior: { defaultOperator: 'isAnyOf', commitMode: 'auto' },
        display: { location: 'tag-dynamic' },
        source: { options: GROUPS.map((g) => ({ value: g, label: g })) },
        editor: { selection: { mode: 'multiple' } },
      }),
      filter.option('country', {
        label: 'Pays',
        behavior: { defaultOperator: 'isAnyOf', commitMode: 'auto' },
        display: { location: 'tag-dynamic' },
        source: { options: opts(COUNTRY), facet: 'exclude-self' },
        editor: { searchable: true, selection: { mode: 'multiple' }, row: { showCounts: true } },
      }),
      filter.option('businessManagerId', {
        label: 'Business Manager',
        behavior: { defaultOperator: 'isAnyOf', commitMode: 'auto' },
        display: { location: 'panel', group: 'Contacts', order: 1 },
        source: { options: contactOpts('businessManager') },
        editor: { searchable: true, selection: { mode: 'multiple' } },
      }),
      filter.option('legalRepresentativeId', {
        label: 'Représentant légal',
        behavior: { defaultOperator: 'isAnyOf', commitMode: 'auto' },
        display: { location: 'panel', group: 'Contacts', order: 2 },
        source: { options: contactOpts('legalRepresentative') },
        editor: { searchable: true, selection: { mode: 'multiple' } },
      }),
      filter.option('billingContactId', {
        label: 'Contact de facturation',
        behavior: { defaultOperator: 'isAnyOf', commitMode: 'auto' },
        display: { location: 'panel', group: 'Contacts', order: 3 },
        source: { options: contactOpts('billing') },
        editor: { searchable: true, selection: { mode: 'multiple' } },
      }),
      filter.boolean('canPerformOnSite', {
        label: 'Centre de test sur site',
        display: { location: 'panel', group: 'Synchronisation', order: 4 },
        source: { facet: 'exclude-self' },
      }),
      filter.boolean('edofSync', {
        label: 'Synchronisation EDOF',
        display: { location: 'panel', group: 'Synchronisation', order: 5 },
        source: { facet: 'exclude-self' },
      }),
    ],
  },
  grid: {
    defaultSorting: { dir: 'asc', key: 'name' },
    gridSize: '1 md:2 xl:3',
    mode: 'contained',
    renderItem: ({ row }) => (
      <article class="ex-card">
        <header class="ex-card__top">
          <span class="ex-nm__av">
            {row.name
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </span>
          <span class="min-w-0 flex-1">
            <b>{row.name}</b>
            <small>{ACCOUNT_TYPE[row.accountType]}</small>
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
            <dt>Statut</dt>
            <dd>
              <span class={['ex-st', `ex-st--${row.status}`]}>{ACCOUNT_STATUS[row.status]}</span>
            </dd>
          </div>
          <div>
            <dt>Pays</dt>
            <dd>{COUNTRY[row.country]}</dd>
          </div>
          <div>
            <dt>Groupe</dt>
            <dd>{row.group ?? <Dash />}</dd>
          </div>
          <div>
            <dt>Business Manager</dt>
            <dd>{row.businessManagerId ? contactName(row.businessManagerId) : <Dash />}</dd>
          </div>
        </dl>
        <footer class="ex-card__ft">
          <span>
            {row.contracts}{' '}
            contrat
            {row.contracts > 1 ? 's' : ''}
          </span>
          <span class="ex-card__sep">·</span>
          <span>{row.consumption} tests / 30 j</span>
          <span class="flex-1" />
          {row.vtest ? (
            <span class="ex-pill">VTest</span>
          ) : row.evoliz ? (
            <span class="ex-pill">Evoliz</span>
          ) : null}
        </footer>
      </article>
    ),
    sortOptions: [
      { key: 'name', label: 'Nom' },
      { key: 'status', label: 'Statut' },
      { key: 'country', label: 'Pays' },
      { key: 'updatedAt', label: 'Mise à jour' },
    ],
  },
  pagination: {
    defaultSize: { grid: 24, table: 50 },
    showPageSizePicker: true,
    showPagesCount: true,
    showPagesList: true,
    sizeOptions: { grid: [12, 24, 48, 96], table: [25, 50, 100, 200] },
  },
  rowActions: ({ row }) => [
    { key: 'view', label: 'Voir la fiche', icon: 'i-lucide-arrow-right', action: () => {} },
    { key: 'edit', label: 'Modifier', icon: 'i-lucide-pencil', action: () => {} },
    ...(row.status === 'pending'
      ? [
          {
            key: 'activate',
            label: 'Finaliser l’activation',
            icon: 'i-lucide-check',
            action: () => {},
          },
        ]
      : []),
    { key: 'sync', label: 'Synchroniser', icon: 'i-lucide-refresh-cw', action: () => {} },
  ],
  rowKey: 'id',
  selection: { mode: 'auto', scope: 'all' },
  source: {
    mode: 'client',
    query: () => ({
      queryKey: ['accounts', accounts.length],
      queryFn: async () => {
        await new Promise((r) => setTimeout(r, 600))
        return accounts
      },
    }),
  },
  table: {
    columns: (column) => [
      column.field('name', {
        label: 'Nom',
        sortable: true,
        width: 228,
        minWidth: 200,
        required: true,
        pinned: 'left',
        skeleton: 'avatar',
        render: ({ row }) => (
          <a href={`/accounts/${row.id}`} class="ex-nm" onClick={(e: Event) => e.preventDefault()}>
            <span class="ex-nm__av">
              {row.name
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </span>
            <span class="min-w-0">
              <b>{row.name}</b>
              <small>{row.legalEntity}</small>
            </span>
          </a>
        ),
      }),
      column.field('status', {
        label: 'Status',
        sortable: true,
        width: 110,
        skeleton: 'dot',
        render: ({ row }) => (
          <span class={['ex-st', `ex-st--${row.status}`]}>{ACCOUNT_STATUS[row.status]}</span>
        ),
      }),
      column.field('accountType', {
        label: 'Type de compte',
        sortable: true,
        width: 190,
        render: ({ row }) => <span class="text-muted">{ACCOUNT_TYPE[row.accountType]}</span>,
      }),
      column.field('country', {
        label: 'Pays',
        sortable: true,
        render: ({ row }) => (
          <span>
            <b class="mr-1.5 font-semibold text-highlighted">{row.country}</b>
            {COUNTRY[row.country]}
          </span>
        ),
      }),
      column.field('group', { label: 'Groupe', render: ({ row }) => row.group ?? <Dash /> }),
      column.field('evoliz', {
        skeleton: 'check',
        label: 'Evoliz Sync',
        render: ({ row }) => <Bool v={row.evoliz} />,
      }),
      column.field('vtest', {
        skeleton: 'check',
        label: 'VTest Sync',
        render: ({ row }) => <Bool v={row.vtest} />,
      }),
      column.field('edofSync', {
        skeleton: 'check',
        label: 'EDOF Sync',
        render: ({ row }) => <Bool v={row.edofSync} />,
      }),
      column.display('businessManager', {
        label: 'Business Manager',
        render: ({ row }) => contactName(row.businessManagerId) ?? <Dash />,
      }),
      column.field('updatedAt', {
        label: 'Mise à jour',
        sortable: true,
        render: ({ row }) => <span class="text-muted">{fmtDate(row.updatedAt)}</span>,
      }),
      column.field('invitationSent', {
        skeleton: 'check',
        label: 'Invitation envoyée',
        render: ({ row }) => <Bool v={row.invitationSent} />,
      }),
      column.field('debit', {
        skeleton: 'check',
        label: 'Prélèvement',
        render: ({ row }) => <Bool v={row.debit} />,
      }),
      column.field('metadata', {
        label: 'Documentation initiale',
        render: ({ row }) => (row.metadata ? <span class="ex-pill">Reçue</span> : <Dash />),
      }),
      column.field('testCenter', {
        label: 'Centre de test',
        render: ({ row }) => row.testCenter ?? <Dash />,
      }),
      column.field('canPerformOnSite', {
        skeleton: 'check',
        label: 'Centre de test sur site',
        render: ({ row }) => <Bool v={row.canPerformOnSite} />,
      }),
      column.field('erpId', {
        label: 'ERP ID',
        render: ({ row }) =>
          row.erpId ? <span class="font-mono text-[12px]">{row.erpId}</span> : <Dash />,
      }),
      column.field('vtestId', {
        label: 'VTEST ID',
        render: ({ row }) =>
          row.vtestId ? <span class="font-mono text-[12px]">{row.vtestId}</span> : <Dash />,
      }),
      column.field('managerLocation', {
        label: 'VTEST Manager Location',
        render: ({ row }) => row.managerLocation ?? <Dash />,
      }),
      column.display('legalRepresentative', {
        label: 'Représentant légal',
        render: ({ row }) => contactName(row.legalRepresentativeId) ?? <Dash />,
      }),
      column.display('billingContact', {
        label: 'Contact de facturation',
        render: ({ row }) => contactName(row.billingContactId) ?? <Dash />,
      }),
      column.display('generalContacts', {
        label: 'Autres contacts',
        render: ({ row }) =>
          row.generalContacts.length ? (
            <span class="flex flex-wrap gap-1">
              {row.generalContacts.slice(0, 2).map((id) => (
                <span class="ex-pill" key={id}>
                  {contactName(id)}
                </span>
              ))}
              {row.generalContacts.length > 2 ? (
                <span class="ex-pill">+{row.generalContacts.length - 2}</span>
              ) : null}
            </span>
          ) : (
            <Dash />
          ),
      }),
      column.field('preferredCurrency', {
        label: 'Devise préférée',
        render: ({ row }) => <span class="font-mono text-[12px]">{row.preferredCurrency}</span>,
      }),
      column.field('contracts', {
        summary: 'sum',
        ellipsis: true,
        label: 'Contrats',
        sortable: true,
        align: 'right',
        render: ({ row }) => fmtNum(row.contracts),
      }),
      column.field('consumption', {
        summary: {
          resolve: async ({ rows }) => {
            await new Promise((r) => setTimeout(r, 900))
            return rows.reduce((total, row) => total + row.consumption, 0)
          },
        },
        label: 'Conso. 30 j',
        sortable: true,
        align: 'right',
        ellipsis: true,
        render: ({ row }) => fmtNum(row.consumption),
      }),
    ],
    defaultSorting: { dir: 'asc', key: 'name' },
    enabled: 'false md:true',
    summaries: { scope: 'filtered' },
  },
  tableKey: 'accounts',
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
    props: { clearTrigger: { color: 'neutral', variant: 'ghost' }, icon: false },
    ui: {
      activeRoot: 'bg-[#f7f3ee] ring-[var(--ui-border)] dark:bg-[#302d2a]',
      activeTrigger: 'text-[12.5px] pl-[11px]',
      addTrigger: 'text-[12.5px] px-3 font-normal',
      trigger: 'text-[12.5px]',
      value: 'text-[12.5px]',
    },
  },
  grid: { gap: 12, ui: { viewport: 'p-5 max-md:p-4' } },
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
    grid: { gap: 10, ui: { viewport: 'px-4 pt-0.5 pb-4' } },
    pagination: { size: 'md', ui: { button: 'h-8 w-8 rounded-lg', root: 'px-4 py-2.5' } },
    search: { ui: { root: 'flex-1 min-w-0' }, width: '100%' },
  },
  pagination: {
    props: {
      firstLast: false,
      pageSize: { color: 'neutral', size: 'sm', variant: 'outline' },
      pagination: {
        activeColor: 'neutral',
        activeVariant: 'solid',
        color: 'neutral',
        variant: 'ghost',
      },
    },
    size: 'sm',
    ui: {
      button: 'h-7 min-w-7 text-[12.5px] font-medium',
      pageSize: 'text-[12.5px] ring-[var(--ui-border)]',
      root: 'px-5 py-2.5 text-[12.5px]',
    },
  },
  search: { props: { input: { color: 'neutral', variant: 'outline' } }, width: '340px' },
  table: {
    gutter: 20,
    props: {
      checkbox: { color: 'primary' },
      rowActions: { color: 'neutral', size: 'sm', variant: 'ghost' },
    },
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
          <h1>Comptes</h1>
          <p>Organismes clients, partenaires et centres de test.</p>
        </div>
        <div class="ex-ph-acts">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-award"
            label="Exporter les candidats"
          />
          <UButton color="primary" icon="i-lucide-plus" label="Créer un compte" />
        </div>
      </header>
      <div class="ex-tb">
        <div class="ex-tb-l">
          <NutDataListSearch />
          <NutDataListFilterTags show-add show-clear />
        </div>
        <div class="ex-tb-r">
          <NutDataListFilterPanel />
          <NutDataListSortMenu label="Tri" />
          <NutDataListColumnPanel />
          <NutDataListLayoutSwitch />
        </div>
      </div>
      <div class="relative flex min-h-0 flex-1 flex-col">
        <NutDataListContent fit="fill" surface="plain" class="min-h-0 flex-1" />
        <NutDataListSelectionActions />
      </div>
      <NutDataListPagination />
    </div>
  </NutDataListRoot>
</template>
