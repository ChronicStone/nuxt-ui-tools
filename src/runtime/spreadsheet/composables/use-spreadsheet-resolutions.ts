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

export interface UseSpreadsheetResolutionsParams {
  schema: ComputedRef<SpreadsheetNormalizedSchema>
  contextData: ComputedRef<Record<string, unknown>>
  rows: ComputedRef<readonly SpreadsheetParsedRow<Record<string, unknown>>[]>
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
      references: resolutionDefinitions.value,
      rows: params.rows.value,
      context: params.contextData.value,
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
      rows: params.rows.value,
      references: resolutionDefinitions.value,
      resolutions: resolutions.value,
      relations: params.schema.value.relations,
    }),
  )
  const queryRequests = computed(() =>
    createSpreadsheetReferenceQueryRequests({
      references: resolutionDefinitions.value,
      rows: params.rows.value,
      context: params.contextData.value,
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
    if (!current) return

    manualSelections.value = {
      ...manualSelections.value,
      [key]: {
        ...current,
        status: 'matched',
        selectedValue: selection.selectedValue,
        selectedLabel: selection.selectedLabel,
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
    resolutionDefinitions,
    resolutions,
    unresolvedResolutions,
    resolvedRows,
    queryRequests,
    status,
    selectResolution,
    clearResolution,
    referenceDefinitions: resolutionDefinitions,
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
    clearReference: (selection: { referenceField: string; sourceValue: string }) =>
      clearResolution({
        resolutionField: selection.referenceField,
        sourceValue: selection.sourceValue,
      }),
  }
}
