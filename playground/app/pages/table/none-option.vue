<script setup lang="tsx">
import { defineTableSchema, tableSource, useTable } from '#ui-tools/table'

const { t } = useI18n()
const { tableSize } = usePlaygroundShell()

interface AccountRow {
  id: string
  name: string
  tagIds: string[]
  manager: string | null
  certificationId: string | null
}

const tags = [
  { label: 'Commission', value: 'tag-commission' },
  { label: 'VIP', value: 'tag-vip' },
  { label: 'Network', value: 'tag-network' },
  { label: 'Fair 2026', value: 'tag-fair' },
]

const managers = ['Ada Martin', 'Yaser Salem', 'Jeanne Roy']

/** Certifications under their family: the tree presentation of the filter. */
const certifications = [
  {
    children: [
      { label: 'TOEIC Listening & Reading', value: 'toeic-lr' },
      { label: 'TOEIC Speaking & Writing', value: 'toeic-sw' },
    ],
    label: 'TOEIC',
    value: 'family-toeic',
  },
  {
    children: [
      { label: 'Linguaskill General', value: 'ls-general' },
      { label: 'Linguaskill Business', value: 'ls-business' },
    ],
    label: 'Linguaskill',
    value: 'family-linguaskill',
  },
]
const certificationIds = ['toeic-lr', 'toeic-sw', 'ls-general', 'ls-business']
const names = [
  'Northwind',
  'Brainforge',
  'Atelier Lumen',
  'Martine Postel – Everyone speaks English',
]

const accounts: AccountRow[] = Array.from({ length: 48 }, (_, index) => ({
  certificationId: index % 6 === 0 ? null : certificationIds[index % 4]!,
  id: `account-${index}`,
  manager: index % 4 === 0 ? null : managers[index % 3]!,
  name: `${names[index % 4]} ${index + 1}`,
  tagIds:
    index % 5 === 0
      ? ['tag-commission']
      : index % 7 === 0
        ? ['tag-vip', 'tag-network']
        : index % 3 === 0
          ? ['tag-fair']
          : [],
}))

function labelOf(list: { label: string; value: string }[], value: string) {
  return list.find((item) => item.value === value)?.label ?? value
}

const schema = defineTableSchema({
  filters: {
    search: { fields: ['name'], placeholder: () => t('playground.tableNoneOption.search') },
    ui: (filter) => [
      // A list of options: « No tag » leads the list, in its own section.
      filter.option('tagIds', {
        behavior: { defaultOperator: 'isAnyOf' },
        display: { icon: 'i-lucide-tag', location: 'tag-dynamic' },
        editor: { searchable: true, selection: { mode: 'multiple' } },
        label: () => t('playground.tableNoneOption.tags'),
        source: {
          none: { label: () => t('playground.tableNoneOption.noTag') },
          options: tags.map((tag) => ({ ...tag, icon: 'i-lucide-tag' })),
        },
      }),
      // Facet counts: the facet's `missing` counts the « none » entry.
      filter.option('manager', {
        behavior: { defaultOperator: 'isAnyOf' },
        display: { icon: 'i-lucide-user-round', location: 'tag-dynamic' },
        editor: { row: { showCounts: true }, searchable: true, selection: { mode: 'multiple' } },
        label: () => t('playground.tableNoneOption.manager'),
        source: {
          facet: 'exclude-self',
          none: { label: () => t('playground.tableNoneOption.noManager') },
        },
      }),
      // Tree presentation: the « none » entry is the first root leaf.
      filter.option('certificationId', {
        behavior: { defaultOperator: 'isAnyOf' },
        display: { icon: 'i-lucide-award', location: 'tag-dynamic' },
        editor: {
          presentation: 'tree',
          row: { showCounts: true },
          searchable: true,
          selection: { mode: 'multiple' },
          tree: { expandedByDefault: true, selectable: 'leaf-only' },
        },
        label: () => t('playground.tableNoneOption.certification'),
        source: {
          facet: 'exclude-self',
          none: { label: () => t('playground.tableNoneOption.noCertification') },
          options: certifications,
        },
      }),
    ],
  },
  pagination: false,
  rowKey: 'id',
  rowLabel: (row) => row.name,
  source: tableSource({
    mode: 'client',
    query: () => ({ queryFn: () => accounts, queryKey: ['playground-none-option-accounts'] }),
  }),
  table: {
    columns: (column) => [
      column.field('name', { label: () => t('playground.tableNoneOption.name') }),
      column.field('tagIds', {
        label: () => t('playground.tableNoneOption.tags'),
        render: ({ row }) => row.tagIds.map((id) => labelOf(tags, id)).join(', ') || '—',
      }),
      column.field('manager', {
        label: () => t('playground.tableNoneOption.manager'),
        render: ({ row }) => row.manager ?? '—',
      }),
      column.field('certificationId', {
        label: () => t('playground.tableNoneOption.certification'),
        render: ({ row }) =>
          row.certificationId
            ? labelOf(
                certifications.flatMap((family) => family.children),
                row.certificationId,
              )
            : '—',
      }),
    ],
  },
  tableKey: 'playground-none-option-accounts',
})

const table = useTable(schema)
</script>

<template>
  <PlaygroundContent mode="fixed" class="flex flex-col overflow-hidden bg-default">
    <NutDataListRoot :table="table" :size="tableSize">
      <header class="shrink-0 border-b border-default px-4 py-3 lg:px-8 lg:py-4">
        <div class="flex items-baseline gap-2">
          <h1 class="truncate text-lg font-semibold tracking-tight text-highlighted lg:text-2xl">
            {{ t('playground.tableNoneOption.title') }}
          </h1>
          <NutDataListResultCount />
        </div>
        <p class="mt-1 max-w-2xl text-sm leading-5 text-muted">
          {{ t('playground.tableNoneOption.description') }}
        </p>
        <div class="mt-3 flex min-w-0 flex-wrap items-center gap-2">
          <NutDataListSearch />
          <NutDataListFilterTags show-add show-clear />
        </div>
      </header>
      <NutDataListContent fit="fill" surface="plain" class="min-h-0 flex-1" />
    </NutDataListRoot>
  </PlaygroundContent>
</template>
