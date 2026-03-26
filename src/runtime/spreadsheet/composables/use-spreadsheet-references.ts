import { computed, shallowRef, watch, type ComputedRef } from 'vue'

import type {
  SpreadsheetNormalizedSchema,
  SpreadsheetParsedRow,
  SpreadsheetReferenceResolution,
} from '../types'
import {
  applySpreadsheetReferenceResolutions,
  createSpreadsheetReferenceQueryRequests,
  createSpreadsheetReferenceResolutions,
} from '../utils'

export interface UseSpreadsheetReferencesParams {
  schema: ComputedRef<SpreadsheetNormalizedSchema>
  contextData: ComputedRef<Record<string, unknown>>
  rows: ComputedRef<readonly SpreadsheetParsedRow<Record<string, unknown>>[]>
}

function createResolutionId(resolution: SpreadsheetReferenceResolution) {
  return `${resolution.referenceField}::${resolution.sourceValue}`
}

export function useSpreadsheetReferences(params: UseSpreadsheetReferencesParams) {
  const referenceDefinitions = computed(() => params.schema.value.references)
  const autoResolutions = computed(() =>
    createSpreadsheetReferenceResolutions({
      references: referenceDefinitions.value,
      rows: params.rows.value,
    }),
  )
  const manualSelections = shallowRef<Record<string, SpreadsheetReferenceResolution>>({})
  const resolutions = computed(() => {
    const entries = autoResolutions.value.map((resolution) => {
      const manual = manualSelections.value[createResolutionId(resolution)]
      return manual ?? resolution
    })

    return entries
  })
  const unresolvedResolutions = computed(() =>
    resolutions.value.filter((resolution) => resolution.status === 'unresolved'),
  )
  const resolvedRows = computed(() =>
    applySpreadsheetReferenceResolutions({
      rows: params.rows.value,
      resolutions: resolutions.value,
    }),
  )
  const queryRequests = computed(() =>
    createSpreadsheetReferenceQueryRequests({
      references: referenceDefinitions.value,
      rows: params.rows.value,
      context: params.contextData.value,
    }),
  )
  const status = computed(() => ({
    initialized: true,
    isReady: true,
    unresolvedCount: unresolvedResolutions.value.length,
  }))

  function selectReference(params: {
    referenceField: string
    sourceValue: string
    selectedValue: unknown
    selectedLabel: string
  }) {
    const key = `${params.referenceField}::${params.sourceValue}`
    const current = resolutions.value.find((resolution) => createResolutionId(resolution) === key)
    if (!current) return

    manualSelections.value = {
      ...manualSelections.value,
      [key]: {
        ...current,
        status: 'matched',
        selectedValue: params.selectedValue,
        selectedLabel: params.selectedLabel,
      },
    }
  }

  function clearReference(params: {
    referenceField: string
    sourceValue: string
  }) {
    const key = `${params.referenceField}::${params.sourceValue}`
    const nextSelections = { ...manualSelections.value }
    delete nextSelections[key]
    manualSelections.value = nextSelections
  }

  watch(referenceDefinitions, () => {
    manualSelections.value = {}
  })

  return {
    referenceDefinitions,
    resolutions,
    unresolvedResolutions,
    resolvedRows,
    queryRequests,
    status,
    selectReference,
    clearReference,
  }
}
