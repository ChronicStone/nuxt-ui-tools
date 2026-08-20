<script setup lang="tsx">
import UBadge from '@nuxt/ui/components/Badge.vue'

import { defineTableSchema, useTable } from '#ui-tools/table'

import { demoEmployeesClient } from '../../lib/demo-employees-api'

const { tableSize } = usePlaygroundShell()

const schema = defineTableSchema({
  tableKey: 'demo-employees-remote-infinite',
  rowKey: 'id',
  defaultLayout: 'table',
  pagination: {
    mode: 'cursor',
    pageSize: 18,
    count: 'exact',
  },
  source: {
    mode: 'remote',
    facets: true,
    query: (request) => ({
      queryKey: ['demo-employees-infinite', request],
      queryFn: async () => demoEmployeesClient.queryTable(request),
    }),
  },
  filters: {
    search: {
      fields: ['fullName', 'email', 'department.company.name', 'employeeSkills.skill.label'],
      placeholder: 'Search employees',
    },
    ui: (filter) => [
      filter.option('department.company.country', {
        label: 'Country',
        behavior: { defaultOperator: 'isAnyOf' },
        display: { location: 'panel md:tag' },
        source: { facet: 'exclude-self' },
        editor: {
          searchable: false,
          closeOnSelect: false,
          selection: { mode: 'multiple' },
          row: { showCounts: true },
        },
      }),
      filter.option('department.name', {
        label: 'Department',
        behavior: { defaultOperator: 'isAnyOf' },
        display: { location: 'panel md:tag' },
        source: { facet: 'exclude-self', sort: 'count' },
        editor: {
          searchable: false,
          closeOnSelect: false,
          selection: { mode: 'multiple' },
          row: { showCounts: true },
        },
      }),
      filter.boolean('isActive', {
        label: 'Active',
        display: { location: 'panel lg:tag' },
        source: { facet: 'exclude-self' },
      }),
      filter.text('fullName', {
        label: 'Name',
        behavior: { operators: ['contains', 'is'] },
        display: { location: 'panel' },
        editor: { placeholder: 'Employee name', leadingIcon: 'i-lucide-search' },
      }),
    ],
  },
  table: {
    defaultSorting: { key: 'hiredAt', dir: 'desc' },
    columns: (column) => [
      column.field('fullName', {
        label: 'Employee',
        icon: 'i-lucide-user-round',
        minWidth: 240,
        pinned: 'left',
        render: ({ row }) => (
          <div class="min-w-0">
            <div class="truncate font-medium text-highlighted">{row.fullName}</div>
            <div class="truncate text-xs text-muted">{row.email}</div>
          </div>
        ),
      }),
      column.field('department.name', {
        label: 'Department',
        minWidth: 170,
      }),
      column.field('department.company.name', {
        label: 'Company',
        minWidth: 190,
      }),
      column.field('department.company.country', {
        label: 'Country',
        minWidth: 150,
      }),
      column.field('isActive', {
        label: 'Status',
        minWidth: 120,
        render: ({ value }) => (
          <UBadge
            color={value ? 'success' : 'neutral'}
            variant={value ? 'soft' : 'subtle'}
            size="sm"
            label={value ? 'Active' : 'Paused'}
          />
        ),
      }),
      column.field('hiredAt', {
        label: 'Hired',
        minWidth: 150,
        render: ({ value }) => (
          <span class="text-muted">
            {value
              ? new Intl.DateTimeFormat('en', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }).format(new Date(String(value)))
              : '—'}
          </span>
        ),
      }),
    ],
  },
})

const table = useTable(schema)
</script>

<template>
  <PlaygroundContent mode="fixed" class="bg-default">
    <NutDataListRoot :table="table" :size="tableSize">
      <div class="flex h-full min-h-0 flex-col">
        <header class="shrink-0 border-b border-default px-4 py-3 lg:px-6">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-baseline gap-2">
                <h1 class="text-lg font-semibold tracking-tight text-highlighted">
                  Employee stream
                </h1>
                <NutDataListResultCount />
              </div>
              <p class="mt-0.5 text-sm text-muted">
                Real cursor pagination from Drizzle Resource. Existing rows stay visible while more
                load.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <NutDataListSearch width="18rem" />
              <NutDataListFilterPanel />
              <NutDataListColumnPanel />
            </div>
          </div>

          <div class="mt-3 flex min-h-8 flex-wrap items-center gap-2">
            <NutDataListFilterTags show-add show-clear />
          </div>
        </header>

        <NutDataListContent
          fit="fill"
          surface="plain"
          class="min-h-0 flex-1"
          :ui="{ root: 'rounded-none border-0' }"
        >
          <template #after>
            <NutDataListInfiniteLoader />
          </template>
        </NutDataListContent>
      </div>
    </NutDataListRoot>
  </PlaygroundContent>
</template>
