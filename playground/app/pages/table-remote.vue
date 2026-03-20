<script setup lang="tsx">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UCard from '@nuxt/ui/components/Card.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import {
  demoEmployeesClient,
  type DemoEmployeesFacetsRequest,
  type DemoEmployeeRow,
  type DemoEmployeesTableRequest,
} from '../lib/demo-employees-api'
import DataList from '#ui-tools/table/components/DataList.vue'
import { defineTableSchema, useTable, type TableFilterOptionEntry } from '#ui-tools/table'

const { classes } = usePlaygroundAppearance()
const countryTreeOptions = [
  {
    label: 'Europe',
    children: [
      { label: 'France', value: 'France' },
      { label: 'Germany', value: 'Germany' },
      { label: 'United Kingdom', value: 'United Kingdom' },
    ],
  },
  {
    label: 'North America',
    children: [
      { label: 'United States', value: 'United States' },
    ],
  },
  {
    label: 'Asia',
    children: [
      { label: 'Japan', value: 'Japan' },
    ],
  },
] satisfies ReadonlyArray<TableFilterOptionEntry<string>>

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
        ui: {
          placeholder: 'Search employees',
          leadingIcon: 'i-lucide-search',
          inputType: 'search',
        },
      }),
      filter.option('department.company.country', {
        label: 'Country',
        defaultOperator: 'isAnyOf',
        facet: 'exclude-self',
        options: countryTreeOptions,
        ui: {
          searchable: true,
          closeOnSelect: false,
          presentation: 'tree',
          tree: {
            selectable: 'leaf-only',
            searchMode: 'remote',
          },
          selection: {
            mode: 'multiple',
          },
          labels: {
            searchPlaceholder: 'Select countries',
          },
        },
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
        ui: {
          searchable: true,
          closeOnSelect: false,
          selection: {
            mode: 'multiple',
          },
          labels: {
            searchPlaceholder: 'Select companies',
          },
        },
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
        ui: {
          row: {
            showCounts: false,
          },
        },
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
        ui: {
          searchable: false,
          selection: {
            mode: 'multiple',
          },
        },
      }),
      filter.boolean('isActive', {
        label: 'Active',
        facet: 'exclude-self',
        ui: {
          labels: {
            true: 'Online',
            false: 'Paused',
          },
        },
      }),
      filter.number('salary', {
        label: 'Salary',
        operators: ['is', 'gte', 'lte', 'between'],
        ui: {
          min: 50000,
          max: 250000,
          step: 5000,
          scalar: {
            display: 'input-slider',
          },
          range: {
            display: 'inputs-slider',
            minGap: 10000,
          },
        },
      }),
      filter.date('hiredAt', {
        label: 'Hired At',
        operators: ['is', 'before', 'after', 'between'],
        ui: {
          scalar: {
            display: 'calendar',
            presets: [
              {
                label: 'Today',
                value: ({ now }) => atStartOfDay(now),
              },
              {
                label: 'Yesterday',
                value: ({ now }) => atStartOfDay(shiftDays(now, -1)),
              },
              {
                label: 'Start of month',
                value: ({ now }) => new Date(now.getFullYear(), now.getMonth(), 1),
              },
            ],
          },
          range: {
            display: 'inputs-calendar',
            presetsPlacement: 'side',
            presets: [
              {
                label: 'Last 7 days',
                value: ({ now }) => ({
                  from: atStartOfDay(shiftDays(now, -6)),
                  to: atEndOfDay(now),
                }),
              },
              {
                label: 'Last 30 days',
                value: ({ now }) => ({
                  from: atStartOfDay(shiftDays(now, -29)),
                  to: atEndOfDay(now),
                }),
              },
              {
                label: 'This month',
                value: ({ now }) => ({
                  from: new Date(now.getFullYear(), now.getMonth(), 1),
                  to: atEndOfDay(now),
                }),
              },
            ],
            calendar: {
              months: 1,
              pagedNavigation: true,
              fixedWeeks: true,
            },
          },
        },
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
    mode: 'contained',
    gridSize: '1 md:2 xl:3',
    renderItem: ({ row }) => {
      const employee = row
      const employeeSkills = employee.employeeSkills.map((entry) => entry.skill.label)
      const departmentName = employee.department?.name ?? 'No department'
      const companyName = employee.department?.company?.name ?? 'No company'
      const countryName = employee.department?.company?.country ?? 'Unknown'
      const salary = employee.salary ?? 0
      const hiredAt = employee.hiredAt ?? new Date().toISOString()

      return (
        <UCard
          class="rounded-md h-full"
          ui={{
            root: 'flex h-full flex-col',
            header: 'p-4',
            body: 'flex min-h-0 flex-1 flex-col gap-4 p-4',
            footer: 'mt-auto p-4 pt-3',
          }}
          v-slots={{
            header: () => (
              <div class="flex items-start justify-between gap-3">
                <div class="flex min-w-0 items-center gap-3">
                  <div class="flex size-10 items-center justify-center rounded-md bg-elevated text-sm font-semibold text-highlighted">
                    {getInitials(employee.fullName)}
                  </div>
                  <div class="min-w-0">
                    <div class="truncate font-medium text-highlighted">{employee.fullName}</div>
                    <div class="mt-1 flex items-center gap-2 text-sm text-muted">
                      <UIcon name="i-lucide-building-2" class="size-3.5 shrink-0" />
                      <span class="truncate">{departmentName}</span>
                    </div>
                  </div>
                </div>

                <UBadge
                  color={employee.isActive ? 'success' : 'neutral'}
                  variant={employee.isActive ? 'soft' : 'subtle'}
                  size="sm"
                  label={employee.isActive ? 'Online' : 'Paused'}
                />
              </div>
            ),
            default: () => (
              <>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="grid gap-1 rounded-md bg-elevated/60 p-2.5">
                    <div class="text-xs text-muted">Country</div>
                    <div class="flex items-center gap-2 text-sm font-medium text-highlighted">
                      <span class="inline-flex h-4 w-4 items-center justify-center text-sm leading-none">
                        {getCountryFlag(countryName)}
                      </span>
                      <span class="truncate">{countryName}</span>
                    </div>
                  </div>

                  <div class="grid gap-1 rounded-md bg-elevated/60 p-2.5">
                    <div class="text-xs text-muted">Salary</div>
                    <div class="text-sm font-medium text-highlighted">
                      {formatCurrency(salary)}
                    </div>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2">
                  {employeeSkills.slice(0, 4).map((skill) => (
                    <UBadge key={skill} color="neutral" variant="subtle" size="xs" label={skill} />
                  ))}
                </div>
              </>
            ),
            footer: () => (
              <div class="flex h-5 items-center justify-between gap-3 text-sm/5 text-muted">
                <div class="min-w-0 flex-1 truncate">
                  {companyName}
                </div>
                <div class="shrink-0">{formatDate(hiredAt)}</div>
              </div>
            ),
          }}
        />
      )
    },
    defaultSorting: {
      key: 'fullName',
      dir: 'asc',
    },
  },
})

const table = useTable(remoteSchema)

function atStartOfDay(value: Date) {
  const next = new Date(value)
  next.setHours(0, 0, 0, 0)
  return next
}

function atEndOfDay(value: Date) {
  const next = new Date(value)
  next.setHours(23, 59, 59, 999)
  return next
}

function shiftDays(value: Date, amount: number) {
  const next = new Date(value)
  next.setDate(next.getDate() + amount)
  return next
}

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
