<script setup lang="tsx">
import { faker } from '@faker-js/faker'
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UCard from '@nuxt/ui/components/Card.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import DataList from '#ui-tools/table/components/DataList.vue'
import UiRowActions from '#ui-tools/table/components/actions/RowActions.vue'
import { defineTableSchema, useTable, type TableFilterOptionEntry } from '#ui-tools/table'

const { classes } = usePlaygroundAppearance()

const clientRows = createClientRows(5000)
type DemoClientRow = (typeof clientRows)[number]

const skillOptions = [...new Set(clientRows.flatMap(row => row.skills))].sort((left, right) =>
  left.localeCompare(right),
)
const departmentOptions = [...new Set(clientRows.map(row => row.department.name))].sort((left, right) =>
  left.localeCompare(right),
)
const countryTreeOptions = buildCountryTreeOptions(clientRows)
const skillTreeOptions = buildSkillTreeOptions()

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
      grid: [12, 24, 48, 96, 144, 192, 240, 480],
    },
    showPageSizePicker: true,
    showPagesList: true,
    showPagesCount: true,
  },
  selection: {
    mode: 'auto',
    scope: 'all',
  },
  source: {
    mode: 'client',
    query: () => ({
      queryKey: ['demo-employees-client'],
      queryFn: async () => {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        return clientRows
      },
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
        behavior: {
          operators: ['contains', 'is'],
        },
        display: {
          location: 'tag-dynamic',
        },
        editor: {
          placeholder: 'Search employees',
          leadingIcon: 'i-lucide-search',
          inputType: 'search',
        },
      }),
      filter.option('department.company.country', {
        label: 'Country',
        behavior: {
          defaultOperator: 'isAnyOf',
        },
        display: {
          location: 'tag-dynamic',
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
          },
          selection: {
            mode: 'multiple',
          },
          labels: {
            searchPlaceholder: 'Select countries',
          },
        },
      }),
      filter.option('skills', {
        label: 'Skill',
        behavior: {
          defaultOperator: 'isAnyOf',
        },
        display: {
          location: 'tag-dynamic',
        },
        source: {
          facet: 'exclude-self',
          options: skillOptions.map((value) => ({
            label: value,
            value,
          })),
        },
        editor: {
          row: {
            showCounts: true,
          },
        },
      }),
      filter.option('skillTaxonomy', {
        label: 'Skill Tree',
        behavior: {
          defaultOperator: 'isAnyOf',
        },
        display: {
          location: 'tag-dynamic',
        },
        source: {
          facet: 'exclude-self',
          options: skillTreeOptions,
        },
        editor: {
          searchable: true,
          closeOnSelect: false,
          presentation: 'tree',
          tree: {
            selectable: 'all',
          },
          selection: {
            mode: 'multiple',
          },
          row: {
            showCounts: true,
          },
          labels: {
            searchPlaceholder: 'Select skill taxonomy',
          },
        },
      }),
      filter.option('department.name', {
        label: 'Department',
        behavior: {
          defaultOperator: 'isAnyOf',
        },
        display: {
          location: 'tag-dynamic',
        },
        source: {
          facet: 'exclude-self',
          options: departmentOptions.map((value) => ({
            label: value,
            value,
          })),
        },
        editor: {
          searchable: false,
          selection: {
            mode: 'multiple',
          },
        },
      }),
      filter.boolean('isActive', {
        label: 'Active',
        display: {
          location: 'tag-dynamic',
        },
        source: {
          facet: 'exclude-self',
        },
        editor: {
          labels: {
            true: 'Online',
            false: 'Paused',
          },
        },
      }),
      filter.number('salary', {
        label: 'Salary',
        behavior: {
          operators: ['is', 'gte', 'lte', 'between'],
        },
        display: {
          location: 'tag-dynamic',
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
        preview: {
          formatter: (value) => formatCurrency(value),
          rangeFormatter: ({ from, to }) =>
            `${from == null ? 'Min' : formatCurrency(from)} - ${to == null ? 'Max' : formatCurrency(to)}`,
        },
      }),
      filter.date('hiredAt', {
        label: 'Hired At',
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
        preview: {
          label: 'Hired',
          formatter: (value) => formatDate(value.toISOString()),
          rangeFormatter: ({ from, to }) =>
            [from, to]
              .filter((value): value is Date => value instanceof Date)
              .map(value => formatDate(value.toISOString()))
              .join(' - '),
        },
      }),
    ],
  },
  rowActions: ({ row, tableApi, layout }) => [
    {
      key: 'copy-email',
      label: 'Copy email',
      icon: 'i-lucide-copy',
      action: async () => {
        await navigator.clipboard.writeText(row.email)
      },
    },
    {
      key: row.isActive ? 'pause-employee' : 'resume-employee',
      label: row.isActive ? 'Pause employee' : 'Resume employee',
      icon: row.isActive ? 'i-lucide-pause' : 'i-lucide-play',
      action: () => {
        tableApi.updateRow({
          ...row,
          isActive: !row.isActive,
        })
      },
    },
    {
      key: 'promote-salary',
      label: 'Give raise',
      icon: 'i-lucide-badge-dollar-sign',
      disabled: ({ row: currentRow }) => currentRow.salary >= 200000,
      action: () => {
        tableApi.updateRow({
          ...row,
          salary: Math.min(row.salary + 5000, 200000),
        })
      },
    },
    {
      key: 'more',
      label: 'More actions',
      icon: 'i-lucide-ellipsis',
      children: [
        {
          key: 'refresh',
          label: 'Refresh table',
          icon: 'i-lucide-refresh-cw',
          action: () => tableApi.refresh(),
        },
        {
          key: 'grid-only',
          label: 'Grid context only',
          icon: 'i-lucide-layout-grid',
          condition: ({ layout: currentLayout }) => currentLayout === 'grid',
        },
      ],
    },
    {
      key: 'table-only',
      label: 'Table context only',
      icon: 'i-lucide-table-properties',
      condition: () => layout === 'table',
    },
  ],
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
          const employee = row

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
          const employee = row

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
          const employee = row

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
    mode: 'flow',
    gridSize: '1 md:2 lg:3 xl:4',
    renderItem: ({ row }) => {
      const employee = row

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
                      <UIcon name="i-lucide-at-sign" class="size-3.5 shrink-0" />
                      <span class="truncate">{employee.email}</span>
                    </div>
                  </div>
                </div>
                <div class="flex shrink-0 items-start gap-2">
                  <UBadge
                    color={employee.isActive ? 'success' : 'neutral'}
                    variant={employee.isActive ? 'soft' : 'subtle'}
                    size="sm"
                    label={employee.isActive ? 'Online' : 'Paused'}
                  />
                  <UiRowActions content={{ align: 'end', side: 'bottom', sideOffset: 8 }} modal={false}>
                    <UButton
                      color="neutral"
                      variant="ghost"
                      icon="i-lucide-ellipsis-vertical"
                      size="sm"
                      square
                    />
                  </UiRowActions>
                 </div>
              </div>
            ),
            default: () => (
              <>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="grid gap-1 rounded-md bg-elevated/60 p-2.5">
                    <div class="text-xs text-muted">Company</div>
                    <div class="truncate text-sm font-medium text-highlighted">
                      {employee.department.company.name}
                    </div>
                  </div>

                  <div class="grid gap-1 rounded-md bg-elevated/60 p-2.5">
                    <div class="text-xs text-muted">Salary</div>
                    <div class="text-sm font-medium text-highlighted">
                      {formatCurrency(employee.salary)}
                    </div>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2">
                  {employee.skills.slice(0, 4).map((skill) => (
                    <UBadge key={skill} color="neutral" variant="subtle" size="xs" label={skill} />
                  ))}
                </div>
              </>
            ),
            footer: () => (
              <div class="flex h-5 items-center justify-between gap-3 text-sm/5 text-muted">
                <div class="flex min-w-0 flex-1 items-center gap-2">
                  <span class="inline-flex h-4 w-4 shrink-0 items-center justify-center text-sm leading-none">
                    {getCountryFlag(employee.department.company.country)}
                  </span>
                  <span class="truncate">{employee.department.company.country}</span>
                </div>
                <div class="shrink-0">{formatDate(employee.hiredAt)}</div>
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

const table = useTable(clientSchema)


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



function createClientRows(count: number) {
  faker.seed(42)

  const companies = [
    { name: 'Northstar', country: 'United States', region: 'North America' },
    { name: 'Atlas', country: 'Germany', region: 'Europe' },
    { name: 'Rivet', country: 'United Kingdom', region: 'Europe' },
    { name: 'Helio', country: 'Japan', region: 'Asia' },
    { name: 'Monarch', country: 'France', region: 'Europe' },
    { name: 'Vela', country: 'Canada', region: 'North America' },
    { name: 'Kumo', country: 'Singapore', region: 'Asia' },
    { name: 'Cinder', country: 'Spain', region: 'Europe' },
  ] as const
  const departments = [
    'Engineering',
    'Platform',
    'Operations',
    'Finance',
    'Product',
    'Design',
    'Security',
    'Data',
    'Support',
    'Growth',
  ] as const
  const skillCatalog = [
    'TypeScript',
    'Go',
    'Kubernetes',
    'Security',
    'Distributed Systems',
    'Rust',
    'Python',
    'GraphQL',
    'PostgreSQL',
    'Machine Learning',
    'Design Systems',
    'Observability',
    'Terraform',
    'Incident Response',
    'Product Strategy',
    'UX Research',
  ] as const
  const salaryBaseByDepartment = {
    Engineering: 128000,
    Platform: 142000,
    Operations: 96000,
    Finance: 104000,
    Product: 118000,
    Design: 110000,
    Security: 145000,
    Data: 136000,
    Support: 82000,
    Growth: 98000,
  } as const

  return Array.from({ length: count }, (_, index) => {
    const company = faker.helpers.arrayElement(companies)
    const department = faker.helpers.arrayElement(departments)
    const fullName = faker.person.fullName()
    const skillCount = faker.number.int({ min: 2, max: 5 })
    const skills = faker.helpers.arrayElements(skillCatalog, skillCount)
    const primarySkill = skills[0] ?? 'Generalist'
    const yearsAtCompany = faker.number.int({ min: 0, max: 9 })
    const salaryNoise = faker.number.int({ min: -14000, max: 52000 })
    const salary = (salaryBaseByDepartment[department] ?? 100000) + salaryNoise
    const hiredAt = faker.date
      .between({
        from: new Date(new Date().getFullYear() - 9, 0, 1),
        to: new Date(),
      })
      .toISOString()
    const isActive = faker.datatype.boolean({ probability: 0.8 })
    const city = faker.location.city()

    return {
      id: `client-${index + 1}`,
      fullName,
      email: faker.internet.email({ firstName: fullName.split(' ')[0], lastName: fullName.split(' ').at(-1) }),
      salary,
      isActive,
      hiredAt,
      title: faker.person.jobTitle(),
      bio: faker.person.bio(),
      tenureYears: yearsAtCompany,
      profileAccent: faker.color.rgb({ prefix: '#' }),
      officeCity: city,
      officeTimezone: faker.location.timeZone(),
      employmentType: faker.helpers.arrayElement(['Full-time', 'Contract', 'Part-time'] as const),
      workMode: faker.helpers.arrayElement(['Remote', 'Hybrid', 'On-site'] as const),
      region: company.region,
      department: {
        id: faker.string.uuid(),
        name: department,
        budgetCode: faker.finance.accountNumber(6),
        company: {
          id: faker.string.uuid(),
          name: company.name,
          country: company.country,
        },
      },
      skills,
      skillTaxonomy: [...new Set(skills.flatMap(getSkillTaxonomyValues))],
      highlights: faker.helpers.arrayElements(
        [
          'Mentors onboarding cohorts',
          'Runs architecture reviews',
          'Owns reliability rotations',
          'Leads cross-functional planning',
          'Keeps customer escalations calm',
          'Improves release automation',
          'Builds internal tooling',
          'Shapes pricing experiments',
        ] as const,
        faker.number.int({ min: 1, max: 3 }),
      ),
      primarySkill,
    }
  })
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

function getSkillTaxonomyValues(skill: string) {
  const entries: Record<string, string[]> = {
    TypeScript: ['cat:engineering', 'cat:application', 'skill:typescript'],
    Go: ['cat:engineering', 'cat:services', 'skill:go'],
    Kubernetes: ['cat:engineering', 'cat:infrastructure', 'skill:kubernetes'],
    'Distributed Systems': ['cat:engineering', 'cat:infrastructure', 'skill:distributed-systems'],
    Security: ['cat:engineering', 'cat:security', 'skill:security'],
    Rust: ['cat:engineering', 'cat:systems', 'skill:rust'],
    Python: ['cat:data', 'cat:analysis', 'skill:python'],
    GraphQL: ['cat:engineering', 'cat:application', 'skill:graphql'],
    PostgreSQL: ['cat:data', 'cat:platform', 'skill:postgresql'],
    'Machine Learning': ['cat:data', 'cat:intelligence', 'skill:machine-learning'],
    'Design Systems': ['cat:design', 'cat:systems', 'skill:design-systems'],
    Observability: ['cat:engineering', 'cat:reliability', 'skill:observability'],
    Terraform: ['cat:engineering', 'cat:infrastructure', 'skill:terraform'],
    'Incident Response': ['cat:engineering', 'cat:reliability', 'skill:incident-response'],
    'Product Strategy': ['cat:product', 'cat:planning', 'skill:product-strategy'],
    'UX Research': ['cat:design', 'cat:research', 'skill:ux-research'],
  }

  return entries[skill] ?? [skill]
}

function buildCountryTreeOptions(rows: DemoClientRow[]) {
  const countriesByRegion = rows.reduce<Record<string, Set<string>>>((acc, row) => {
    const region = row.region
    const bucket = acc[region] ?? new Set<string>()
    bucket.add(row.department.company.country)
    return { ...acc, [region]: bucket }
  }, {})

  return Object.entries(countriesByRegion)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([region, countries]) => ({
      label: region,
      children: [...countries]
        .sort((left, right) => left.localeCompare(right))
        .map((country) => ({
          label: country,
          value: country,
        })),
    })) satisfies ReadonlyArray<TableFilterOptionEntry<string>>
}

function buildSkillTreeOptions() {
  return [
    {
      label: 'Engineering',
      value: 'cat:engineering',
      children: [
        {
          label: 'Application',
          value: 'cat:application',
          children: [
            { label: 'GraphQL', value: 'skill:graphql' },
            { label: 'TypeScript', value: 'skill:typescript' },
          ],
        },
        {
          label: 'Infrastructure',
          value: 'cat:infrastructure',
          children: [
            { label: 'Kubernetes', value: 'skill:kubernetes' },
            { label: 'Terraform', value: 'skill:terraform' },
            { label: 'Distributed Systems', value: 'skill:distributed-systems' },
          ],
        },
        {
          label: 'Reliability',
          value: 'cat:reliability',
          children: [
            { label: 'Incident Response', value: 'skill:incident-response' },
            { label: 'Observability', value: 'skill:observability' },
          ],
        },
        {
          label: 'Security',
          value: 'cat:security',
          children: [
            { label: 'Security', value: 'skill:security' },
          ],
        },
        {
          label: 'Services',
          value: 'cat:services',
          children: [
            { label: 'Go', value: 'skill:go' },
            { label: 'Rust', value: 'skill:rust' },
          ],
        },
      ],
    },
    {
      label: 'Data',
      value: 'cat:data',
      children: [
        {
          label: 'Analysis',
          value: 'cat:analysis',
          children: [
            { label: 'Python', value: 'skill:python' },
          ],
        },
        {
          label: 'Intelligence',
          value: 'cat:intelligence',
          children: [
            { label: 'Machine Learning', value: 'skill:machine-learning' },
          ],
        },
        {
          label: 'Platform',
          value: 'cat:platform',
          children: [
            { label: 'PostgreSQL', value: 'skill:postgresql' },
          ],
        },
      ],
    },
    {
      label: 'Design',
      value: 'cat:design',
      children: [
        {
          label: 'Research',
          value: 'cat:research',
          children: [
            { label: 'UX Research', value: 'skill:ux-research' },
          ],
        },
        {
          label: 'Systems',
          value: 'cat:systems',
          children: [
            { label: 'Design Systems', value: 'skill:design-systems' },
          ],
        },
      ],
    },
    {
      label: 'Product',
      value: 'cat:product',
      children: [
        {
          label: 'Planning',
          value: 'cat:planning',
          children: [
            { label: 'Product Strategy', value: 'skill:product-strategy' },
          ],
        },
      ],
    },
  ] satisfies ReadonlyArray<TableFilterOptionEntry<string>>
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
