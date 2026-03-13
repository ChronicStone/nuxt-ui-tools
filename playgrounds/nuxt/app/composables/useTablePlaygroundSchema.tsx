import UBadge from '@nuxt/ui/components/Badge.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import { defineTableSchema, type GenericObject } from '../../../../packages/table/src'

interface DemoCompany extends GenericObject {
  id: string
  name: string
  country: string | null
  createdAt: string
}

interface DemoDepartment extends GenericObject {
  id: string
  companyId: string
  name: string
  budget: number | null
  company?: DemoCompany
}

interface DemoSkill extends GenericObject {
  id: string
  label: string
}

interface DemoEmployeeSkill extends GenericObject {
  employeeId: string
  skillId: string
  skill: DemoSkill
}

interface DemoEmployeeRow {
  id: string
  departmentId: string
  fullName: string
  email: string
  salary: number | null
  isActive: boolean
  hiredAt: string | null
  department?: DemoDepartment
  employeeSkills: DemoEmployeeSkill[]
}

interface TableRemoteFilterCondition {
  type: 'condition'
  key: string
  operator:
    | 'contains'
    | 'is'
    | 'isAnyOf'
    | 'isNot'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'between'
    | 'before'
    | 'after'
  value: unknown
}

interface TableRemoteFilterGroup {
  type: 'group'
  combinator: 'and' | 'or'
  children: Array<TableRemoteFilterGroup | TableRemoteFilterCondition>
}

interface DemoEmployeesTableRequest {
  pagination: {
    pageIndex: number
    pageSize: number
  }
  sorting: Array<{
    key: string
    dir: 'asc' | 'desc'
  }>
  filters: TableRemoteFilterGroup
  search: {
    value: string
    fields: string[]
  }
  context: Record<string, unknown>
}

interface DemoEmployeesTableResponse {
  rows: DemoEmployeeRow[]
  rowCount: number
}

const demoCountryOptions = [
  { label: 'France', value: 'France' },
  { label: 'Germany', value: 'Germany' },
  { label: 'Japan', value: 'Japan' },
  { label: 'United Kingdom', value: 'United Kingdom' },
  { label: 'United States', value: 'United States' },
] as const

const demoSkillOptions = [
  { label: 'Distributed Systems', value: 'Distributed Systems' },
  { label: 'Go', value: 'Go' },
  { label: 'Kubernetes', value: 'Kubernetes' },
  { label: 'Security', value: 'Security' },
  { label: 'TypeScript', value: 'TypeScript' },
] as const

const demoEmployeesEndpoint = '/api/table/demo-employees/query'

export const tableSchema = defineTableSchema({
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
      queryFn: async () =>
        $fetch<DemoEmployeesTableResponse>(demoEmployeesEndpoint, {
          method: 'POST',
          body: request as DemoEmployeesTableRequest,
        }),
    }),
  },
  filters: {
    search: {
      fields: ['fullName', 'email', 'department.company.name', 'employeeSkills.skill.label'],
      placeholder: 'Search employees...',
    },
    ui: (filter) => [
      filter.text('fullName', {
        label: 'Employee name',
        operators: ['contains', 'is'],
      }),
      filter.option('department.company.country', {
        label: 'Company country',
        defaultOperator: 'isAnyOf',
        options: [...demoCountryOptions],
      }),
      filter.option('employeeSkills.skill.label', {
        label: 'Skill',
        defaultOperator: 'isAnyOf',
        options: [...demoSkillOptions],
      }),
      filter.boolean('isActive', {
        label: 'Active',
      }),
      filter.number('salary', {
        label: 'Salary',
        operators: ['is', 'gte', 'lte', 'between'],
      }),
      filter.date('hiredAt', {
        label: 'Hired at',
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
      column.field('id', {
        label: 'ID',
        icon: 'i-lucide-hash',
        width: 200,
        ellipsis: true,
        render: ({ value }) => <span class="font-medium text-highlighted">{value}</span>,
      }),
      column.field('fullName', {
        label: 'Employee',
        icon: 'i-lucide-user-round',
        minWidth: 280,
        pinned: 'left',
        render: ({ row }) => {
          const employee = asEmployeeRow(row)
          const initials = getInitials(employee.fullName)
          const primarySkill = employee.employeeSkills[0]?.skill.label ?? 'Generalist'

          return (
            <div class="flex min-w-0 items-center gap-3">
              <div class="flex size-9 shrink-0 items-center justify-center rounded-full border border-default bg-elevated text-[11px] font-semibold text-highlighted">
                {initials}
              </div>
              <div class="min-w-0">
                <div class="truncate font-medium text-highlighted">{employee.fullName}</div>
                <div class="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted">
                  <UIcon name="i-lucide-sparkles" class="size-3 shrink-0" />
                  <span class="truncate">{primarySkill}</span>
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
          const employee = asEmployeeRow(row)

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
        minWidth: 240,
        sortableKey: 'fullName',
        render: ({ row }) => {
          const employee = asEmployeeRow(row)
          const skills = employee.employeeSkills
            .map((entry: DemoEmployeeSkill) => entry.skill.label)
            .slice(0, 3)
          const overflow = employee.employeeSkills.length - skills.length

          return (
            <div class="flex flex-wrap items-center gap-1.5">
              {skills.map((skill: string) => (
                <UBadge key={skill} color="neutral" variant="subtle" size="sm" label={skill} />
              ))}
              {overflow > 0 ? (
                <UBadge color="primary" variant="soft" size="sm" label={`+${overflow}`} />
              ) : null}
            </div>
          )
        },
      }),
      column.field('department.company.country', {
        label: 'Country',
        icon: 'i-lucide-globe',
        minWidth: 164,
        render: ({ value, row }) => {
          const employee = asEmployeeRow(row)

          return (
            <div class="flex items-center gap-2">
              <span class="text-base leading-none">{getCountryFlag(String(value ?? ''))}</span>
              <div class="min-w-0">
                <div class="truncate text-highlighted">{String(value ?? 'Unknown')}</div>
                <div class="truncate text-xs text-muted">
                  {employee.department?.company?.createdAt
                    ? formatJoined(employee.department.company.createdAt)
                    : 'N/A'}
                </div>
              </div>
            </div>
          )
        },
      }),
      column.field('department.company.name', {
        label: 'Company',
        icon: 'i-lucide-briefcase-business',
        minWidth: 220,
        render: ({ row }) => {
          const employee = asEmployeeRow(row)

          return (
            <div class="min-w-0">
              <div class="truncate font-medium text-highlighted">
                {employee.department?.company?.name ?? 'Independent'}
              </div>
              <div class="truncate text-xs text-muted">
                {employee.department?.name ?? 'No department'}
              </div>
            </div>
          )
        },
      }),
      column.field('department.name', {
        label: 'Department',
        icon: 'i-lucide-building-2',
        minWidth: 180,
        render: ({ row }) => {
          const employee = asEmployeeRow(row)

          return (
            <div class="flex items-center gap-2">
              <span class={getDepartmentDot(employee.department?.name)} />
              <span class="truncate text-highlighted">
                {employee.department?.name ?? 'Unassigned'}
              </span>
            </div>
          )
        },
      }),
      column.field('department.budget', {
        label: 'Dept. Budget',
        icon: 'i-lucide-landmark',
        align: 'right',
        labelAlign: 'right',
        minWidth: 176,
        render: ({ value }) => {
          const budget = typeof value === 'number' ? value : 0
          const intensity = Math.min(100, Math.round(budget / 2500))

          return (
            <div class="flex flex-col items-end gap-1">
              <span class="font-medium text-highlighted">{formatCurrency(budget)}</span>
              <div class="h-1.5 w-24 overflow-hidden rounded-full bg-elevated">
                <div
                  class="h-full rounded-full bg-primary/70 transition-[width]"
                  style={{ width: `${Math.max(12, intensity)}%` }}
                />
              </div>
            </div>
          )
        },
      }),
      column.field('isActive', {
        label: 'Active',
        icon: 'i-lucide-badge-check',
        minWidth: 132,
        maxWidth: 160,
        render: ({ row, value }) => {
          const employee = asEmployeeRow(row)
          const isActive = Boolean(value)

          return (
            <div class="flex items-center justify-start">
              <UBadge
                color={isActive ? 'success' : 'neutral'}
                variant={isActive ? 'soft' : 'subtle'}
                size="sm"
                label={isActive ? 'Online' : 'Paused'}
                icon={isActive ? 'i-lucide-circle-check-big' : 'i-lucide-moon-star'}
              />
              <span class="sr-only">{employee.fullName}</span>
            </div>
          )
        },
      }),
      column.field('hiredAt', {
        label: 'Joined',
        icon: 'i-lucide-calendar-days',
        minWidth: 170,
        maxWidth: 220,
        render: ({ value }) => {
          const joinedAt = asOptionalString(value)

          return (
            <div class="flex flex-col gap-1">
              <span class="text-highlighted">{formatJoined(joinedAt)}</span>
              <span class="text-xs text-muted">{formatRelativeTenure(joinedAt)}</span>
            </div>
          )
        },
      }),
      column.field('salary', {
        label: 'Salary',
        icon: 'i-lucide-wallet',
        align: 'right',
        labelAlign: 'right',
        minWidth: 156,
        maxWidth: 220,
        render: ({ row, value }) => {
          const employee = asEmployeeRow(row)
          const salary = typeof value === 'number' ? value : 0
          const budget = employee.department?.budget ?? 1
          const share = Math.max(6, Math.min(100, Math.round((salary / budget) * 100)))

          return (
            <div class="flex flex-col items-end gap-1">
              <span class="font-medium text-highlighted">{formatCurrency(salary)}</span>
              <div class="flex items-center gap-2 text-xs text-muted">
                <div class="h-1.5 w-16 overflow-hidden rounded-full bg-elevated">
                  <div
                    class="h-full rounded-full bg-primary/70 transition-[width]"
                    style={{ width: `${share}%` }}
                  />
                </div>
                <span>{Math.round(share)}%</span>
              </div>
            </div>
          )
        },
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

export const tablePlaygroundSummary = {
  builder: 'defineTableSchema',
  asyncContract: 'tanstack-query-only',
  sourceMode: tableSchema.source.mode,
  endpoint: demoEmployeesEndpoint,
  searchFields: tableSchema.filters?.search?.fields ?? [],
  filterKeys: tableSchema.filters?.ui?.map((filter) => filter.key),
  remote: true,
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatJoined(value: string | null | undefined) {
  if (!value) {
    return 'Unknown'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function formatRelativeTenure(value: string | null | undefined) {
  if (!value) {
    return 'No tenure data'
  }

  const joined = new Date(value)
  const months = Math.max(
    0,
    Math.round((Date.now() - joined.getTime()) / (1000 * 60 * 60 * 24 * 30.5)),
  )

  if (months < 12) {
    return `${months} mo tenure`
  }

  return `${(months / 12).toFixed(1)} yr tenure`
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

function getDepartmentDot(department: string | undefined) {
  const palette =
    department === 'Engineering'
      ? 'bg-sky-500/70'
      : department === 'Design'
        ? 'bg-pink-500/70'
        : department === 'Operations'
          ? 'bg-amber-500/70'
          : department === 'Sales'
            ? 'bg-emerald-500/70'
            : 'bg-primary/70'

  return `size-2 rounded-full ${palette}`
}

function asEmployeeRow(row: unknown) {
  return row as DemoEmployeeRow
}

function asOptionalString(value: unknown) {
  return typeof value === 'string' ? value : null
}
