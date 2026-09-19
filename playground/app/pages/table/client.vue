<script setup lang="tsx">
import { faker } from '@faker-js/faker'
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UCard from '@nuxt/ui/components/Card.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import { hasProperty, isArray, isString, isNullish } from '#ui-tools/shared/utils/predicate'
import { defineTableSchema, useTable } from '#ui-tools/table'
import type { TableFilterOptionEntry } from '#ui-tools/table'
import UiRowActions from '#ui-tools/table/components/actions/RowActions.vue'
import DataList from '#ui-tools/table/components/DataList.vue'

const { locale, t } = useI18n()
const clientRows = createClientRows(5000)
type DemoClientRow = (typeof clientRows)[number]
interface DemoCompanySeed {
  name: string
  country: string
  region: string
}
type DemoDepartmentName =
  | 'Engineering'
  | 'Platform'
  | 'Operations'
  | 'Finance'
  | 'Product'
  | 'Design'
  | 'Security'
  | 'Data'
  | 'Support'
  | 'Growth'
type DemoSkillName =
  | 'TypeScript'
  | 'Go'
  | 'Kubernetes'
  | 'Security'
  | 'Distributed Systems'
  | 'Rust'
  | 'Python'
  | 'GraphQL'
  | 'PostgreSQL'
  | 'Machine Learning'
  | 'Design Systems'
  | 'Observability'
  | 'Terraform'
  | 'Incident Response'
  | 'Product Strategy'
  | 'UX Research'
type EmploymentType = 'Full-time' | 'Contract' | 'Part-time'
type WorkMode = 'Remote' | 'Hybrid' | 'On-site'

const skillOptions = [...new Set(clientRows.flatMap((row) => row.skills))].sort((left, right) =>
  left.localeCompare(right),
)
const departmentOptions = [...new Set(clientRows.map((row) => row.department.name))].sort(
  (left, right) => left.localeCompare(right),
)
const countryTreeOptions = buildCountryTreeOptions(clientRows)
const skillTreeOptions = buildSkillTreeOptions()

const clientSchema = defineTableSchema({
  defaultLayout: 'table',
  filters: {
    search: {
      fields: ['fullName', 'email', 'department.company.name', 'skills'],
      placeholder: () => t('playground.tableClient.searchPlaceholder'),
    },
    ui: (filter) => [
      filter.text('fullName', {
        behavior: {
          operators: ['contains', 'is'],
        },
        display: {
          location: 'tag-dynamic',
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
          location: 'tag-dynamic',
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
            selectable: 'leaf-only',
          },
        },
        label: () => t('playground.tableCommon.filters.country'),
        source: {
          facet: 'exclude-self',
          options: countryTreeOptions,
        },
      }),
      filter.option('skills', {
        behavior: {
          defaultOperator: 'isAnyOf',
        },
        display: {
          location: 'tag-dynamic',
        },
        editor: {
          row: {
            showCounts: true,
          },
        },
        label: () => t('playground.tableCommon.filters.skill'),
        source: {
          facet: 'exclude-self',
          options: skillOptions.map((value) => ({
            label: () => translateSkill(value),
            value,
          })),
        },
      }),
      filter.option('skillTaxonomy', {
        behavior: {
          defaultOperator: 'isAnyOf',
        },
        display: {
          location: 'tag-dynamic',
        },
        editor: {
          closeOnSelect: false,
          labels: {
            searchPlaceholder: () => t('playground.tableClient.filters.selectSkillTaxonomy'),
          },
          presentation: 'tree',
          row: {
            showCounts: true,
          },
          searchable: true,
          selection: {
            mode: 'multiple',
          },
          tree: {
            selectable: 'all',
          },
        },
        label: () => t('playground.tableClient.filters.skillTree'),
        source: {
          facet: 'exclude-self',
          options: skillTreeOptions,
        },
      }),
      filter.option('department.name', {
        behavior: {
          defaultOperator: 'isAnyOf',
        },
        display: {
          location: 'tag-dynamic',
        },
        editor: {
          searchable: false,
          selection: {
            mode: 'multiple',
          },
        },
        label: () => t('playground.tableCommon.filters.department'),
        source: {
          facet: 'exclude-self',
          options: departmentOptions.map((value) => ({
            label: () => translateDepartment(value),
            value,
          })),
        },
      }),
      filter.boolean('isActive', {
        display: {
          location: 'tag-dynamic',
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
          location: 'tag-dynamic',
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
        preview: {
          formatter: (value) => formatCurrency(value),
          rangeFormatter: ({ from, to }) =>
            `${isNullish(from) ? t('playground.tableCommon.range.min') : formatCurrency(from)} - ${isNullish(to) ? t('playground.tableCommon.range.max') : formatCurrency(to)}`,
        },
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
        preview: {
          formatter: (value) => formatDate(value.toISOString()),
          label: () => t('playground.tableClient.preview.hired'),
          rangeFormatter: ({ from, to }) =>
            [from, to]
              .filter((value): value is Date => value instanceof Date)
              .map((value) => formatDate(value.toISOString()))
              .join(' - '),
        },
      }),
    ],
  },
  grid: {
    defaultSorting: {
      dir: 'asc',
      key: 'fullName',
    },
    enabled: true,
    gridSize: '1 md:2 lg:3 xl:4',
    mode: 'flow',
    renderItem: ({ row }) => (
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
                  <div class="text-xs text-muted">{t('playground.tableCommon.cards.company')}</div>
                  <div class="truncate text-sm font-medium text-highlighted">
                    {row.department.company.name}
                  </div>
                </div>

                <div class="grid gap-1 rounded-md bg-elevated/60 p-2.5">
                  <div class="text-xs text-muted">{t('playground.tableCommon.cards.salary')}</div>
                  <div class="text-sm font-medium text-highlighted">
                    {formatCurrency(row.salary)}
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                {row.skills.slice(0, 4).map((skill) => (
                  <UBadge
                    key={skill}
                    color="neutral"
                    variant="subtle"
                    size="xs"
                    label={translateSkill(skill)}
                  />
                ))}
              </div>
            </>
          ),
          footer: () => (
            <div class="flex h-5 items-center justify-between gap-3 text-sm/5 text-muted">
              <div class="flex min-w-0 flex-1 items-center gap-2">
                <span class="inline-flex h-4 w-4 shrink-0 items-center justify-center text-sm leading-none">
                  {getCountryFlag(row.department.company.country)}
                </span>
                <span class="truncate">{translateCountry(row.department.company.country)}</span>
              </div>
              <div class="shrink-0">{formatDate(row.hiredAt)}</div>
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
                    <UIcon name="i-lucide-at-sign" class="size-3.5 shrink-0" />
                    <span class="truncate">{row.email}</span>
                  </div>
                </div>
              </div>
              <div class="flex shrink-0 items-start gap-2">
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
                <UiRowActions
                  content={{ align: 'end', side: 'bottom', sideOffset: 8 }}
                  modal={false}
                >
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
        }}
      />
    ),
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
      grid: [12, 24, 48, 96, 144, 192, 240, 480],
      table: [10, 20, 50, 100, 500, 1000],
    },
  },
  rowActions: ({ row, tableApi, layout }) => [
    {
      action: async () => {
        await navigator.clipboard.writeText(row.email)
      },
      icon: 'i-lucide-copy',
      key: 'copy-email',
      label: () => t('playground.tableClient.actions.copyEmail'),
    },
    {
      action: () => {
        tableApi.updateRow({
          ...row,
          isActive: !row.isActive,
        })
      },
      icon: row.isActive ? 'i-lucide-pause' : 'i-lucide-play',
      key: row.isActive ? 'pause-employee' : 'resume-employee',
      label: () =>
        row.isActive
          ? t('playground.tableClient.actions.pauseEmployee')
          : t('playground.tableClient.actions.resumeEmployee'),
    },
    {
      action: () => {
        tableApi.updateRow({
          ...row,
          salary: Math.min(row.salary + 5000, 200000),
        })
      },
      disabled: ({ row: currentRow }) => currentRow.salary >= 200000,
      icon: 'i-lucide-badge-dollar-sign',
      key: 'promote-salary',
      label: () => t('playground.tableClient.actions.giveRaise'),
    },
    {
      children: [
        {
          key: 'refresh',
          label: () => t('playground.tableClient.actions.refreshTable'),
          icon: 'i-lucide-refresh-cw',
          action: () => tableApi.refresh(),
        },
        {
          key: 'grid-only',
          label: () => t('playground.tableClient.actions.gridContextOnly'),
          icon: 'i-lucide-layout-grid',
          condition: ({ layout: currentLayout }) => currentLayout === 'grid',
        },
      ],
      icon: 'i-lucide-ellipsis',
      key: 'more',
      label: () => t('playground.tableClient.actions.moreActions'),
    },
    {
      condition: () => layout === 'table',
      icon: 'i-lucide-table-properties',
      key: 'table-only',
      label: () => t('playground.tableClient.actions.tableContextOnly'),
    },
  ],
  rowKey: 'id',
  selection: {
    mode: 'auto',
    scope: 'all',
  },
  source: {
    mode: 'client',
    query: () => ({
      queryFn: async () => {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        return clientRows
      },
      queryKey: ['demo-employees-client'],
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
              <div class="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                <UIcon name="i-lucide-sparkles" class="size-3 shrink-0" />
                <span class="truncate">
                  {row.skills[0]
                    ? translateSkill(row.skills[0])
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
              <span class="truncate">{row.department.company.name}</span>
            </div>
          </div>
        ),
      }),
      column.composite('skillsSummary', {
        icon: 'i-lucide-tags',
        label: () => t('playground.tableCommon.columns.skills'),
        minWidth: 230,
        render: ({ row }) => (
          <div class="flex flex-wrap gap-1.5">
            {row.skills.slice(0, 3).map((skill) => (
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
        maxWidth: 150,
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
  tableKey: 'demo-employees-client',
})

const table = useTable(clientSchema)
const { tableSize } = usePlaygroundShell()

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
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function createClientRows(count: number) {
  faker.seed(42)

  const companies: DemoCompanySeed[] = [
    { country: 'United States', name: 'Northstar', region: 'North America' },
    { country: 'Germany', name: 'Atlas', region: 'Europe' },
    { country: 'United Kingdom', name: 'Rivet', region: 'Europe' },
    { country: 'Japan', name: 'Helio', region: 'Asia' },
    { country: 'France', name: 'Monarch', region: 'Europe' },
    { country: 'Canada', name: 'Vela', region: 'North America' },
    { country: 'Singapore', name: 'Kumo', region: 'Asia' },
    { country: 'Spain', name: 'Cinder', region: 'Europe' },
  ]
  const departments: DemoDepartmentName[] = [
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
  ]
  const skillCatalog: DemoSkillName[] = [
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
  ]
  const salaryBaseByDepartment = {
    Data: 136000,
    Design: 110000,
    Engineering: 128000,
    Finance: 104000,
    Growth: 98000,
    Operations: 96000,
    Platform: 142000,
    Product: 118000,
    Security: 145000,
    Support: 82000,
  } satisfies Record<DemoDepartmentName, number>
  const employmentTypes: EmploymentType[] = ['Full-time', 'Contract', 'Part-time']
  const workModes: WorkMode[] = ['Remote', 'Hybrid', 'On-site']
  const highlightCatalog = [
    'Mentors onboarding cohorts',
    'Runs architecture reviews',
    'Owns reliability rotations',
    'Leads cross-functional planning',
    'Keeps customer escalations calm',
    'Improves release automation',
    'Builds internal tooling',
    'Shapes pricing experiments',
  ]

  return Array.from({ length: count }, (_, index) => {
    const company = faker.helpers.arrayElement(companies)
    const department = faker.helpers.arrayElement(departments)
    const fullName = faker.person.fullName()
    const skillCount = faker.number.int({ max: 5, min: 2 })
    const skills = faker.helpers.arrayElements(skillCatalog, skillCount)
    const primarySkill = skills[0] ?? 'Generalist'
    const yearsAtCompany = faker.number.int({ max: 9, min: 0 })
    const salaryNoise = faker.number.int({ max: 52000, min: -14000 })
    const salary = (salaryBaseByDepartment[department] ?? 100_000) + salaryNoise
    const hiredAt = faker.date
      .between({
        from: new Date(new Date().getFullYear() - 9, 0, 1),
        to: new Date(),
      })
      .toISOString()
    const isActive = faker.datatype.boolean({ probability: 0.8 })
    const city = faker.location.city()

    return {
      bio: faker.person.bio(),
      department: {
        budgetCode: faker.finance.accountNumber(6),
        company: {
          country: company.country,
          id: faker.string.uuid(),
          name: company.name,
        },
        id: faker.string.uuid(),
        name: department,
      },
      email: faker.internet.email({
        firstName: fullName.split(' ')[0],
        lastName: fullName.split(' ').at(-1),
      }),
      employmentType: faker.helpers.arrayElement(employmentTypes),
      fullName,
      highlights: faker.helpers.arrayElements(
        highlightCatalog,
        faker.number.int({ max: 3, min: 1 }),
      ),
      hiredAt,
      id: `client-${index + 1}`,
      isActive,
      officeCity: city,
      officeTimezone: faker.location.timeZone(),
      primarySkill,
      profileAccent: faker.color.rgb({ prefix: '#' }),
      region: company.region,
      salary,
      skillTaxonomy: [...new Set(skills.flatMap(getSkillTaxonomyValues))],
      skills,
      tenureYears: yearsAtCompany,
      title: faker.person.jobTitle(),
      workMode: faker.helpers.arrayElement(workModes),
    }
  })
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

function getSkillTaxonomyValues(skill: string) {
  const entries = {
    'Design Systems': ['cat:design', 'cat:systems', 'skill:design-systems'],
    'Distributed Systems': ['cat:engineering', 'cat:infrastructure', 'skill:distributed-systems'],
    Go: ['cat:engineering', 'cat:services', 'skill:go'],
    GraphQL: ['cat:engineering', 'cat:application', 'skill:graphql'],
    'Incident Response': ['cat:engineering', 'cat:reliability', 'skill:incident-response'],
    Kubernetes: ['cat:engineering', 'cat:infrastructure', 'skill:kubernetes'],
    'Machine Learning': ['cat:data', 'cat:intelligence', 'skill:machine-learning'],
    Observability: ['cat:engineering', 'cat:reliability', 'skill:observability'],
    PostgreSQL: ['cat:data', 'cat:platform', 'skill:postgresql'],
    'Product Strategy': ['cat:product', 'cat:planning', 'skill:product-strategy'],
    Python: ['cat:data', 'cat:analysis', 'skill:python'],
    Rust: ['cat:engineering', 'cat:systems', 'skill:rust'],
    Security: ['cat:engineering', 'cat:security', 'skill:security'],
    Terraform: ['cat:engineering', 'cat:infrastructure', 'skill:terraform'],
    TypeScript: ['cat:engineering', 'cat:application', 'skill:typescript'],
    'UX Research': ['cat:design', 'cat:research', 'skill:ux-research'],
  } satisfies Record<string, string[]>

  if (!hasProperty(entries, skill)) {
    return [skill]
  }
  const taxonomy = entries[skill]
  return isArray(taxonomy) ? taxonomy.filter(isString) : [skill]
}

function buildCountryTreeOptions(rows: DemoClientRow[]) {
  const countriesByRegion = rows.reduce<Record<string, Set<string>>>((acc, row) => {
    const { region } = row
    const bucket = acc[region] ?? new Set<string>()
    bucket.add(row.department.company.country)
    return { ...acc, [region]: bucket }
  }, {})

  return Object.entries(countriesByRegion)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([region, countries]) => ({
      children: [...countries]
        .sort((left, right) => left.localeCompare(right))
        .map((country) => ({
          label: () => translateCountry(country),
          value: country,
        })),
      label: () => translateRegion(region),
    })) satisfies readonly TableFilterOptionEntry<string>[]
}

function buildSkillTreeOptions() {
  return [
    {
      children: [
        {
          children: [
            { label: () => translateSkill('GraphQL'), value: 'skill:graphql' },
            { label: () => translateSkill('TypeScript'), value: 'skill:typescript' },
          ],
          label: () => translateCategory('Application'),
          value: 'cat:application',
        },
        {
          children: [
            { label: () => translateSkill('Kubernetes'), value: 'skill:kubernetes' },
            { label: () => translateSkill('Terraform'), value: 'skill:terraform' },
            {
              label: () => translateSkill('Distributed Systems'),
              value: 'skill:distributed-systems',
            },
          ],
          label: () => translateCategory('Infrastructure'),
          value: 'cat:infrastructure',
        },
        {
          children: [
            { label: () => translateSkill('Incident Response'), value: 'skill:incident-response' },
            { label: () => translateSkill('Observability'), value: 'skill:observability' },
          ],
          label: () => translateCategory('Reliability'),
          value: 'cat:reliability',
        },
        {
          children: [{ label: () => translateSkill('Security'), value: 'skill:security' }],
          label: () => translateCategory('Security'),
          value: 'cat:security',
        },
        {
          children: [
            { label: () => translateSkill('Go'), value: 'skill:go' },
            { label: () => translateSkill('Rust'), value: 'skill:rust' },
          ],
          label: () => translateCategory('Services'),
          value: 'cat:services',
        },
      ],
      label: () => translateCategory('Engineering'),
      value: 'cat:engineering',
    },
    {
      children: [
        {
          children: [{ label: () => translateSkill('Python'), value: 'skill:python' }],
          label: () => translateCategory('Analysis'),
          value: 'cat:analysis',
        },
        {
          children: [
            { label: () => translateSkill('Machine Learning'), value: 'skill:machine-learning' },
          ],
          label: () => translateCategory('Intelligence'),
          value: 'cat:intelligence',
        },
        {
          children: [{ label: () => translateSkill('PostgreSQL'), value: 'skill:postgresql' }],
          label: () => translateCategory('Platform'),
          value: 'cat:platform',
        },
      ],
      label: () => translateCategory('Data'),
      value: 'cat:data',
    },
    {
      children: [
        {
          children: [{ label: () => translateSkill('UX Research'), value: 'skill:ux-research' }],
          label: () => translateCategory('Research'),
          value: 'cat:research',
        },
        {
          children: [
            { label: () => translateSkill('Design Systems'), value: 'skill:design-systems' },
          ],
          label: () => translateCategory('Systems'),
          value: 'cat:systems',
        },
      ],
      label: () => translateCategory('Design'),
      value: 'cat:design',
    },
    {
      children: [
        {
          children: [
            { label: () => translateSkill('Product Strategy'), value: 'skill:product-strategy' },
          ],
          label: () => translateCategory('Planning'),
          value: 'cat:planning',
        },
      ],
      label: () => translateCategory('Product'),
      value: 'cat:product',
    },
  ] satisfies readonly TableFilterOptionEntry<string>[]
}

function getCountryFlag(country: string) {
  const flags = {
    France: '🇫🇷',
    Germany: '🇩🇪',
    Japan: '🇯🇵',
    'United Kingdom': '🇬🇧',
    'United States': '🇺🇸',
  }

  return hasProperty(flags, country) && isString(flags[country]) ? flags[country] : '🌍'
}

function translateCountry(value: string) {
  const keyByCountry = {
    Canada: 'canada',
    France: 'france',
    Germany: 'germany',
    Japan: 'japan',
    Singapore: 'singapore',
    Spain: 'spain',
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

function translateCategory(value: string) {
  const keyByCategory = {
    Analysis: 'analysis',
    Application: 'application',
    Data: 'data',
    Design: 'design',
    Engineering: 'engineering',
    Infrastructure: 'infrastructure',
    Intelligence: 'intelligence',
    Planning: 'planning',
    Platform: 'platform',
    Product: 'product',
    Reliability: 'reliability',
    Research: 'research',
    Security: 'security',
    Services: 'services',
    Systems: 'systems',
  } satisfies Record<string, string>

  const key = hasProperty(keyByCategory, value) ? keyByCategory[value] : undefined
  return key ? t(`playground.tableCommon.categories.${key}`) : value
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
      title="Client employees"
      description="Five thousand local rows exercising client filtering, faceting, sorting, and layouts."
    />
  </PlaygroundContent>
</template>
