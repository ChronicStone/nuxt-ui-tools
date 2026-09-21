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

/**
 * Employee counts of the requested companies under the table's current filters (without its own
 * company filter in `exclude-self` mode). The remote company filter asks one page at a time.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<CompanyFacetsBody>(event)
  const requested = new Set(body.values)
  const options: { value: unknown; count: number }[] = []
  // The resource returns at most 50 buckets per request: follow its cursor through all of them.
  let cursor: string | null | undefined = null
  do {
    const result = await employeesResource.query({
      request: {
        facets: [{ cursor, key: KEY, limit: 50, mode: body.mode ?? 'exclude-self' }],
        filters: body.filters,
        pagination: { mode: 'offset', pageIndex: 1, pageSize: 1 },
        search: body.search,
        sorting: [],
      },
    })
    const facet = result.facets?.find((entry) => entry.key === KEY)
    options.push(...(facet?.options ?? []).filter((option) => requested.has(String(option.value))))
    cursor = facet?.nextCursor
  } while (cursor)

  return { facets: [{ key: KEY, options }] }
})
