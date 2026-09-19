import type { TableCursorPageResult, TableOffsetPageResult } from '#ui-tools/table'
import type { GenericObject, TableSourceRequestContext } from '#ui-tools/table/types'

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

export type DemoEmployeesTableRequest = TableSourceRequestContext<
  DemoEmployeeRow,
  GenericObject,
  string
>

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

export const demoEmployeesClient = {
  filterOptions: {
    companies(options: { request: FilterOptionsRequest }) {
      return $fetch<FilterOptionsResponse>('/api/table/demo-employees/filter-options/companies', {
        body: options.request,
        method: 'POST',
      })
    },
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
