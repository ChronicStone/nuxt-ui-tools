<script setup lang="tsx">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import { COUNTRIES } from '../data/countries'
import {
  demoEmployeesClient,
  type DemoEmployeesFacetsRequest,
  type DemoEmployeeRow,
  type DemoEmployeesTableRequest,
} from '../lib/demo-employees-api'
import DataList from '../../../../packages/table/src/components/DataList.vue'
import { defineTableSchema, useTable } from '../../../../packages/table/src'

const { classes } = usePlaygroundAppearance()

const remoteSchema = defineTableSchema({
  tableKey: 'demo-employees-remote',
  rowKey: 'id',
  defaultLayout: 'table',
  pagination: {
    defaultSize: {
      table: 20,
      grid: 12,
    },
    sizeOptions: {
      table: [10, 20, 50, 100, 500, 1000],
      grid: [12, 24, 48],
    },
    showPageSizePicker: true,
    showPagesList: true,
    showPagesCount: true,
  },
  source: {
    mode: 'remote',
    query: (request) => ({
      queryKey: ['demo-employees', request],
      queryFn: async () => demoEmployeesClient.queryTable<DemoEmployeeRow>({
        request: request as unknown as DemoEmployeesTableRequest,
      }),
    }),
    facets: ({ table, facets }) => ({
      queryKey: ['demo-employee-facets', table, facets],
      queryFn: async () => demoEmployeesClient.queryFacets({
        request: {
          request: {
            pagination: table.pagination,
            sorting: table.sorting as DemoEmployeesFacetsRequest['request']['sorting'],
            filters: table.filters as DemoEmployeesFacetsRequest['request']['filters'],
            search: table.search,
            context: table.context,
          },
          facets: facets.map((facet) => ({
            key: facet.key,
            mode: facet.mode,
            search: facet.search,
            limit: facet.limit,
            cursor: facet.cursor ?? undefined,
          })),
        },
      }),
    }),
  },
  filters: {
    search: {
      fields: ['fullName', 'email', 'department.company.name', 'employeeSkills.skill.label'],
      placeholder: 'Search remote employees...',
    },
    ui: (filter) => [
      filter.text('fullName', {
        label: 'Name',
        operators: ['contains', 'is'],
      }),
      filter.option('department.company.country', {
        label: 'Country',
        defaultOperator: 'isAnyOf',
        facet: 'exclude-self',
        options: COUNTRIES.map((value) => ({
          label: value,
          value,
        })),
      }),
      filter.option('department.companyId', {
        label: 'Company',
        defaultOperator: 'isAnyOf',
        facet: true,
        query: ({ search, limit, cursor }) => ({
          queryKey: ['demo-filter-options', 'companies', search, limit, cursor],
          queryFn: async () => demoEmployeesClient.filterOptions.companies({
            request: {
              search,
              limit,
              cursor: cursor ?? undefined,
            },
          }),
        }),
      }),
      filter.option('employeeSkills.skillId', {
        label: 'Skill',
        defaultOperator: 'isAnyOf',
        facet: true,
        query: ({ search, limit, cursor }) => ({
          queryKey: ['demo-filter-options', 'skills', search, limit, cursor],
          queryFn: async () => demoEmployeesClient.filterOptions.skills({
            request: {
              search,
              limit,
              cursor: cursor ?? undefined,
            },
          }),
        }),
      }),
      filter.option('departmentId', {
        label: 'Department',
        defaultOperator: 'isAnyOf',
        facet: true,
        sort: 'count',
        query: ({ search, limit, cursor }) => ({
          queryKey: ['demo-filter-options', 'departments', search, limit, cursor],
          queryFn: async () => demoEmployeesClient.filterOptions.departments({
            request: {
              search,
              limit,
              cursor: cursor ?? undefined,
            },
          }),
        }),
      }),
      filter.boolean('isActive', {
        label: 'Active',
        facet: 'exclude-self',
      }),
      filter.number('salary', {
        label: 'Salary',
        operators: ['is', 'gte', 'lte', 'between'],
      }),
      filter.date('hiredAt', {
        label: 'Hired At',
        operators: ['is', 'before', 'after', 'between'],
      }),
    ],
  },
  table: {
    defaultSorting: {
      key: 'hiredAt',
      dir: 'desc',
    },
    columns: (column) => [
      column.field('fullName', {
        label: 'Employee',
        icon: 'i-lucide-user-round',
        minWidth: 260,
        pinned: 'left',
        render: ({ row }) => {
          const employee = row as DemoEmployeeRow

          return (
            <div class="flex min-w-0 items-center gap-3">
              <div class="flex size-9 shrink-0 items-center justify-center rounded-full border border-default bg-elevated text-[11px] font-semibold text-highlighted">
                {getInitials(employee.fullName)}
              </div>
              <div class="min-w-0">
                <div class="truncate font-medium text-highlighted">{employee.fullName}</div>
                <div class="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted">
                  <UIcon name="i-lucide-sparkles" class="size-3 shrink-0" />
                  <span class="truncate">{employee.employeeSkills[0]?.skill.label ?? 'Generalist'}</span>
                </div>
              </div>
            </div>
          )
        },
      }),
      column.field('email', {
        label: 'Email',
        icon: 'i-lucide-at-sign',
        minWidth: 280,
        render: ({ row }) => {
          const employee = row as DemoEmployeeRow

          return (
            <div class="min-w-0">
              <div class="truncate text-highlighted">{employee.email}</div>
              <div class="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <UIcon name="i-lucide-building-2" class="size-3.5 shrink-0" />
                <span class="truncate">{employee.department?.company?.name ?? 'No company'}</span>
              </div>
            </div>
          )
        },
      }),
      column.composite('skills', {
        label: 'Skills',
        icon: 'i-lucide-tags',
        sortableKey: 'fullName',
        minWidth: 240,
        render: ({ row }) => {
          const employee = row as DemoEmployeeRow
          const skills = employee.employeeSkills.map(entry => entry.skill.label).slice(0, 3)

          return (
            <div class="flex flex-wrap gap-1.5">
              {skills.map(skill => (
                <UBadge key={skill} color="neutral" variant="subtle" size="sm" label={skill} />
              ))}
            </div>
          )
        },
      }),
      column.field('department.company.country', {
        label: 'Country',
        icon: 'i-lucide-globe',
        minWidth: 170,
        render: ({ value }) => (
          <div class="flex items-center gap-2">
            <span class="text-base leading-none">{getCountryFlag(String(value ?? ''))}</span>
            <span class="truncate text-highlighted">{String(value ?? 'Unknown')}</span>
          </div>
        ),
      }),
      column.field('department.name', {
        label: 'Department',
        icon: 'i-lucide-building-2',
        minWidth: 180,
      }),
      column.field('isActive', {
        label: 'Active',
        icon: 'i-lucide-badge-check',
        minWidth: 120,
        render: ({ value }) => (
          <UBadge
            color={value ? 'success' : 'neutral'}
            variant={value ? 'soft' : 'subtle'}
            size="sm"
            label={value ? 'Online' : 'Paused'}
          />
        ),
      }),
      column.field('salary', {
        label: 'Salary',
        icon: 'i-lucide-wallet',
        align: 'right',
        labelAlign: 'right',
        minWidth: 160,
        render: ({ value }) => (
          <span class="font-medium text-highlighted">{formatCurrency(Number(value ?? 0))}</span>
        ),
      }),
      column.field('hiredAt', {
        label: 'Hired At',
        icon: 'i-lucide-calendar-days',
        minWidth: 170,
        render: ({ value }) => (
          <span class="text-highlighted">{formatDate(String(value ?? ''))}</span>
        ),
      }),
    ],
  },
  grid: {
    enabled: true,
    defaultSorting: {
      key: 'fullName',
      dir: 'asc',
    },
  },
})

const table = useTable(remoteSchema)

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function getCountryFlag(country: string) {
  const flags: Record<string, string> = {
    France: '🇫🇷',
    Germany: '🇩🇪',
    Japan: '🇯🇵',
    'United Kingdom': '🇬🇧',
    'United States': '🇺🇸',
  }

  return flags[country] ?? '🌍'
}
</script>

<template>
  <section :class="classes.pageStack">
    <div :class="classes.panel">
      <div :class="classes.panelMeta">
        <UBadge color="primary" variant="soft" label="DataList V2" />
        <UBadge color="neutral" variant="subtle" label="Remote Playground" />
      </div>

      <div :class="classes.panelCopy">
        <h2 :class="classes.panelTitle">Remote source with async option filters</h2>
        <p :class="classes.panelText">
          This route keeps the remote query engine active and showcases query-backed option filters
          where counts can come from the backend payload directly.
        </p>
      </div>

      <DataList
        :table="table"
        :height="'38rem'"
        title="Remote employees"
        description="Remote schema with API-backed option filters and centralized facet counts."
      />
    </div>
  </section>
</template>
