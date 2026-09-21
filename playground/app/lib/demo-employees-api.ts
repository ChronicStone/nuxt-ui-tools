import type { TableCursorPageResult, TableOffsetPageResult } from '#ui-tools/table'
import type {
  GenericObject,
  TableFacetExecutionResult,
  TableRemoteSourceRequest,
} from '#ui-tools/table/types'

export interface DemoCompany {
  id: string
  name: string
  country: string | null
  createdAt: string
}

export interface DemoDepartment {
  id: string
  companyId: string
  name: string
  budget: number | null
  company?: DemoCompany
}

export interface DemoSkill {
  id: string
  label: string
}

export interface DemoEmployeeSkill {
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

export type DemoEmployeesTableRequest = TableRemoteSourceRequest<GenericObject, string>

export type DemoEmployeesTableResponse =
  | TableOffsetPageResult<DemoEmployeeRow, string>
  | TableCursorPageResult<DemoEmployeeRow, string>

export interface FilterOptionsRequest {
  search?: string
  limit?: number
  cursor?: string
}

export interface FilterOptionsResponse {
  options: {
    value: string
    label: string
  }[]
  nextCursor?: string | null
  total?: number
}

export type DemoEmployeeFilterOptionsResource = 'companies' | 'departments' | 'skills'

export interface DemoCompanyOption {
  label: string
  value: string
}

export const demoEmployeesClient = {
  /** Remote company filter: paged options, labels of selected values, and page-scoped counts. */
  companyOptions: {
    page(request: { search: string; page: { index: number; size: number } }) {
      return $fetch<{ options: DemoCompanyOption[]; hasMore: boolean }>(
        '/api/table/demo-employees/filter-options/companies',
        { body: request, method: 'POST' },
      )
    },
    selected(values: readonly string[]) {
      return $fetch<DemoCompanyOption[]>(
        '/api/table/demo-employees/filter-options/companies-selected',
        { body: { values }, method: 'POST' },
      )
    },
    counts(request: {
      values: readonly string[]
      mode?: 'exclude-self' | 'include-self'
      filters: DemoEmployeesTableRequest['filters']
      search: DemoEmployeesTableRequest['search']
    }) {
      return $fetch<TableFacetExecutionResult<'department.company.id'>>(
        '/api/table/demo-employees/filter-options/companies-facets',
        { body: request, method: 'POST' },
      )
    },
  },
  filterOptions: {
    departments(options: { request: FilterOptionsRequest }) {
      return $fetch<FilterOptionsResponse>('/api/table/demo-employees/filter-options/departments', {
        body: options.request,
        method: 'POST',
      })
    },
    skills(options: { request: FilterOptionsRequest }) {
      return $fetch<FilterOptionsResponse>('/api/table/demo-employees/filter-options/skills', {
        body: options.request,
        method: 'POST',
      })
    },
  },
  queryTable(request: DemoEmployeesTableRequest) {
    return $fetch<DemoEmployeesTableResponse>('/api/table/demo-employees/query', {
      body: request,
      method: 'POST',
    })
  },
}
