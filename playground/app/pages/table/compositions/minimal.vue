<script setup lang="tsx">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UCard from '@nuxt/ui/components/Card.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import { defineTableSchema, useTable } from '#ui-tools/table'

type DirectoryTeam = 'Design' | 'Engineering' | 'Finance' | 'Operations' | 'Platform'
type DirectoryPresence = 'Paris' | 'Montreal' | 'Tokyo' | 'Remote'
interface DirectoryRow {
  id: string
  name: string
  role: string
  team: DirectoryTeam
  presence: DirectoryPresence
  timezone: string
  active: boolean
}

const contacts: DirectoryRow[] = [
  {
    active: true,
    id: 'contact-01',
    name: 'Amélie Martin',
    presence: 'Paris',
    role: 'Product designer',
    team: 'Design',
    timezone: 'Europe/Paris',
  },
  {
    active: true,
    id: 'contact-02',
    name: 'Jon Bell',
    presence: 'Montreal',
    role: 'Staff engineer',
    team: 'Engineering',
    timezone: 'America/Toronto',
  },
  {
    active: false,
    id: 'contact-03',
    name: 'Mina Okafor',
    presence: 'Remote',
    role: 'Operations lead',
    team: 'Operations',
    timezone: 'Africa/Lagos',
  },
  {
    active: true,
    id: 'contact-04',
    name: 'Taro Sato',
    presence: 'Tokyo',
    role: 'Platform engineer',
    team: 'Platform',
    timezone: 'Asia/Tokyo',
  },
  {
    active: true,
    id: 'contact-05',
    name: 'Léa Bernard',
    presence: 'Paris',
    role: 'Finance manager',
    team: 'Finance',
    timezone: 'Europe/Paris',
  },
  {
    active: true,
    id: 'contact-06',
    name: 'Samira Khan',
    presence: 'Remote',
    role: 'Design systems engineer',
    team: 'Engineering',
    timezone: 'Europe/London',
  },
  {
    active: true,
    id: 'contact-07',
    name: 'Noah Tremblay',
    presence: 'Montreal',
    role: 'Customer operations',
    team: 'Operations',
    timezone: 'America/Toronto',
  },
  {
    active: false,
    id: 'contact-08',
    name: 'Aya Mori',
    presence: 'Tokyo',
    role: 'Product designer',
    team: 'Design',
    timezone: 'Asia/Tokyo',
  },
]

const teamOptions = ['Design', 'Engineering', 'Finance', 'Operations', 'Platform'].map((value) => ({
  label: value,
  value,
}))
const presenceOptions = ['Paris', 'Montreal', 'Tokyo', 'Remote'].map((value) => ({
  label: value,
  value,
}))

const schema = defineTableSchema({
  defaultLayout: 'grid',
  filters: {
    search: { fields: ['name', 'role', 'team', 'presence'], placeholder: 'Find a teammate' },
    ui: (filter) => [
      filter.option('team', {
        behavior: { defaultOperator: 'isAnyOf' },
        display: { location: 'tag-dynamic' },
        editor: {
          row: { showCounts: true },
          searchable: false,
          selection: { mode: 'multiple' },
        },
        label: 'Team',
        source: { facet: 'exclude-self', options: teamOptions },
      }),
      filter.option('presence', {
        behavior: { defaultOperator: 'isAnyOf' },
        display: { location: 'panel md:tag' },
        editor: { searchable: false, selection: { mode: 'multiple' } },
        label: 'Presence',
        source: { facet: 'exclude-self', options: presenceOptions },
      }),
      filter.boolean('active', {
        display: { location: 'panel lg:tag' },
        label: 'Available now',
      }),
    ],
  },
  grid: {
    enabled: true,
    gridSize: '1 md:2 xl:3',
    mode: 'flow',
    renderItem: ({ row }) => (
      <UCard
        class="h-full rounded-md shadow-none"
        ui={{
          body: 'grid h-full gap-5 p-5',
          root: 'h-full ring-default',
        }}
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex min-w-0 items-center gap-3">
            <div class="grid size-11 shrink-0 place-items-center rounded-full bg-elevated text-sm font-semibold text-highlighted">
              {row.name
                .split(' ')
                .map((part) => part[0])
                .join('')}
            </div>
            <div class="min-w-0">
              <div class="truncate font-semibold text-highlighted">{row.name}</div>
              <div class="truncate text-sm text-muted">{row.role}</div>
            </div>
          </div>
          <span
            class={[
              'mt-1 size-2.5 shrink-0 rounded-full',
              row.active ? 'bg-success' : 'bg-accented',
            ]}
            title={row.active ? 'Available' : 'Away'}
          />
        </div>

        <div class="grid gap-2 border-t border-default pt-4 text-sm">
          <div class="flex items-center justify-between gap-3">
            <span class="flex items-center gap-2 text-muted">
              <UIcon name="i-lucide-users" class="size-4" />{' '}
              Team
            </span>
            <UBadge color="neutral" variant="subtle" size="sm" label={row.team} />
          </div>
          <div class="flex items-center justify-between gap-3">
            <span class="flex items-center gap-2 text-muted">
              <UIcon name="i-lucide-map-pin" class="size-4" />{' '}
              Presence
            </span>
            <span class="font-medium text-highlighted">{row.presence}</span>
          </div>
          <div class="flex items-center justify-between gap-3">
            <span class="flex items-center gap-2 text-muted">
              <UIcon name="i-lucide-clock-3" class="size-4" />{' '}
              Timezone
            </span>
            <span class="text-highlighted">{row.timezone}</span>
          </div>
        </div>
      </UCard>
    ),
  },
  pagination: false,
  rowKey: 'id',
  source: {
    mode: 'client',
    query: () => ({
      queryFn: async () => contacts,
      queryKey: ['table-composition-directory'],
    }),
  },
  table: {
    columns: (column) => [
      column.field('name', { label: 'Name' }),
      column.field('role', { label: 'Role' }),
      column.field('team', { label: 'Team' }),
      column.field('presence', { label: 'Presence' }),
      column.field('timezone', { label: 'Timezone' }),
    ],
  },
  tableKey: 'people-directory-grid',
})

const table = useTable(schema)
const { tableSize } = usePlaygroundShell()
</script>

<template>
  <PlaygroundContent mode="fixed" class="flex flex-col overflow-hidden bg-default">
    <NutDataListRoot :table="table" :size="tableSize">
      <header class="border-b border-default px-5 py-5 lg:px-8">
        <div class="flex flex-wrap items-end justify-between gap-5">
          <div class="grid gap-1.5">
            <p class="text-sm font-medium text-muted">Team directory</p>
            <div class="flex items-baseline gap-3">
              <h1 class="text-2xl font-semibold tracking-tight text-highlighted">People</h1>
              <NutDataListResultCount />
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <NutDataListSearch />
            <NutDataListFilterTags show-add show-clear />
            <NutDataListFilterPanel />
            <NutDataListLayoutSwitch />
          </div>
        </div>
      </header>

      <NutDataListContent
        fit="fill"
        surface="plain"
        class="min-h-0 flex-1 overflow-auto px-5 py-5 lg:px-8"
        :ui="{ root: 'bg-elevated/20' }"
      />
    </NutDataListRoot>
  </PlaygroundContent>
</template>
