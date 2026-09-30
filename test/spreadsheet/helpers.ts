import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createApp, effectScope, nextTick } from 'vue'
import { utils, write } from 'xlsx'

/** Runs a composable factory inside an app with TanStack Query, like a component setup. */
export function mountSpreadsheet<TValue>(factory: () => TValue) {
  const app = createApp({})
  app.use(VueQueryPlugin, { queryClient: new QueryClient() })
  const scope = effectScope()
  const value = app.runWithContext(() => scope.run(factory))
  if (value === undefined) throw new Error('The factory returned nothing')
  return { stop: () => scope.stop(), value }
}

/** An xlsx file with the given sheets. */
export function createWorkbookFile(
  sheets: Readonly<Record<string, readonly (readonly unknown[])[]>>,
) {
  const workbook = utils.book_new()
  for (const [name, rows] of Object.entries(sheets))
    utils.book_append_sheet(workbook, utils.aoa_to_sheet(rows.map((row) => [...row])), name)
  const binary: ArrayBuffer = write(workbook, { bookType: 'xlsx', type: 'array' })
  return binary
}

export async function settle(rounds = 6) {
  for (let index = 0; index < rounds; index += 1) {
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}
