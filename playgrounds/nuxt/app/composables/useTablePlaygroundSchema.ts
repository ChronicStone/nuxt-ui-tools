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

interface DemoEmployeeRow extends GenericObject {
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
      table: [10, 20, 50, 100],
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
      placeholder: 'Search employees, companies, or skills',
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
      column.field('fullName', {
        label: 'Employee',
        icon: 'i-lucide-user-round',
        minWidth: 240,
      }),
      column.field('email', {
        label: 'Email',
        icon: 'i-lucide-at-sign',
        minWidth: 260,
      }),
      column.field('department.company.country', {
        label: 'Country',
        icon: 'i-lucide-globe',
        minWidth: 160,
      }),
      column.field('department.name', {
        label: 'Department',
        icon: 'i-lucide-building-2',
        minWidth: 180,
      }),
      column.field('salary', {
        label: 'Salary',
        icon: 'i-lucide-wallet',
        align: 'right',
        labelAlign: 'right',
        minWidth: 150,
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
