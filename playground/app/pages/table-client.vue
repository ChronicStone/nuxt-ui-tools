<script setup lang="tsx">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import DataList from '#table/components/DataList.vue'
import { defineTableSchema, useTable, type GenericObject } from '#table'

interface DemoClientCompany extends GenericObject {
  id: string
  name: string
  country: string
}

interface DemoClientDepartment extends GenericObject {
  id: string
  name: string
  company: DemoClientCompany
}

interface DemoClientRow extends GenericObject {
  id: string
  fullName: string
  email: string
  salary: number
  isActive: boolean
  hiredAt: string
  department: DemoClientDepartment
  skills: string[]
}

const { classes } = usePlaygroundAppearance()

const countryOptions = ['France', 'Germany', 'Japan', 'United Kingdom', 'United States'] as const
const departmentOptions = ['Engineering', 'Platform', 'Operations', 'Finance', 'Product'] as const
const skillOptions = ['TypeScript', 'Go', 'Kubernetes', 'Security', 'Distributed Systems'] as const
const companyNames = ['Northstar', 'Rivet', 'Monarch', 'Atlas', 'Helio'] as const
const FIRST_NAMES = ['Ava', 'Luca', 'Emma', 'Noah', 'Mia', 'Leo', 'Iris', 'Milan']
const LAST_NAMES = ['Martin', 'Dubois', 'Bernard', 'Garcia', 'Nguyen', 'Wright', 'Klein', 'Sato']

const clientRows = createClientRows()

const clientSchema = defineTableSchema({
  tableKey: 'demo-employees-client',
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
    mode: 'client',
    query: () => ({
      queryKey: ['demo-employees-client'],
      queryFn: async () => clientRows,
    }),
  },
  filters: {
    search: {
      fields: ['fullName', 'email', 'department.company.name', 'skills'],
      placeholder: 'Search local employees...',
    },
    ui: (filter) => [
      filter.text('fullName', {
        label: 'Name',
        operators: ['contains', 'is'],
      }),
      filter.option('department.company.country', {
        label: 'Country',
        defaultOperator: 'isAnyOf',
        options: countryOptions.map((value) => ({
          label: value,
          value,
        })),
      }),
      filter.option('skills', {
        label: 'Skill',
        defaultOperator: 'isAnyOf',
        options: skillOptions.map((value) => ({
          label: value,
          value,
        })),
      }),
      filter.option('department.name', {
        label: 'Department',
        defaultOperator: 'isAnyOf',
        options: departmentOptions.map((value) => ({
          label: value,
          value,
        })),
      }),
      filter.boolean('isActive', {
        label: 'Active',
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
          const employee = row as DemoClientRow

          return (
            <div class="flex min-w-0 items-center gap-3">
              <div class="flex size-9 shrink-0 items-center justify-center rounded-full border border-default bg-elevated text-[11px] font-semibold text-highlighted">
                {getInitials(employee.fullName)}
              </div>
              <div class="min-w-0">
                <div class="truncate font-medium text-highlighted">{employee.fullName}</div>
                <div class="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                  <UIcon name="i-lucide-sparkles" class="size-3 shrink-0" />
                  <span class="truncate">{employee.skills[0] ?? 'Generalist'}</span>
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
          const employee = row as DemoClientRow

          return (
            <div class="min-w-0">
              <div class="truncate text-highlighted">{employee.email}</div>
              <div class="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <UIcon name="i-lucide-building-2" class="size-3.5 shrink-0" />
                <span class="truncate">{employee.department.company.name}</span>
              </div>
            </div>
          )
        },
      }),
      column.composite('skillsSummary', {
        label: 'Skills',
        icon: 'i-lucide-tags',
        sortableKey: 'fullName',
        minWidth: 230,
        render: ({ row }) => {
          const employee = row as DemoClientRow

          return (
            <div class="flex flex-wrap gap-1.5">
              {employee.skills.slice(0, 3).map((skill) => (
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
        maxWidth: 150,
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

const table = useTable(clientSchema)

function createClientRows() {
  const random = createSeededRandom(42)

  return Array.from({ length: 5000 }, (_, index) => {
    const country = pickWeighted(random, [
      ['United States', 0.3],
      ['United Kingdom', 0.18],
      ['Germany', 0.2],
      ['France', 0.16],
      ['Japan', 0.16],
    ])
    const department = pickWeighted(random, [
      ['Engineering', 0.32],
      ['Platform', 0.2],
      ['Product', 0.18],
      ['Operations', 0.18],
      ['Finance', 0.12],
    ])
    const company = pickWeighted(random, [
      ['Northstar', 0.28],
      ['Atlas', 0.2],
      ['Rivet', 0.2],
      ['Helio', 0.18],
      ['Monarch', 0.14],
    ])
    const firstName = pickOne(random, FIRST_NAMES, 'Ava')
    const lastName = pickOne(random, LAST_NAMES, 'Martin')
    const primarySkill = pickWeighted(random, [
      ['TypeScript', 0.34],
      ['Distributed Systems', 0.22],
      ['Kubernetes', 0.18],
      ['Go', 0.16],
      ['Security', 0.1],
    ])
    const secondarySkill = pickOne(random, skillOptions.filter(skill => skill !== primarySkill), 'Go')
    const tertiarySkill = random() > 0.42
      ? pickOne(
          random,
          skillOptions.filter(skill => skill !== primarySkill && skill !== secondarySkill),
          'Kubernetes',
        )
      : null
    const skills = tertiarySkill == null
      ? [primarySkill, secondarySkill]
      : [primarySkill, secondarySkill, tertiarySkill]
    const salaryBaseByDepartment: Record<string, number> = {
      Engineering: 118000,
      Platform: 132000,
      Product: 109000,
      Operations: 92000,
      Finance: 98000,
    }
    const salary = Math.round((salaryBaseByDepartment[department] ?? 100000) + random() * 42000 - 9000)
    const hiredAt = new Date(
      2019 + Math.floor(random() * 7),
      Math.floor(random() * 12),
      1 + Math.floor(random() * 27),
    ).toISOString()
    const isActive = random() > 0.17

    return {
      id: `client-${index + 1}`,
      fullName: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      salary,
      isActive,
      hiredAt,
      department: {
        id: `department-${department}`,
        name: department,
        company: {
          id: `company-${company}`,
          name: company,
          country,
        },
      },
      skills,
    } satisfies DemoClientRow
  })
}

function createSeededRandom(seed: number) {
  let state = seed

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

function pickOne<TValue>(random: () => number, values: readonly TValue[], fallback: TValue) {
  return values[Math.floor(random() * values.length)] ?? fallback
}

function pickWeighted<TValue extends string>(
  random: () => number,
  values: ReadonlyArray<readonly [TValue, number]>,
) {
  const threshold = random()
  let cursor = 0

  for (const [value, weight] of values) {
    cursor += weight

    if (threshold <= cursor) {
      return value
    }
  }

  return values.at(-1)?.[0] ?? values[0]?.[0] ?? '' as TValue
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
        <UBadge color="neutral" variant="subtle" label="Client Playground" />
      </div>

      <div :class="classes.panelCopy">
        <h2 :class="classes.panelTitle">Client source with automatic option counts</h2>
        <p :class="classes.panelText">
          This route runs in client mode, so option filter counts are derived automatically from the
          full local dataset without extra filter configuration.
        </p>
      </div>

      <DataList
        :table="table"
        :height="'38rem'"
        title="Local employees"
        description="Client-side schema with static options and auto-counted facets."
      />
    </div>
  </section>
</template>
