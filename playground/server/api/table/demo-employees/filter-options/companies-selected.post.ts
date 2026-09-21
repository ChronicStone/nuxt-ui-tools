import { inArray } from 'drizzle-orm'

import { companies, db } from '../../../../utils/demo-employees-db'

/** Company options for selected ids, so filters restored from the URL show company names. */
export default defineEventHandler(async (event) => {
  const { values } = await readBody<{ values: string[] }>(event)
  if (!values.length) return []
  const rows = await db
    .select({ id: companies.id, name: companies.name })
    .from(companies)
    .where(inArray(companies.id, values))
  return rows.map((row) => ({ label: row.name, value: row.id }))
})
