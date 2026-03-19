import type { GenericObject } from '#ui-tools/table'

export interface DemoCompany extends GenericObject {
  id: string
  name: string
  country: string | null
  createdAt: string
}

export interface DemoDepartment extends GenericObject {
  id: string
  companyId: string
  name: string
  budget: number | null
  company?: DemoCompany
}

export interface DemoSkill extends GenericObject {
  id: string
  label: string
}

export interface DemoEmployeeSkill extends GenericObject {
  employeeId: string
  skillId: string
  skill: DemoSkill
}

export interface DemoEmployeeRow extends GenericObject {
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

export interface DemoEmployeesTableRequest {
  pagination: {
    pageIndex: number
    pageSize: number
  }
  sorting: Array<{
    key: string
    dir: 'asc' | 'desc'
  }>
  filters: Record<string, unknown>
  search: {
    value: string
    fields: string[]
  }
  context: Record<string, unknown>
}

export interface DemoEmployeesTableResponse<TRow> {
  rows: TRow[]
  rowCount: number
}

export interface FilterOptionsRequest {
  search?: string
  limit?: number
  cursor?: string
}

export interface FilterOptionsResponse {
  options: Array<{
    value: string
    label: string
  }>
  nextCursor?: string | null
  total?: number
}

export interface DemoEmployeesFacetsRequest {
  request: {
    pagination: {
      pageIndex: number
      pageSize: number
    }
    sorting: Array<{
      key: string
      dir: 'asc' | 'desc'
    }>
    filters: {
      type: 'group'
      combinator: 'and' | 'or'
      children: Array<any>
    }
    search: {
      value?: string
      fields?: string[]
    }
    context: Record<string, unknown>
  }
  facets: Array<{
    key: string
    mode?: 'exclude-self' | 'include-self'
    search?: string
    limit?: number
    cursor?: string
  }>
}

export interface DemoEmployeesFacetsResponse {
  facets: Array<{
    key: string
    options: Array<{
      value: unknown
      count: number
    }>
    nextCursor?: string | null
    total?: number
  }>
}

export type DemoEmployeeFilterOptionsResource = 'companies' | 'departments' | 'skills'

export const demoEmployeesClient = {
  queryTable<TRow>(options: { request: DemoEmployeesTableRequest }) {
    return $fetch<DemoEmployeesTableResponse<TRow>>('/api/table/demo-employees/query', {
      method: 'POST',
      body: options.request,
    })
  },
  filterOptions: {
    companies(options: { request: FilterOptionsRequest }) {
      return $fetch<FilterOptionsResponse>('/api/table/demo-employees/filter-options/companies', {
        method: 'POST',
        body: options.request,
      })
    },
    departments(options: { request: FilterOptionsRequest }) {
      return $fetch<FilterOptionsResponse>('/api/table/demo-employees/filter-options/departments', {
        method: 'POST',
        body: options.request,
      })
    },
    skills(options: { request: FilterOptionsRequest }) {
      return $fetch<FilterOptionsResponse>('/api/table/demo-employees/filter-options/skills', {
        method: 'POST',
        body: options.request,
      })
    },
  },
  queryFacets(options: { request: DemoEmployeesFacetsRequest }) {
    return $fetch<DemoEmployeesFacetsResponse>('/api/table/demo-employees/facets', {
      method: 'POST',
      body: options.request,
    })
  },
} as const
