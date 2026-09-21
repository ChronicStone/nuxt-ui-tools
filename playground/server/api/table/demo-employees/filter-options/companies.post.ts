import { asc, like } from 'drizzle-orm'

import { companies, db } from '../../../../utils/demo-employees-db'

interface CompanyOptionsBody {
  search?: string
  page: { index: number; size: number }
}

/** One page of company options for a search term, for the remote company filter. */
export default defineEventHandler(async (event) => {
  const body = await readBody<CompanyOptionsBody>(event)
  const size = Math.max(1, Math.min(100, body.page.size))
  const rows = await db
    .select({ id: companies.id, name: companies.name })
    .from(companies)
    .where(body.search ? like(companies.name, `%${body.search}%`) : undefined)
    .orderBy(asc(companies.name))
    .limit(size + 1)
    .offset((Math.max(1, body.page.index) - 1) * size)

  // Keep the playground honest about paging latency.
  await new Promise((resolve) => setTimeout(resolve, 250))

  return {
    hasMore: rows.length > size,
    options: rows.slice(0, size).map((row) => ({ label: row.name, value: row.id })),
  }
})
