<script setup lang="tsx">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UCard from '@nuxt/ui/components/Card.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import {
  demoEmployeesClient,
} from '../lib/demo-employees-api'

import DataList from '#ui-tools/table/components/DataList.vue'
import { defineTableSchema, useTable, type TableFilterOptionEntry } from '#ui-tools/table'
const { locale, t } = useI18n()
const countryTreeOptions = [
  {
    label: () => translateRegion('Europe'),
    children: [
      { label: () => translateCountry('France'), value: 'France' },
      { label: () => translateCountry('Germany'), value: 'Germany' },
      { label: () => translateCountry('United Kingdom'), value: 'United Kingdom' },
    ],
  },
  {
    label: () => translateRegion('North America'),
    children: [
      { label: () => translateCountry('United States'), value: 'United States' },
    ],
  },
  {
    label: () => translateRegion('Asia'),
    children: [
      { label: () => translateCountry('Japan'), value: 'Japan' },
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
    facets: true,
    query: (params) => ({
      queryKey: ['demo-employees', params],
      queryFn: async () => {
        if (params.pagination.mode !== 'offset')
          throw new Error('The remote employee demo uses offset pagination.')

        return demoEmployeesClient.queryTable({
          ...params,
          pagination: {
            pageIndex: params.pagination.pageIndex,
            pageSize: params.pagination.pageSize,
          },
        })
      },
    }),
  },
  filters: {
    search: {
      fields: ['fullName', 'email', 'department.company.name', 'employeeSkills.skill.label'],
      placeholder: () => t('playground.tableRemote.searchPlaceholder'),
    },
    ui: (filter) => [
      filter.text('fullName', {
        label: () => t('playground.tableCommon.filters.name'),
        behavior: {
          operators: ['contains', 'is'],
        },
        display: {
          location: 'panel md:tag',
        },
        editor: {
          placeholder: () => t('playground.tableCommon.filters.searchEmployees'),
          leadingIcon: 'i-lucide-search',
          inputType: 'search',
        },
      }),
      filter.option('department.company.country', {
        label: () => t('playground.tableCommon.filters.country'),
        behavior: {
          defaultOperator: 'isAnyOf',
        },
        display: {
          location: 'panel md:tag',
        },
        source: {
          facet: 'exclude-self',
          options: countryTreeOptions,
        },
        editor: {
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
            searchPlaceholder: () => t('playground.tableCommon.filters.selectCountries'),
          },
        },
      }),
      filter.option('department.companyId', {
        label: () => t('playground.tableCommon.cards.company'),
        behavior: {
          defaultOperator: 'isAnyOf',
        },
        display: {
          location: 'panel md:tag',
        },
        source: {
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
        },
        editor: {
          searchable: true,
          closeOnSelect: false,
          selection: {
            mode: 'multiple',
          },
          labels: {
            searchPlaceholder: () => t('playground.tableRemote.filters.selectCompanies'),
          },
        },
      }),
      filter.option('employeeSkills.skillId', {
        label: () => t('playground.tableCommon.filters.skill'),
        behavior: {
          defaultOperator: 'isAnyOf',
        },
        display: {
          location: 'panel md:tag',
        },
        source: {
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
        },
        editor: {
          row: {
            showCounts: false,
          },
        },
      }),
      filter.option('departmentId', {
        label: () => t('playground.tableCommon.filters.department'),
        behavior: {
          defaultOperator: 'isAnyOf',
        },
        display: {
          location: 'panel md:tag',
        },
        source: {
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
        },
        editor: {
          searchable: false,
          selection: {
            mode: 'multiple',
          },
        },
      }),
      filter.boolean('isActive', {
        label: () => t('playground.tableCommon.filters.active'),
        display: {
          location: 'panel md:tag',
        },
        source: {
          facet: 'exclude-self',
        },
        editor: {
          labels: {
            true: () => t('playground.tableCommon.status.online'),
            false: () => t('playground.tableCommon.status.paused'),
          },
        },
      }),
      filter.number('salary', {
        label: () => t('playground.tableCommon.filters.salary'),
        behavior: {
          operators: ['is', 'gte', 'lte', 'between'],
        },
        display: {
          location: 'panel md:tag',
        },
        editor: {
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
        label: () => t('playground.tableCommon.filters.hiredAt'),
        behavior: {
          operators: ['is', 'before', 'after', 'between'],
        },
        display: {
          location: 'panel md:tag',
        },
        editor: {
          scalar: {
            display: 'calendar',
            presets: [
              {
                label: () => t('playground.tableCommon.datePresets.today'),
                value: ({ now }) => atStartOfDay(now),
              },
              {
                label: () => t('playground.tableCommon.datePresets.yesterday'),
                value: ({ now }) => atStartOfDay(shiftDays(now, -1)),
              },
              {
                label: () => t('playground.tableCommon.datePresets.startOfMonth'),
                value: ({ now }) => new Date(now.getFullYear(), now.getMonth(), 1),
              },
            ],
          },
          range: {
            display: 'inputs-calendar',
            presetsPlacement: 'side',
            presets: [
              {
                label: () => t('playground.tableCommon.datePresets.last7Days'),
                value: ({ now }) => ({
                  from: atStartOfDay(shiftDays(now, -6)),
                  to: atEndOfDay(now),
                }),
              },
              {
                label: () => t('playground.tableCommon.datePresets.last30Days'),
                value: ({ now }) => ({
                  from: atStartOfDay(shiftDays(now, -29)),
                  to: atEndOfDay(now),
                }),
              },
              {
                label: () => t('playground.tableCommon.datePresets.thisMonth'),
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
        label: () => t('playground.tableCommon.columns.employee'),
        icon: 'i-lucide-user-round',
        minWidth: 260,
        pinned: 'left',
        render: ({ row }) => (
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex size-9 shrink-0 items-center justify-center rounded-full border border-default bg-elevated text-[11px] font-semibold text-highlighted">
              {getInitials(row.fullName)}
            </div>
            <div class="min-w-0">
              <div class="truncate font-medium text-highlighted">{row.fullName}</div>
              <div class="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted">
                <UIcon name="i-lucide-sparkles" class="size-3 shrink-0" />
                <span class="truncate">{row.employeeSkills[0]?.skill.label ? translateSkill(row.employeeSkills[0].skill.label) : t('playground.tableCommon.generalist')}</span>
              </div>
            </div>
          </div>
        ),
      }),
      column.field('email', {
        label: () => t('playground.tableCommon.columns.email'),
        icon: 'i-lucide-at-sign',
        minWidth: 280,
        render: ({ row }) => (
          <div class="min-w-0">
            <div class="truncate text-highlighted">{row.email}</div>
            <div class="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <UIcon name="i-lucide-building-2" class="size-3.5 shrink-0" />
              <span class="truncate">{row.department?.company?.name ?? t('playground.tableRemote.noCompany')}</span>
            </div>
          </div>
        ),
      }),
      column.composite('skills', {
        label: () => t('playground.tableCommon.columns.skills'),
        icon: 'i-lucide-tags',
        sortableKey: 'fullName',
        minWidth: 240,
        render: ({ row }) => (
          <div class="flex flex-wrap gap-1.5">
            {row.employeeSkills
              .map((entry) => entry.skill.label)
              .slice(0, 3)
              .map((skill) => (
                <UBadge key={skill} color="neutral" variant="subtle" size="sm" label={translateSkill(skill)} />
              ))}
          </div>
        ),
      }),
      column.field('department.company.country', {
        label: () => t('playground.tableCommon.columns.country'),
        icon: 'i-lucide-globe',
        minWidth: 170,
        render: ({ value }) => (
          <div class="flex items-center gap-2">
            <span class="text-base leading-none">{getCountryFlag(String(value ?? ''))}</span>
            <span class="truncate text-highlighted">{translateCountry(String(value ?? 'Unknown'))}</span>
          </div>
        ),
      }),
      column.field('department.name', {
        label: () => t('playground.tableCommon.columns.department'),
        icon: 'i-lucide-building-2',
        minWidth: 180,
        render: ({ value }) => (
          <span class="truncate text-highlighted">{translateDepartment(String(value ?? ''))}</span>
        ),
      }),
      column.field('isActive', {
        label: () => t('playground.tableCommon.columns.active'),
        icon: 'i-lucide-badge-check',
        minWidth: 120,
        render: ({ value }) => (
          <UBadge
            color={value ? 'success' : 'neutral'}
            variant={value ? 'soft' : 'subtle'}
            size="sm"
            label={value ? t('playground.tableCommon.status.online') : t('playground.tableCommon.status.paused')}
          />
        ),
      }),
      column.field('salary', {
        label: () => t('playground.tableCommon.columns.salary'),
        icon: 'i-lucide-wallet',
        align: 'right',
        labelAlign: 'right',
        minWidth: 160,
        render: ({ value }) => (
          <span class="font-medium text-highlighted">{formatCurrency(Number(value ?? 0))}</span>
        ),
      }),
      column.field('hiredAt', {
        label: () => t('playground.tableCommon.columns.hiredAt'),
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
    gridSize: '1 md:2 xl:3',
    renderItem: ({ row }) => {
      const employeeSkills = row.employeeSkills.map((entry) => translateSkill(entry.skill.label))
      const departmentName = row.department?.name ? translateDepartment(row.department.name) : t('playground.tableRemote.noDepartment')
      const companyName = row.department?.company?.name ?? t('playground.tableRemote.noCompany')
      const countryName = row.department?.company?.country ? translateCountry(row.department.company.country) : t('playground.tableCommon.countries.unknown')
      const salary = row.salary ?? 0
      const hiredAt = row.hiredAt ?? new Date().toISOString()

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
                    {getInitials(row.fullName)}
                  </div>
                  <div class="min-w-0">
                    <div class="truncate font-medium text-highlighted">{row.fullName}</div>
                    <div class="mt-1 flex items-center gap-2 text-sm text-muted">
                      <UIcon name="i-lucide-building-2" class="size-3.5 shrink-0" />
                      <span class="truncate">{departmentName}</span>
                    </div>
                  </div>
                </div>

                <UBadge
                  color={row.isActive ? 'success' : 'neutral'}
                  variant={row.isActive ? 'soft' : 'subtle'}
                  size="sm"
                  label={row.isActive ? t('playground.tableCommon.status.online') : t('playground.tableCommon.status.paused')}
                />
              </div>
            ),
            default: () => (
              <>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="grid gap-1 rounded-md bg-elevated/60 p-2.5">
                    <div class="text-xs text-muted">{t('playground.tableCommon.cards.country')}</div>
                    <div class="flex items-center gap-2 text-sm font-medium text-highlighted">
                      <span class="inline-flex h-4 w-4 items-center justify-center text-sm leading-none">
                        {getCountryFlag(countryName)}
                      </span>
                      <span class="truncate">{countryName}</span>
                    </div>
                  </div>

                  <div class="grid gap-1 rounded-md bg-elevated/60 p-2.5">
                    <div class="text-xs text-muted">{t('playground.tableCommon.cards.salary')}</div>
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
  return new Intl.NumberFormat(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
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

function translateCountry(value: string) {
  const keyByCountry: Record<string, string> = {
    France: 'france',
    Germany: 'germany',
    Japan: 'japan',
    'United Kingdom': 'unitedKingdom',
    'United States': 'unitedStates',
    Unknown: 'unknown',
  }

  const key = keyByCountry[value]
  return key ? t(`playground.tableCommon.countries.${key}`) : value
}

function translateRegion(value: string) {
  const keyByRegion: Record<string, string> = {
    Europe: 'europe',
    'North America': 'northAmerica',
    Asia: 'asia',
  }

  const key = keyByRegion[value]
  return key ? t(`playground.tableCommon.regions.${key}`) : value
}

function translateDepartment(value: string) {
  const keyByDepartment: Record<string, string> = {
    Engineering: 'engineering',
    Platform: 'platform',
    Operations: 'operations',
    Finance: 'finance',
    Product: 'product',
    Design: 'design',
    Security: 'security',
    Data: 'data',
    Support: 'support',
    Growth: 'growth',
  }

  const key = keyByDepartment[value]
  return key ? t(`playground.tableCommon.departments.${key}`) : value
}

function translateSkill(value: string) {
  const keyBySkill: Record<string, string> = {
    TypeScript: 'typescript',
    Go: 'go',
    Kubernetes: 'kubernetes',
    Security: 'security',
    'Distributed Systems': 'distributedSystems',
    Rust: 'rust',
    Python: 'python',
    GraphQL: 'graphql',
    PostgreSQL: 'postgresql',
    'Machine Learning': 'machineLearning',
    'Design Systems': 'designSystems',
    Observability: 'observability',
    Terraform: 'terraform',
    'Incident Response': 'incidentResponse',
    'Product Strategy': 'productStrategy',
    'UX Research': 'uxResearch',
  }

  const key = keyBySkill[value]
  return key ? t(`playground.tableCommon.skills.${key}`) : value
}
</script>

<template>
  <div class="p-6">
    <DataList :table="table" :height="'38rem'" />
  </div>
</template>
