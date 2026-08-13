<script setup lang="tsx">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import { defineTableSchema, useTable } from '#ui-tools/table'
import { executeClientQuery } from '#ui-tools/table/utils'

type TemplateStatus = 'Published' | 'Draft' | 'Archived'
type TemplateFormat = 'A4' | 'Letter'
type TemplateRow = {
  id: string
  name: string
  version: string
  status: TemplateStatus
  format: TemplateFormat
  fields: number
  usage: string
  updatedAt: string
  accent: boolean
}

const templates: TemplateRow[] = Array.from({ length: 42 }, (_, index) => {
  const names = [
    'Invoice · FR',
    'Invoice · BE',
    'Invoice · rework',
    'Delivery note',
    'Care summary',
    'Monthly report',
    'Invoice · 2025',
    'Account statement',
    'Quarterly report',
    'Diagnostic summary',
  ]
  const statuses: TemplateStatus[] = ['Published', 'Published', 'Draft', 'Published', 'Archived']

  return {
    id: `template-${index + 1}`,
    name: names[index % names.length] ?? `Template ${index + 1}`,
    version: statuses[index % statuses.length] === 'Draft' ? 'draft' : `v${(index % 11) + 1}`,
    status: statuses[index % statuses.length] ?? 'Published',
    format: index % 4 === 0 ? 'Letter' : 'A4',
    fields: 8 + ((index * 7) % 25),
    usage: index % 5 === 2 ? 'Never generated' : `${48 + ((index * 97) % 820)} this month`,
    updatedAt: new Date(2026, 7, 13 - (index % 10)).toISOString(),
    accent: index % 3 !== 2,
  }
})

const schema = defineTableSchema({
  tableKey: 'templates',
  rowKey: 'id',
  defaultLayout: 'grid',
  pagination: { mode: 'cursor', pageSize: 12, count: 'exact' },
  source: {
    mode: 'remote',
    query: (request) => ({
      queryKey: ['data-list-composition', request],
      queryFn: async () => {
        const prepared = executeClientQuery({
          rows: templates,
          request: { ...request, pagination: { mode: 'none' } },
        })
        const pagination = request.pagination
        const cursor = pagination.mode === 'cursor' ? Number(pagination.cursor ?? 0) : 0
        const pageSize = pagination.mode === 'cursor' ? pagination.pageSize : prepared.rows.length
        const rows = prepared.rows.slice(cursor, cursor + pageSize)
        const nextOffset = cursor + rows.length

        await new Promise((resolve) => setTimeout(resolve, 180))

        return {
          rows,
          pageInfo: {
            mode: 'cursor' as const,
            pageSize,
            nextCursor: nextOffset < prepared.rowCount ? String(nextOffset) : null,
            count: 'exact' as const,
            rowCount: prepared.rowCount,
          },
        }
      },
    }),
  },
  filters: {
    search: { fields: ['name'], placeholder: 'Search templates' },
    ui: (filter) => [
      filter.option('status', {
        label: 'Status',
        behavior: { defaultOperator: 'isAnyOf', defaultValue: ['Published'] },
        display: { location: 'tag-dynamic' },
        source: {
          options: [
            { label: 'Published', value: 'Published' },
            { label: 'Draft', value: 'Draft' },
            { label: 'Archived', value: 'Archived' },
          ],
        },
        editor: { selection: { mode: 'multiple' }, closeOnSelect: false },
      }),
      filter.option('format', {
        label: 'Format',
        behavior: { defaultOperator: 'isAnyOf', defaultValue: ['A4', 'Letter'] },
        display: { location: 'tag-dynamic' },
        source: {
          options: [
            { label: 'A4', value: 'A4' },
            { label: 'Letter', value: 'Letter' },
          ],
        },
        editor: { selection: { mode: 'multiple' }, closeOnSelect: false },
      }),
    ],
  },
  table: {
    columns: (column) => [
      column.field('name', { label: 'Template' }),
      column.field('status', { label: 'Status' }),
      column.field('version', { label: 'Version' }),
      column.field('format', { label: 'Format' }),
      column.field('fields', { label: 'Fields' }),
      column.field('usage', { label: '30d' }),
      column.field('updatedAt', { label: 'Updated' }),
    ],
    defaultSorting: { key: 'updatedAt', dir: 'desc' },
  },
  grid: {
    enabled: true,
    mode: 'flow',
    gridSize: '1 sm:2 lg:3 2xl:5',
    itemSize: 1,
    defaultSorting: { key: 'updatedAt', dir: 'desc' },
    sortOptions: [
      { key: 'updatedAt', label: 'Updated' },
      { key: 'name', label: 'Name' },
      { key: 'usage', label: 'Usage' },
    ],
    renderItem: ({ row }) => (
      <article class="group grid h-full overflow-hidden rounded-md border border-default bg-default transition-shadow hover:shadow-md">
        <div class="relative flex min-h-52 items-center justify-center border-b border-default bg-elevated/70 p-4">
          <div class="relative h-44 w-32 border border-default bg-white p-3 shadow-sm transition-transform group-hover:-translate-y-0.5">
            <div class={['mb-2 h-2 w-16', row.accent ? 'bg-primary/70' : 'bg-neutral-300']} />
            <div class="mb-1 h-1 w-20 bg-neutral-200" />
            <div class="mb-1 h-1 w-12 bg-neutral-200" />
            <div class="mt-3 grid grid-cols-3 gap-1">
              <div class="h-1 bg-neutral-200" />
              <div class="h-1 bg-neutral-200" />
              <div class="h-1 bg-neutral-200" />
            </div>
            <div class="absolute inset-x-3 bottom-3 h-1 bg-neutral-200" />
          </div>
          <UBadge color={row.status === 'Draft' ? 'neutral' : 'primary'} variant="subtle" size="sm" class="absolute right-3 top-3 rounded-full">
            {row.version}
          </UBadge>
        </div>
        <div class="grid gap-2 p-3">
          <div class="flex min-w-0 items-center justify-between gap-2">
            <h3 class="truncate font-semibold text-highlighted">{row.name}</h3>
            <UButton color="neutral" variant="ghost" size="xs" icon="i-lucide-ellipsis" />
          </div>
          <div class="flex min-w-0 items-center gap-2 text-sm text-muted">
            <UBadge color={row.status === 'Published' ? 'primary' : 'neutral'} variant="subtle" size="sm">
              {row.status}
            </UBadge>
            <span>{row.format}</span>
            <span>{row.fields} fields</span>
          </div>
          <div class="text-sm text-muted">{row.usage}</div>
        </div>
      </article>
    ),
  },
})

const table = useTable(schema)

onMounted(() => {
  table.filters.replace([
    { key: 'status', operator: 'isAnyOf', value: ['Published'] },
    { key: 'format', operator: 'isAnyOf', value: ['A4', 'Letter'] },
  ])
})
</script>

<template>
  <section class="-m-4 flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-default sm:-m-6">
    <NutDataListRoot
      :table="table"
      density="compact"
      :ui="{
        search: { width: '20rem' },
        filterTags: { size: 'sm' },
        content: { ui: { root: 'px-5 py-4' } },
        resultCount: { ui: { root: 'text-sm text-muted tabular-nums' } },
      }"
    >
      <div
        class="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-default px-5 py-3"
      >
        <div class="flex items-baseline gap-3">
          <h1 class="text-xl font-semibold tracking-tight text-highlighted">Templates</h1>
          <NutDataListResultCount />
        </div>

        <div class="flex flex-wrap items-center justify-end gap-2">
          <NutDataListSearch :ui="{ base: 'playground-local-data-list-search-theme' }" />
          <NutDataListLayoutSwitch>
            <template #default="{ layout, setLayout }">
              <UFieldGroup size="sm">
                <UButton
                  color="neutral"
                  :variant="layout === 'grid' ? 'subtle' : 'outline'"
                  label="Grid"
                  icon="i-lucide-layout-grid"
                  aria-label="Grid view"
                  @click="setLayout('grid')"
                />
                <UButton
                  color="neutral"
                  :variant="layout === 'table' ? 'subtle' : 'outline'"
                  label="Table"
                  icon="i-lucide-table-properties"
                  aria-label="Table view"
                  @click="setLayout('table')"
                />
              </UFieldGroup>
            </template>
          </NutDataListLayoutSwitch>
          <NutDataListSortMenu>
            <template #trigger="{ label, triggerProps }">
              <UButton
                v-bind="triggerProps"
                color="neutral"
                variant="outline"
                :label="`Sort: ${label ?? 'Updated'}`"
                trailing-icon="i-lucide-chevron-down"
              />
            </template>
          </NutDataListSortMenu>
          <UButton color="primary" icon="i-lucide-plus" label="New template" />
        </div>
      </div>

      <div
        class="flex min-h-14 flex-wrap items-center gap-2 border-b border-default bg-elevated/25 px-5 py-2"
      >
        <NutDataListFilterTags />
        <NutDataListAddFilter />
        <div class="ml-auto flex items-center gap-4">
          <NutDataListResultCount>
            <template #default="{ loadedCount, totalCount }">
              <span class="text-sm text-muted"
                >{{ loadedCount }} of {{ totalCount ?? 'many' }}</span
              >
            </template>
          </NutDataListResultCount>
          <NutDataListClearFilters label="Clear" />
        </div>
      </div>

      <NutDataListContent fit="fill" class="flex-1">
        <template #loading>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            <div
              v-for="index in 10"
              :key="index"
              class="h-80 animate-pulse rounded-md border border-default bg-elevated/50"
            />
          </div>
        </template>
        <template #error="{ retry }">
          <div class="grid min-h-64 place-items-center text-center">
            <div class="grid gap-3">
              <UIcon name="i-lucide-cloud-alert" class="mx-auto size-7 text-danger" />
              <p class="text-sm text-muted">Templates could not be loaded.</p>
              <UButton color="neutral" variant="outline" label="Retry" @click="retry" />
            </div>
          </div>
        </template>
        <template #empty>
          <div class="grid min-h-64 place-items-center text-center">
            <div class="grid gap-2">
              <UIcon name="i-lucide-layout-template" class="mx-auto size-7 text-muted" />
              <h2 class="font-medium text-highlighted">No matching templates</h2>
              <p class="text-sm text-muted">Clear the filters or create a new template.</p>
            </div>
          </div>
        </template>
        <template #after>
          <NutDataListInfiniteLoader>
            <template #loading>
              <span class="text-sm text-muted">Loading more templates…</span>
            </template>
            <template #end="{ loadedCount }">
              <span class="text-sm text-muted">All {{ loadedCount }} templates loaded</span>
            </template>
          </NutDataListInfiniteLoader>
        </template>
      </NutDataListContent>
    </NutDataListRoot>
  </section>
</template>
