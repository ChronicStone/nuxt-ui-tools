<script setup lang="ts">
import { queryOptions } from '@tanstack/vue-query'
import { ref } from 'vue'

import { defineDashboardSchema, useDashboard } from '#ui-tools/dashboard'
import { defineFormSchema, useForm } from '#ui-tools/form'
import { defineRemoteOptions } from '#ui-tools/shared'
import { defineTableSchema, remoteTableOptions, tableSource, useTable } from '#ui-tools/table'
import DataList from '#ui-tools/table/components/data-list.vue'

const workspace = ref<'alpha' | 'beta'>('alpha')
const language = ref<'en' | 'fr'>('en')
const requests = ref<string[]>([])
const { tableSize } = usePlaygroundShell()

const users = Array.from({ length: 48 }, (_, index) => ({
  id: `u${index + 1}`,
  name: `User ${String(index + 1).padStart(2, '0')}`,
}))

function label(name: string, scope: string, locale: string) {
  return `${name} · ${scope.toUpperCase()} · ${locale.toUpperCase()}`
}

const userOptions = defineRemoteOptions(
  {
    load: ({ page, search }) => {
      const scope = workspace.value
      return queryOptions({
        queryFn: async () => {
          requests.value.push(`page:${scope}:${search}:${page.index}`)
          await new Promise((resolve) => setTimeout(resolve, 60))
          const matching = users.filter((user) =>
            user.name.toLowerCase().includes(search.toLowerCase()),
          )
          const start = (page.index - 1) * page.size
          return {
            hasMore: start + page.size < matching.length,
            rows: matching.slice(start, start + page.size).map((user) => ({
              ...user,
              name: label(user.name, scope, 'en'),
            })),
          }
        },
        queryKey: ['playground-users', 'page', scope, search, page.index, page.size],
      })
    },
    resolveSelected: ({ values }) => {
      const scope = workspace.value
      const locale = language.value
      return queryOptions({
        queryFn: async () => {
          requests.value.push(`selected:${scope}:${locale}:${values.join(',')}`)
          await new Promise((resolve) => setTimeout(resolve, 60))
          return {
            rows: users
              .filter((user) => values.includes(user.id))
              .map((user) => ({ ...user, name: label(user.name, scope, locale) })),
          }
        },
        queryKey: ['playground-users', 'selected', scope, locale, values],
      })
    },
  },
  {
    key: 'users',
    mapPage: ({ hasMore, rows }) => ({
      hasMore,
      options: rows.map((user) => ({ label: user.name, value: user.id })),
    }),
    mapSelected: ({ rows }) => rows.map((user) => ({ label: user.name, value: user.id })),
    pagination: { size: 8, type: 'page' },
    search: { debounce: 0 },
  },
)

const tableUserOptions = remoteTableOptions(
  (request) => {
    const scope = workspace.value
    return queryOptions({
      queryFn: () => {
        requests.value.push(`table-page:${scope}:${request.search.value}`)
        const ids = request.filters.flatMap((group) =>
          group.children.flatMap((condition) =>
            condition.type === 'condition' && Array.isArray(condition.value)
              ? condition.value.map(String)
              : [],
          ),
        )
        const matching = users.filter(
          (user) =>
            (!ids.length || ids.includes(user.id)) &&
            user.name.toLowerCase().includes(request.search.value.toLowerCase()),
        )
        const cursor = request.pagination?.mode === 'cursor' ? request.pagination.cursor : null
        const start = Number(cursor ?? 0)
        const size = request.pagination?.pageSize ?? 8
        return Promise.resolve({
          pageInfo: {
            count: 'none' as const,
            mode: 'cursor' as const,
            nextCursor: start + size < matching.length ? String(start + size) : null,
            pageSize: size,
            rowCount: null,
          },
          rows: matching.slice(start, start + size).map((user) => ({
            ...user,
            name: label(user.name, scope, 'en'),
          })),
        })
      },
      queryKey: ['playground-table-users', scope, request],
    })
  },
  {
    option: (user) => ({ label: user.name, value: user.id }),
    pagination: { size: 8, type: 'cursor' },
    search: { debounce: 0, fields: ['name'] },
  },
)

const dashboard = useDashboard(
  defineDashboardSchema({
    filters: (f) => ({
      owner: f.remote(userOptions, { defaultValue: 'u37', label: 'Dashboard owner' }),
      reviewer: f.remote(tableUserOptions, { label: 'Table-protocol reviewer' }),
    }),
    key: 'shared-remote-options',
  }),
)

const table = useTable(
  defineTableSchema({
    defaultLayout: 'table',
    filters: {
      ui: (filter) => [
        filter.option('ownerId', {
          behavior: { defaultOperator: 'isAnyOf' },
          display: { location: 'tag' },
          editor: { searchable: true, selection: { mode: 'multiple' } },
          label: 'Table owner',
          source: { remote: userOptions },
        }),
      ],
    },
    rowKey: 'id',
    source: tableSource({
      mode: 'client',
      query: () => ({
        queryFn: () =>
          Promise.resolve([
            { id: 'r1', name: 'First record', ownerId: 'u1' },
            { id: 'r2', name: 'Second record', ownerId: 'u37' },
          ]),
        queryKey: ['remote-options-demo-records'],
      }),
    }),
    tableKey: 'playground.remote-options.records',
    table: {
      columns: (column) => [
        column.field('name', { label: 'Record' }),
        column.field('ownerId', { label: 'Owner ID' }),
      ],
    },
  }),
)

const form = useForm({
  input: { owner: 'u37' },
  schema: defineFormSchema({
    actions: [],
    fields: [
      {
        key: 'owner',
        label: 'Form owner',
        options: { loader: userOptions, mode: 'remote' },
        type: 'select',
      },
    ],
    formKey: 'playground.remote-options',
  }),
})
</script>

<template>
  <PlaygroundContent mode="document">
    <main class="mx-auto grid w-full max-w-5xl gap-7 px-4 py-8 sm:px-6">
      <header class="grid gap-3 border-b border-default pb-5">
        <h1 class="text-2xl font-semibold text-highlighted">Shared remote options</h1>
        <p class="text-sm text-muted">
          One users loader serves a dashboard filter, a table filter, and a form field.
        </p>
        <div class="flex flex-wrap gap-3">
          <label class="grid gap-1 text-sm">
            Workspace
            <select
              v-model="workspace"
              class="rounded-md border border-default bg-default px-3 py-2"
            >
              <option value="alpha">Alpha</option>
              <option value="beta">Beta</option>
            </select>
          </label>
          <label class="grid gap-1 text-sm">
            Selected label language
            <select
              v-model="language"
              class="rounded-md border border-default bg-default px-3 py-2"
            >
              <option value="en">English</option>
              <option value="fr">French</option>
            </select>
          </label>
        </div>
      </header>

      <section class="grid gap-3" aria-label="Dashboard remote options">
        <h2 class="text-lg font-medium text-highlighted">Dashboard</h2>
        <NutDashboardFilters :dashboard="dashboard" />
        <p data-dashboard-value class="text-sm text-muted">
          {{ dashboard.controls.owner.display }}
        </p>
      </section>

      <section class="grid gap-3" aria-label="Table remote options">
        <h2 class="text-lg font-medium text-highlighted">Table</h2>
        <DataList :table="table" :size="tableSize" height="24rem" title="Records" />
      </section>

      <section class="grid gap-3" aria-label="Form remote options">
        <h2 class="text-lg font-medium text-highlighted">Form</h2>
        <NutForm :form="form" />
      </section>

      <section class="grid gap-2" aria-label="Remote requests">
        <h2 class="text-lg font-medium text-highlighted">Requests</h2>
        <ol class="max-h-32 overflow-auto rounded-md border border-default p-3 font-mono text-xs">
          <li v-for="(request, index) in requests" :key="index">{{ request }}</li>
        </ol>
      </section>
    </main>
  </PlaygroundContent>
</template>
