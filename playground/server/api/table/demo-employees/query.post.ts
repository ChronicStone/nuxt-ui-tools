import type { QueryRequestInput } from 'drizzle-resource'

import { employeesResource } from '../../../utils/demo-employees-db'

export default defineEventHandler(async (event) => {
  const request = await readBody<QueryRequestInput>(event)
  const result = await employeesResource.query({ request })

  // Keep the local playground honest about background loading without needing a second service.
  await new Promise((resolve) => setTimeout(resolve, 450))

  return result
})
