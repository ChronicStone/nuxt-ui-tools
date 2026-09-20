import { useQueries } from '@tanstack/vue-query'
import { computed } from 'vue'
import type { ComputedRef } from 'vue'

import type { SpreadsheetNormalizedSchema } from '../types'
import {
  createSpreadsheetContextData,
  createSpreadsheetContextQueries,
  createSpreadsheetContextStatus,
} from '../utils'
import type { SpreadsheetContextQueryResult } from '../utils'

export interface UseSpreadsheetContextParams {
  schema: ComputedRef<SpreadsheetNormalizedSchema>
}

export function useSpreadsheetContext(params: UseSpreadsheetContextParams) {
  const contextItems = computed(() => params.schema.value.context)

  const context = useQueries({
    combine: (results: SpreadsheetContextQueryResult[]) =>
      results.map((result, index) => ({
        key: contextItems.value[index]?.key,
        ...result,
      })),
    queries: () => createSpreadsheetContextQueries(contextItems.value),
  })

  const contextResults = computed(() => context.value)

  const contextData = computed(() =>
    createSpreadsheetContextData(contextItems.value, contextResults.value),
  )

  const status = computed(() => createSpreadsheetContextStatus(contextResults.value))

  const error = computed(() => contextResults.value.find((result) => result.error)?.error)

  function refreshContext() {
    return Promise.all(contextResults.value.map((result) => result.refetch()))
  }

  return {
    context,
    contextData,
    contextItems,
    contextResults,
    error,
    refreshContext,
    status,
  }
}
