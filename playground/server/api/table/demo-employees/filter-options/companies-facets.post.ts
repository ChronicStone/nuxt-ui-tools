import type { QueryRequestInput } from 'drizzle-resource'

import { employeesResource } from '../../../../utils/demo-employees-db'

interface CompanyFacetsBody {
  /** Company ids to count: the options of one loaded page. */
  values: string[]
  mode?: 'exclude-self' | 'include-self'
  filters: QueryRequestInput['filters']
  search: QueryRequestInput['search']
}

const KEY = 'department.company.id'

/** One page of company buckets (the resource returns at most 50 per request). */
async function countCompanies(body: CompanyFacetsBody, cursor: string | null) {
  const result = await employeesResource.query({
    request: {
      facets: [{ cursor, key: KEY, limit: 50, mode: body.mode ?? 'exclude-self' }],
      filters: body.filters,
      pagination: { mode: 'offset', pageIndex: 1, pageSize: 1 },
      search: body.search,
      sorting: [],
    },
  })
  return result.facets?.find((facet) => facet.key === KEY)
}

/**
 * Employee counts of the requested companies under the table's current filters (without its own
 * company filter in `exclude-self` mode). The remote company filter asks one page at a time.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<CompanyFacetsBody>(event)
  const requested = new Set(body.values)
  const options: { value: unknown; count: number }[] = []
  // Follow the facet cursor through every bucket, keeping the requested companies.
  let cursor: string | null = null
  do {
    const facet = await countCompanies(body, cursor)
    options.push(...(facet?.options ?? []).filter((option) => requested.has(String(option.value))))
    cursor = facet?.nextCursor ?? null
  } while (cursor)

  return { facets: [{ key: KEY, options }] }
})
