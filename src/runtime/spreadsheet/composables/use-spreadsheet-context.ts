import { useQueries } from '@tanstack/vue-query'
import { computed, type ComputedRef } from 'vue'

import type { SpreadsheetNormalizedSchema } from '../types'
import {
  type SpreadsheetContextQueryResult,
  createSpreadsheetContextData,
  createSpreadsheetContextQueries,
  createSpreadsheetContextStatus,
} from '../utils'

export interface UseSpreadsheetContextParams {
  schema: ComputedRef<SpreadsheetNormalizedSchema>
}

export function useSpreadsheetContext(params: UseSpreadsheetContextParams) {
  const contextItems = computed(() => params.schema.value.context)

  const context = useQueries({
    queries: () => createSpreadsheetContextQueries(contextItems.value),
    combine: (results: SpreadsheetContextQueryResult[]) =>
      results.map((result, index) => ({
        key: contextItems.value[index]?.key,
        ...result,
      })),
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
    contextItems,
    contextResults,
    contextData,
    status,
    error,
    refreshContext,
  }
}
