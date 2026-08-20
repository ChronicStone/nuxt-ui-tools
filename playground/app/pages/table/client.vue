<script setup lang="tsx">
import { faker } from '@faker-js/faker'
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UCard from '@nuxt/ui/components/Card.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import {
  defineTableSchema,
  useTable,
  type TableFilterOptionEntry,
} from '#ui-tools/table'
import UiRowActions from '#ui-tools/table/components/actions/RowActions.vue'
import DataList from '#ui-tools/table/components/DataList.vue'

const { locale, t } = useI18n()
const clientRows = createClientRows(5000)
type DemoClientRow = (typeof clientRows)[number]
type DemoCompanySeed = {
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
      placeholder: () => t('playground.tableClient.searchPlaceholder'),
    },
    ui: (filter) => [
      filter.text('fullName', {
        label: () => t('playground.tableCommon.filters.name'),
        behavior: {
          operators: ['contains', 'is'],
        },
        display: {
          location: 'tag-dynamic',
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
            searchPlaceholder: () => t('playground.tableCommon.filters.selectCountries'),
          },
        },
      }),
      filter.option('skills', {
        label: () => t('playground.tableCommon.filters.skill'),
        behavior: {
          defaultOperator: 'isAnyOf',
        },
        display: {
          location: 'tag-dynamic',
        },
        source: {
          facet: 'exclude-self',
          options: skillOptions.map((value) => ({
            label: () => translateSkill(value),
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
        label: () => t('playground.tableClient.filters.skillTree'),
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
            searchPlaceholder: () => t('playground.tableClient.filters.selectSkillTaxonomy'),
          },
        },
      }),
      filter.option('department.name', {
        label: () => t('playground.tableCommon.filters.department'),
        behavior: {
          defaultOperator: 'isAnyOf',
        },
        display: {
          location: 'tag-dynamic',
        },
        source: {
          facet: 'exclude-self',
          options: departmentOptions.map((value) => ({
            label: () => translateDepartment(value),
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
        label: () => t('playground.tableCommon.filters.active'),
        display: {
          location: 'tag-dynamic',
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
            `${from == null ? t('playground.tableCommon.range.min') : formatCurrency(from)} - ${to == null ? t('playground.tableCommon.range.max') : formatCurrency(to)}`,
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
        preview: {
          label: () => t('playground.tableClient.preview.hired'),
          formatter: (value) => formatDate(value.toISOString()),
          rangeFormatter: ({ from, to }) =>
            [from, to]
              .filter((value): value is Date => value instanceof Date)
              .map((value) => formatDate(value.toISOString()))
              .join(' - '),
        },
      }),
    ],
  },
  rowActions: ({ row, tableApi, layout }) => [
    {
      key: 'copy-email',
      label: () => t('playground.tableClient.actions.copyEmail'),
      icon: 'i-lucide-copy',
      action: async () => {
        await navigator.clipboard.writeText(row.email)
      },
    },
    {
      key: row.isActive ? 'pause-employee' : 'resume-employee',
      label: () =>
        row.isActive
          ? t('playground.tableClient.actions.pauseEmployee')
          : t('playground.tableClient.actions.resumeEmployee'),
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
      label: () => t('playground.tableClient.actions.giveRaise'),
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
      label: () => t('playground.tableClient.actions.moreActions'),
      icon: 'i-lucide-ellipsis',
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
    },
    {
      key: 'table-only',
      label: () => t('playground.tableClient.actions.tableContextOnly'),
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
        label: () => t('playground.tableCommon.columns.email'),
        icon: 'i-lucide-at-sign',
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
        label: () => t('playground.tableCommon.columns.skills'),
        icon: 'i-lucide-tags',
        sortableKey: 'fullName',
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
      }),
      column.field('department.company.country', {
        label: () => t('playground.tableCommon.columns.country'),
        icon: 'i-lucide-globe',
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
        maxWidth: 150,
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
    mode: 'flow',
    gridSize: '1 md:2 lg:3 xl:4',
    renderItem: ({ row }) => (
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
        }}
      />
    ),
    defaultSorting: {
      key: 'fullName',
      dir: 'asc',
    },
  },
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
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function createClientRows(count: number) {
  faker.seed(42)

  const companies: DemoCompanySeed[] = [
    { name: 'Northstar', country: 'United States', region: 'North America' },
    { name: 'Atlas', country: 'Germany', region: 'Europe' },
    { name: 'Rivet', country: 'United Kingdom', region: 'Europe' },
    { name: 'Helio', country: 'Japan', region: 'Asia' },
    { name: 'Monarch', country: 'France', region: 'Europe' },
    { name: 'Vela', country: 'Canada', region: 'North America' },
    { name: 'Kumo', country: 'Singapore', region: 'Asia' },
    { name: 'Cinder', country: 'Spain', region: 'Europe' },
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
      email: faker.internet.email({
        firstName: fullName.split(' ')[0],
        lastName: fullName.split(' ').at(-1),
      }),
      salary,
      isActive,
      hiredAt,
      title: faker.person.jobTitle(),
      bio: faker.person.bio(),
      tenureYears: yearsAtCompany,
      profileAccent: faker.color.rgb({ prefix: '#' }),
      officeCity: city,
      officeTimezone: faker.location.timeZone(),
      employmentType: faker.helpers.arrayElement(employmentTypes),
      workMode: faker.helpers.arrayElement(workModes),
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
        highlightCatalog,
        faker.number.int({ min: 1, max: 3 }),
      ),
      primarySkill,
    }
  })
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

function getSkillTaxonomyValues(skill: string) {
  const entries = {
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
  } satisfies Record<string, string[]>

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
      label: () => translateRegion(region),
      children: [...countries]
        .sort((left, right) => left.localeCompare(right))
        .map((country) => ({
          label: () => translateCountry(country),
          value: country,
        })),
    })) satisfies ReadonlyArray<TableFilterOptionEntry<string>>
}

function buildSkillTreeOptions() {
  return [
    {
      label: () => translateCategory('Engineering'),
      value: 'cat:engineering',
      children: [
        {
          label: () => translateCategory('Application'),
          value: 'cat:application',
          children: [
            { label: () => translateSkill('GraphQL'), value: 'skill:graphql' },
            { label: () => translateSkill('TypeScript'), value: 'skill:typescript' },
          ],
        },
        {
          label: () => translateCategory('Infrastructure'),
          value: 'cat:infrastructure',
          children: [
            { label: () => translateSkill('Kubernetes'), value: 'skill:kubernetes' },
            { label: () => translateSkill('Terraform'), value: 'skill:terraform' },
            {
              label: () => translateSkill('Distributed Systems'),
              value: 'skill:distributed-systems',
            },
          ],
        },
        {
          label: () => translateCategory('Reliability'),
          value: 'cat:reliability',
          children: [
            { label: () => translateSkill('Incident Response'), value: 'skill:incident-response' },
            { label: () => translateSkill('Observability'), value: 'skill:observability' },
          ],
        },
        {
          label: () => translateCategory('Security'),
          value: 'cat:security',
          children: [{ label: () => translateSkill('Security'), value: 'skill:security' }],
        },
        {
          label: () => translateCategory('Services'),
          value: 'cat:services',
          children: [
            { label: () => translateSkill('Go'), value: 'skill:go' },
            { label: () => translateSkill('Rust'), value: 'skill:rust' },
          ],
        },
      ],
    },
    {
      label: () => translateCategory('Data'),
      value: 'cat:data',
      children: [
        {
          label: () => translateCategory('Analysis'),
          value: 'cat:analysis',
          children: [{ label: () => translateSkill('Python'), value: 'skill:python' }],
        },
        {
          label: () => translateCategory('Intelligence'),
          value: 'cat:intelligence',
          children: [
            { label: () => translateSkill('Machine Learning'), value: 'skill:machine-learning' },
          ],
        },
        {
          label: () => translateCategory('Platform'),
          value: 'cat:platform',
          children: [{ label: () => translateSkill('PostgreSQL'), value: 'skill:postgresql' }],
        },
      ],
    },
    {
      label: () => translateCategory('Design'),
      value: 'cat:design',
      children: [
        {
          label: () => translateCategory('Research'),
          value: 'cat:research',
          children: [{ label: () => translateSkill('UX Research'), value: 'skill:ux-research' }],
        },
        {
          label: () => translateCategory('Systems'),
          value: 'cat:systems',
          children: [
            { label: () => translateSkill('Design Systems'), value: 'skill:design-systems' },
          ],
        },
      ],
    },
    {
      label: () => translateCategory('Product'),
      value: 'cat:product',
      children: [
        {
          label: () => translateCategory('Planning'),
          value: 'cat:planning',
          children: [
            { label: () => translateSkill('Product Strategy'), value: 'skill:product-strategy' },
          ],
        },
      ],
    },
  ] satisfies ReadonlyArray<TableFilterOptionEntry<string>>
}

function getCountryFlag(country: string) {
  const flags = {
    France: '🇫🇷',
    Germany: '🇩🇪',
    Japan: '🇯🇵',
    'United Kingdom': '🇬🇧',
    'United States': '🇺🇸',
  }

  return flags[country] ?? '🌍'
}

function translateCountry(value: string) {
  const keyByCountry = {
    France: 'france',
    Germany: 'germany',
    Japan: 'japan',
    'United Kingdom': 'unitedKingdom',
    'United States': 'unitedStates',
    Canada: 'canada',
    Singapore: 'singapore',
    Spain: 'spain',
    Unknown: 'unknown',
  } satisfies Record<string, string>

  const key = keyByCountry[value]
  return key ? t(`playground.tableCommon.countries.${key}`) : value
}

function translateRegion(value: string) {
  const keyByRegion = {
    Europe: 'europe',
    'North America': 'northAmerica',
    Asia: 'asia',
  } satisfies Record<string, string>

  const key = keyByRegion[value]
  return key ? t(`playground.tableCommon.regions.${key}`) : value
}

function translateDepartment(value: string) {
  const keyByDepartment = {
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
  } satisfies Record<string, string>

  const key = keyByDepartment[value]
  return key ? t(`playground.tableCommon.departments.${key}`) : value
}

function translateCategory(value: string) {
  const keyByCategory = {
    Engineering: 'engineering',
    Application: 'application',
    Infrastructure: 'infrastructure',
    Reliability: 'reliability',
    Security: 'security',
    Services: 'services',
    Data: 'data',
    Analysis: 'analysis',
    Intelligence: 'intelligence',
    Platform: 'platform',
    Design: 'design',
    Research: 'research',
    Systems: 'systems',
    Product: 'product',
    Planning: 'planning',
  } satisfies Record<string, string>

  const key = keyByCategory[value]
  return key ? t(`playground.tableCommon.categories.${key}`) : value
}

function translateSkill(value: string) {
  const keyBySkill = {
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
  } satisfies Record<string, string>

  const key = keyBySkill[value]
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
