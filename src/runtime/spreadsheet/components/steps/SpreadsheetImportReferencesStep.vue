<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { SpreadsheetReferenceCandidate, SpreadsheetReferenceResolution } from '../../types'
import type { SpreadsheetComponentApi } from '../types'
import { humanizeSpreadsheetKey, resolveSpreadsheetDisplayLabel, snakeCaseSpreadsheetKey } from '../../utils/display'
import SpreadsheetReferencesAccordion from './references/SpreadsheetReferencesAccordion.vue'
import SpreadsheetReferencesSummary from './references/SpreadsheetReferencesSummary.vue'

const props = defineProps<{
  spreadsheet: SpreadsheetComponentApi
}>()

const internals = props.spreadsheet.__internals
const expandedReferenceKey = ref<string | undefined>(undefined)

function getSourceLabel(sourceField: string) {
  const staticColumn = internals.rows.staticColumns.value.find(column => column.key === sourceField)
  if (staticColumn)
    return resolveSpreadsheetDisplayLabel(staticColumn.label, humanizeSpreadsheetKey(staticColumn.key))

  return humanizeSpreadsheetKey(sourceField)
}

function getOutputLabel(outputField: string) {
  return snakeCaseSpreadsheetKey(outputField)
}

function getBestScore(candidates: readonly SpreadsheetReferenceCandidate[]) {
  if (!candidates.length) return null
  return Math.round(Math.max(...candidates.map(candidate => candidate.score)) * 100)
}

function getRowCountLabel(count: number) {
  return `${count} row${count === 1 ? '' : 's'}`
}

function getSelectItems(resolution: SpreadsheetReferenceResolution) {
  return resolution.candidates.map(candidate => ({
    value: candidate.value,
    label: candidate.label,
    description: `Score ${Math.round(candidate.score * 100)}%`,
  }))
}

const groupedColumns = computed(() => {
  const groups = new Map<string, SpreadsheetReferenceResolution[]>()

  for (const resolution of props.spreadsheet.referenceResolutions.value) {
    const group = groups.get(resolution.referenceKey) ?? []
    groups.set(resolution.referenceKey, [...group, resolution])
  }

  return Array.from(groups.entries()).map(([referenceKey, items]) => {
    const sourceField = items[0]?.sourceField ?? referenceKey
    const outputField = items[0]?.outputField ?? referenceKey
    const resolvedCount = items.filter(item => item.status === 'matched').length
    const unresolvedCount = items.length - resolvedCount

    return {
      referenceKey,
      sourceField,
      outputField,
      sourceLabel: getSourceLabel(sourceField),
      outputLabel: getOutputLabel(outputField),
      resolvedCount,
      unresolvedCount,
      progressWidth: `${Math.max(0, Math.min(100, items.length ? (resolvedCount / items.length) * 100 : 0))}%`,
      items,
    }
  })
})

const summaryItems = computed(() => [
  {
    key: 'groups',
    label: 'Columns to reconcile',
    value: groupedColumns.value.length,
    barClass: 'bg-muted',
  },
  {
    key: 'resolved',
    label: 'Values resolved',
    value: props.spreadsheet.referenceResolutions.value.filter(resolution => resolution.status === 'matched').length,
    barClass: 'bg-success',
  },
  {
    key: 'unresolved',
    label: 'Values to resolve',
    value: props.spreadsheet.unresolvedReferenceResolutions.value.length,
    barClass: 'bg-warning',
  },
  {
    key: 'rows',
    label: 'Total rows',
    value: props.spreadsheet.rowSummary.value.totalRows,
    barClass: 'bg-muted',
  },
])

const unresolvedGroupKeys = computed(() =>
  groupedColumns.value
    .filter(group => group.unresolvedCount > 0)
    .map(group => group.referenceKey),
)

function getNextExpandableKey(currentKey: string) {
  const currentIndex = groupedColumns.value.findIndex(group => group.referenceKey === currentKey)
  if (currentIndex < 0)
    return unresolvedGroupKeys.value[0] ?? groupedColumns.value[0]?.referenceKey

  for (let index = currentIndex + 1; index < groupedColumns.value.length; index += 1) {
    const nextGroup = groupedColumns.value[index]
    if (nextGroup?.unresolvedCount)
      return nextGroup.referenceKey
  }

  return unresolvedGroupKeys.value[0] ?? currentKey
}

watch(
  groupedColumns,
  (nextGroups, previousGroups) => {
    if (!nextGroups.length) {
      expandedReferenceKey.value = undefined
      return
    }

    if (!expandedReferenceKey.value) {
      expandedReferenceKey.value = unresolvedGroupKeys.value[0] ?? nextGroups[0]?.referenceKey
      return
    }

    const currentGroup = nextGroups.find(group => group.referenceKey === expandedReferenceKey.value)
    if (!currentGroup) {
      expandedReferenceKey.value = unresolvedGroupKeys.value[0] ?? nextGroups[0]?.referenceKey
      return
    }

    const previousGroup = previousGroups?.find(group => group.referenceKey === expandedReferenceKey.value)
    if (!previousGroup) return
    if (!previousGroup.unresolvedCount || currentGroup.unresolvedCount) return

    expandedReferenceKey.value = getNextExpandableKey(currentGroup.referenceKey)
  },
  {
    immediate: true,
  },
)

function getMetaTone(resolution: SpreadsheetReferenceResolution) {
  if (resolution.status === 'matched') return null

  const bestScore = getBestScore(resolution.candidates)
  if (bestScore === null) return { label: 'No match found', class: 'text-error' }

  return { label: `Best match: ${bestScore}%`, class: 'text-warning' }
}

function getResolutionBadge(resolution: SpreadsheetReferenceResolution) {
  if (resolution.status === 'matched')
    return { label: 'Resolved', color: 'success' as const }

  return getBestScore(resolution.candidates) === null
    ? { label: 'No match', color: 'error' as const }
    : { label: 'Needs review', color: 'warning' as const }
}

function handleSelect(resolution: SpreadsheetReferenceResolution, value: unknown) {
  const candidate = resolution.candidates.find(entry => entry.value === value)
  if (!candidate) return

  props.spreadsheet.selectReference({
    referenceKey: resolution.referenceKey,
    sourceValue: resolution.sourceValue,
    selectedValue: candidate.value,
    selectedLabel: candidate.label,
  })
}
</script>

<template>
  <div class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-6">
    <div class="grid gap-6">
      <SpreadsheetReferencesSummary :items="summaryItems" />

      <SpreadsheetReferencesAccordion
        v-model="expandedReferenceKey"
        :groups="groupedColumns"
        :get-select-items="getSelectItems"
        :get-resolution-badge="getResolutionBadge"
        :get-meta-tone="getMetaTone"
        :get-row-count-label="getRowCountLabel"
        @select="({ resolution, value }) => handleSelect(resolution, value)"
      />
    </div>
  </div>
</template>
