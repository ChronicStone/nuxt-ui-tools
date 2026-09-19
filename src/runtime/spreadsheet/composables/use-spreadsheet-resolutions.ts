import { computed, shallowRef, watch } from 'vue'
import type { ComputedRef } from 'vue'

import type {
  SpreadsheetNormalizedSchema,
  SpreadsheetParsedRow,
  SpreadsheetRecord,
  SpreadsheetReferenceResolution,
} from '../types'
import {
  applySpreadsheetReferenceResolutions,
  createSpreadsheetReferenceQueryRequests,
  createSpreadsheetReferenceResolutions,
} from '../utils'

export interface UseSpreadsheetResolutionsParams {
  schema: ComputedRef<SpreadsheetNormalizedSchema>
  contextData: ComputedRef<SpreadsheetRecord>
  rows: ComputedRef<readonly SpreadsheetParsedRow<SpreadsheetRecord>[]>
}

function createResolutionId(resolution: SpreadsheetReferenceResolution) {
  return `${resolution.targetField ?? resolution.referenceField}::${resolution.sourceValue}`
}

export function useSpreadsheetResolutions(params: UseSpreadsheetResolutionsParams) {
  const resolutionDefinitions = computed(
    () => params.schema.value.resolutions ?? params.schema.value.references ?? [],
  )
  const autoResolutions = computed(() =>
    createSpreadsheetReferenceResolutions({
      context: params.contextData.value,
      references: resolutionDefinitions.value,
      rows: params.rows.value,
    }),
  )
  const manualSelections = shallowRef<Record<string, SpreadsheetReferenceResolution>>({})
  const resolutions = computed(() =>
    autoResolutions.value.map((resolution) => {
      const manual = manualSelections.value[createResolutionId(resolution)]
      return manual ?? resolution
    }),
  )
  const unresolvedResolutions = computed(() =>
    resolutions.value.filter((resolution) => resolution.status === 'unresolved'),
  )
  const resolvedRows = computed(() =>
    applySpreadsheetReferenceResolutions({
      references: resolutionDefinitions.value,
      relations: params.schema.value.relations,
      resolutions: resolutions.value,
      rows: params.rows.value,
    }),
  )
  const queryRequests = computed(() =>
    createSpreadsheetReferenceQueryRequests({
      context: params.contextData.value,
      references: resolutionDefinitions.value,
      rows: params.rows.value,
    }),
  )
  const status = computed(() => ({
    initialized: true,
    isReady: true,
    unresolvedCount: unresolvedResolutions.value.length,
  }))

  function selectResolution(selection: {
    resolutionField: string
    sourceValue: string
    selectedValue: unknown
    selectedLabel: string
  }) {
    const key = `${selection.resolutionField}::${selection.sourceValue}`
    const current = resolutions.value.find((resolution) => createResolutionId(resolution) === key)
    if (!current) {
      return
    }

    manualSelections.value = {
      ...manualSelections.value,
      [key]: {
        ...current,
        selectedLabel: selection.selectedLabel,
        selectedValue: selection.selectedValue,
        status: 'matched',
      },
    }
  }

  function clearResolution(selection: { resolutionField: string; sourceValue: string }) {
    const key = `${selection.resolutionField}::${selection.sourceValue}`
    const nextSelections = { ...manualSelections.value }
    delete nextSelections[key]
    manualSelections.value = nextSelections
  }

  watch(resolutionDefinitions, () => {
    manualSelections.value = {}
  })

  return {
    clearReference: (selection: { referenceField: string; sourceValue: string }) =>
      clearResolution({
        resolutionField: selection.referenceField,
        sourceValue: selection.sourceValue,
      }),
    clearResolution,
    queryRequests,
    referenceDefinitions: resolutionDefinitions,
    resolutionDefinitions,
    resolutions,
    resolvedRows,
    selectReference: (selection: {
      referenceField: string
      sourceValue: string
      selectedValue: unknown
      selectedLabel: string
    }) =>
      selectResolution({
        resolutionField: selection.referenceField,
        sourceValue: selection.sourceValue,
        selectedValue: selection.selectedValue,
        selectedLabel: selection.selectedLabel,
      }),
    selectResolution,
    status,
    unresolvedResolutions,
  }
}
