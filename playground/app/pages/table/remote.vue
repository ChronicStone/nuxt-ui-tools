<script setup lang="tsx">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UCard from '@nuxt/ui/components/Card.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import { hasProperty, isString } from '#ui-tools/shared/utils/predicate'
import { defineTableSchema, useTable } from '#ui-tools/table'
import type { TableFilterOptionEntry } from '#ui-tools/table'
import DataList from '#ui-tools/table/components/DataList.vue'

import { demoEmployeesClient } from '../../lib/demo-employees-api'

const { locale, t } = useI18n()
const { tableSize } = usePlaygroundShell()
const countryTreeOptions = [
  {
    children: [
      { label: () => translateCountry('France'), value: 'France' },
      { label: () => translateCountry('Germany'), value: 'Germany' },
      { label: () => translateCountry('United Kingdom'), value: 'United Kingdom' },
    ],
    label: () => translateRegion('Europe'),
  },
  {
    children: [{ label: () => translateCountry('United States'), value: 'United States' }],
    label: () => translateRegion('North America'),
  },
  {
    children: [{ label: () => translateCountry('Japan'), value: 'Japan' }],
    label: () => translateRegion('Asia'),
  },
] satisfies readonly TableFilterOptionEntry<string>[]

const remoteSchema = defineTableSchema({
  defaultLayout: 'table',
  filters: {
    search: {
      fields: ['fullName', 'email', 'department.company.name', 'employeeSkills.skill.label'],
      placeholder: () => t('playground.tableRemote.searchPlaceholder'),
    },
    ui: (filter) => [
      filter.text('fullName', {
        behavior: {
          operators: ['contains', 'is'],
        },
        display: {
          location: 'panel md:tag',
        },
        editor: {
          inputType: 'search',
          leadingIcon: 'i-lucide-search',
          placeholder: () => t('playground.tableCommon.filters.searchEmployees'),
        },
        label: () => t('playground.tableCommon.filters.name'),
      }),
      filter.option('department.company.country', {
        behavior: {
          defaultOperator: 'isAnyOf',
        },
        display: {
          location: 'panel md:tag',
        },
        editor: {
          closeOnSelect: false,
          labels: {
            searchPlaceholder: () => t('playground.tableCommon.filters.selectCountries'),
          },
          presentation: 'tree',
          searchable: true,
          selection: {
            mode: 'multiple',
          },
          tree: {
            searchMode: 'remote',
            selectable: 'leaf-only',
          },
        },
        label: () => t('playground.tableCommon.filters.country'),
        source: {
          facet: 'exclude-self',
          options: countryTreeOptions,
        },
      }),
      filter.option('department.company.name', {
        behavior: {
          defaultOperator: 'isAnyOf',
        },
        display: {
          location: 'panel md:tag',
        },
        editor: {
          closeOnSelect: false,
          labels: {
            searchPlaceholder: () => t('playground.tableRemote.filters.selectCompanies'),
          },
          searchable: true,
          selection: {
            mode: 'multiple',
          },
        },
        label: () => t('playground.tableCommon.cards.company'),
        source: {
          facet: 'exclude-self',
        },
      }),
      filter.option('employeeSkills.skill.label', {
        behavior: {
          defaultOperator: 'isAnyOf',
        },
        display: {
          location: 'panel md:tag',
        },
        editor: {
          closeOnSelect: false,
          row: {
            showCounts: true,
          },
          searchable: true,
          selection: {
            mode: 'multiple',
          },
        },
        label: () => t('playground.tableCommon.filters.skill'),
        source: {
          facet: 'exclude-self',
        },
      }),
      filter.option('department.name', {
        behavior: {
          defaultOperator: 'isAnyOf',
        },
        display: {
          location: 'panel md:tag',
        },
        editor: {
          row: {
            showCounts: true,
          },
          searchable: false,
          selection: {
            mode: 'multiple',
          },
        },
        label: () => t('playground.tableCommon.filters.department'),
        source: {
          facet: 'exclude-self',
          sort: 'count',
        },
      }),
      filter.boolean('isActive', {
        display: {
          location: 'panel md:tag',
        },
        editor: {
          labels: {
            false: () => t('playground.tableCommon.status.paused'),
            true: () => t('playground.tableCommon.status.online'),
          },
        },
        label: () => t('playground.tableCommon.filters.active'),
        source: {
          facet: 'exclude-self',
        },
      }),
      filter.number('salary', {
        behavior: {
          operators: ['is', 'gte', 'lte', 'between'],
        },
        display: {
          location: 'panel md:tag',
        },
        editor: {
          max: 250000,
          min: 50000,
          range: {
            display: 'inputs-slider',
            minGap: 10000,
          },
          scalar: {
            display: 'input-slider',
          },
          step: 5000,
        },
        label: () => t('playground.tableCommon.filters.salary'),
      }),
      filter.date('hiredAt', {
        behavior: {
          operators: ['is', 'before', 'after', 'between'],
        },
        display: {
          location: 'panel md:tag',
        },
        editor: {
          range: {
            calendar: {
              fixedWeeks: true,
              months: 1,
              pagedNavigation: true,
            },
            display: 'inputs-calendar',
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
            presetsPlacement: 'side',
          },
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
        },
        label: () => t('playground.tableCommon.filters.hiredAt'),
      }),
    ],
  },
  grid: {
    defaultSorting: {
      dir: 'asc',
      key: 'fullName',
    },
    enabled: true,
    gridSize: '1 md:2 xl:3',
    renderItem: ({ row }) => {
      const employeeSkills = row.employeeSkills.map((entry) => translateSkill(entry.skill.label))
      const departmentName = row.department?.name
        ? translateDepartment(row.department.name)
        : t('playground.tableRemote.noDepartment')
      const companyName = row.department?.company?.name ?? t('playground.tableRemote.noCompany')
      const countryName = row.department?.company?.country
        ? translateCountry(row.department.company.country)
        : t('playground.tableCommon.countries.unknown')
      const salary = row.salary ?? 0
      const hiredAt = row.hiredAt ?? new Date().toISOString()

      return (
        <UCard
          class="rounded-md h-full"
          ui={{
            body: 'flex min-h-0 flex-1 flex-col gap-4 p-4',
            footer: 'mt-auto p-4 pt-3',
            header: 'p-4',
            root: 'flex h-full flex-col',
          }}
          v-slots={{
            default: () => (
              <>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="grid gap-1 rounded-md bg-elevated/60 p-2.5">
                    <div class="text-xs text-muted">
                      {t('playground.tableCommon.cards.country')}
                    </div>
                    <div class="flex items-center gap-2 text-sm font-medium text-highlighted">
                      <span class="inline-flex h-4 w-4 items-center justify-center text-sm leading-none">
                        {getCountryFlag(countryName)}
                      </span>
                      <span class="truncate">{countryName}</span>
                    </div>
                  </div>

                  <div class="grid gap-1 rounded-md bg-elevated/60 p-2.5">
                    <div class="text-xs text-muted">{t('playground.tableCommon.cards.salary')}</div>
                    <div class="text-sm font-medium text-highlighted">{formatCurrency(salary)}</div>
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
                <div class="min-w-0 flex-1 truncate">{companyName}</div>
                <div class="shrink-0">{formatDate(hiredAt)}</div>
              </div>
            ),
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
                  label={
                    row.isActive
                      ? t('playground.tableCommon.status.online')
                      : t('playground.tableCommon.status.paused')
                  }
                />
              </div>
            ),
          }}
        />
      )
    },
  },
  pagination: {
    defaultSize: {
      grid: 12,
      table: 20,
    },
    showPageSizePicker: true,
    showPagesCount: true,
    showPagesList: true,
    sizeOptions: {
      grid: [12, 24, 48],
      table: [10, 20, 50, 100, 500, 1000],
    },
  },
  rowKey: 'id',
  source: {
    facets: true,
    mode: 'remote',
    query: (params) => ({
      queryFn: async () => {
        if (params.pagination.mode !== 'offset')
          throw new Error('The remote employee demo uses offset pagination.')

        return demoEmployeesClient.queryTable(params)
      },
      queryKey: ['demo-employees', params],
    }),
  },
  table: {
    columns: (column) => [
      column.field('fullName', {
        icon: 'i-lucide-user-round',
        label: () => t('playground.tableCommon.columns.employee'),
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
                <span class="truncate">
                  {row.employeeSkills[0]?.skill.label
                    ? translateSkill(row.employeeSkills[0].skill.label)
                    : t('playground.tableCommon.generalist')}
                </span>
              </div>
            </div>
          </div>
        ),
      }),
      column.field('email', {
        icon: 'i-lucide-at-sign',
        label: () => t('playground.tableCommon.columns.email'),
        minWidth: 280,
        render: ({ row }) => (
          <div class="min-w-0">
            <div class="truncate text-highlighted">{row.email}</div>
            <div class="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <UIcon name="i-lucide-building-2" class="size-3.5 shrink-0" />
              <span class="truncate">
                {row.department?.company?.name ?? t('playground.tableRemote.noCompany')}
              </span>
            </div>
          </div>
        ),
      }),
      column.composite('skills', {
        icon: 'i-lucide-tags',
        label: () => t('playground.tableCommon.columns.skills'),
        minWidth: 240,
        render: ({ row }) => (
          <div class="flex flex-wrap gap-1.5">
            {row.employeeSkills
              .map((entry) => entry.skill.label)
              .slice(0, 3)
              .map((skill) => (
                <UBadge
                  key={skill}
                  color="neutral"
                  variant="subtle"
                  size="sm"
                  label={translateSkill(skill)}
                />
              ))}
          </div>
        ),
        sortableKey: 'fullName',
      }),
      column.field('department.company.country', {
        icon: 'i-lucide-globe',
        label: () => t('playground.tableCommon.columns.country'),
        minWidth: 170,
        render: ({ value }) => (
          <div class="flex items-center gap-2">
            <span class="text-base leading-none">{getCountryFlag(String(value ?? ''))}</span>
            <span class="truncate text-highlighted">
              {translateCountry(String(value ?? 'Unknown'))}
            </span>
          </div>
        ),
      }),
      column.field('department.name', {
        icon: 'i-lucide-building-2',
        label: () => t('playground.tableCommon.columns.department'),
        minWidth: 180,
        render: ({ value }) => (
          <span class="truncate text-highlighted">{translateDepartment(String(value ?? ''))}</span>
        ),
      }),
      column.field('isActive', {
        icon: 'i-lucide-badge-check',
        label: () => t('playground.tableCommon.columns.active'),
        minWidth: 120,
        render: ({ value }) => (
          <UBadge
            color={value ? 'success' : 'neutral'}
            variant={value ? 'soft' : 'subtle'}
            size="sm"
            label={
              value
                ? t('playground.tableCommon.status.online')
                : t('playground.tableCommon.status.paused')
            }
          />
        ),
      }),
      column.field('salary', {
        align: 'right',
        icon: 'i-lucide-wallet',
        label: () => t('playground.tableCommon.columns.salary'),
        labelAlign: 'right',
        minWidth: 160,
        render: ({ value }) => (
          <span class="font-medium text-highlighted">{formatCurrency(Number(value ?? 0))}</span>
        ),
      }),
      column.field('hiredAt', {
        icon: 'i-lucide-calendar-days',
        label: () => t('playground.tableCommon.columns.hiredAt'),
        minWidth: 170,
        render: ({ value }) => (
          <span class="text-highlighted">{formatDate(String(value ?? ''))}</span>
        ),
      }),
    ],
    defaultSorting: {
      dir: 'desc',
      key: 'hiredAt',
    },
  },
  tableKey: 'demo-employees-remote',
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
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getCountryFlag(country: string) {
  const flags = {
    France: '🇫🇷',
    Germany: '🇩🇪',
    Japan: '🇯🇵',
    'United Kingdom': '🇬🇧',
    'United States': '🇺🇸',
  } satisfies Record<string, string>

  return hasProperty(flags, country) && isString(flags[country]) ? flags[country] : '🌍'
}

function translateCountry(value: string) {
  const keyByCountry = {
    France: 'france',
    Germany: 'germany',
    Japan: 'japan',
    'United Kingdom': 'unitedKingdom',
    'United States': 'unitedStates',
    Unknown: 'unknown',
  } satisfies Record<string, string>

  const key = hasProperty(keyByCountry, value) ? keyByCountry[value] : undefined
  return key ? t(`playground.tableCommon.countries.${key}`) : value
}

function translateRegion(value: string) {
  const keyByRegion = {
    Asia: 'asia',
    Europe: 'europe',
    'North America': 'northAmerica',
  } satisfies Record<string, string>

  const key = hasProperty(keyByRegion, value) ? keyByRegion[value] : undefined
  return key ? t(`playground.tableCommon.regions.${key}`) : value
}

function translateDepartment(value: string) {
  const keyByDepartment = {
    Data: 'data',
    Design: 'design',
    Engineering: 'engineering',
    Finance: 'finance',
    Growth: 'growth',
    Operations: 'operations',
    Platform: 'platform',
    Product: 'product',
    Security: 'security',
    Support: 'support',
  } satisfies Record<string, string>

  const key = hasProperty(keyByDepartment, value) ? keyByDepartment[value] : undefined
  return key ? t(`playground.tableCommon.departments.${key}`) : value
}

function translateSkill(value: string) {
  const keyBySkill = {
    'Design Systems': 'designSystems',
    'Distributed Systems': 'distributedSystems',
    Go: 'go',
    GraphQL: 'graphql',
    'Incident Response': 'incidentResponse',
    Kubernetes: 'kubernetes',
    'Machine Learning': 'machineLearning',
    Observability: 'observability',
    PostgreSQL: 'postgresql',
    'Product Strategy': 'productStrategy',
    Python: 'python',
    Rust: 'rust',
    Security: 'security',
    Terraform: 'terraform',
    TypeScript: 'typescript',
    'UX Research': 'uxResearch',
  } satisfies Record<string, string>

  const key = hasProperty(keyBySkill, value) ? keyBySkill[value] : undefined
  return key ? t(`playground.tableCommon.skills.${key}`) : value
}
</script>

<template>
  <PlaygroundContent mode="scroll" class="p-4 lg:p-6">
    <DataList
      :table="table"
      :size="tableSize"
      :height="'38rem'"
      title="Remote employees"
      description="Drizzle Resource + Drizzle ORM + SQLite through one Nuxt server endpoint."
    />
  </PlaygroundContent>
</template>
