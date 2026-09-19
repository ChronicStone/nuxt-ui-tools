<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type {
  SpreadsheetReferenceCandidate,
  SpreadsheetReferenceResolution,
  SpreadsheetValue,
} from '../../types'
import {
  humanizeSpreadsheetKey,
  resolveSpreadsheetDisplayLabel,
  snakeCaseSpreadsheetKey,
} from '../../utils/display'
import type { SpreadsheetComponentApi } from '../types'
import SpreadsheetReferencesAccordion from './references/SpreadsheetReferencesAccordion.vue'
import SpreadsheetReferencesSummary from './references/SpreadsheetReferencesSummary.vue'

const props = defineProps<{
  spreadsheet: SpreadsheetComponentApi
}>()

const internals = props.spreadsheet.__internals
const expandedResolutionKey = ref<string | undefined>(undefined)

function getSourceLabel(sourceField: string) {
  const staticColumn = internals.rows.staticColumns.value.find(
    (column) => column.key === sourceField,
  )
  if (staticColumn) {
    return resolveSpreadsheetDisplayLabel(
      staticColumn.label,
      humanizeSpreadsheetKey(staticColumn.key),
    )
  }

  return humanizeSpreadsheetKey(sourceField)
}

function getOutputLabel(outputField: string) {
  return snakeCaseSpreadsheetKey(outputField)
}

function getBestScore(candidates: readonly SpreadsheetReferenceCandidate[]) {
  if (!candidates.length) {
    return null
  }
  return Math.round(Math.max(...candidates.map((candidate) => candidate.score)) * 100)
}

function getRowCountLabel(count: number) {
  return `${count} row${count === 1 ? '' : 's'}`
}

function getSelectItems(resolution: SpreadsheetReferenceResolution) {
  const recommendedOptions = resolution.candidates
    .filter((candidate) => candidate.score > 0)
    .map((candidate) => ({
      description: `${Math.round(candidate.score * 100)}% match`,
      kind: 'option' as const,
      label: candidate.label,
      value: candidate.value,
    }))
  const remainingOptions = resolution.candidates
    .filter((candidate) => candidate.score <= 0)
    .map((candidate) => ({
      kind: 'option' as const,
      label: candidate.label,
      value: candidate.value,
    }))

  return [
    ...recommendedOptions,
    ...(recommendedOptions.length && remainingOptions.length
      ? [
          {
            disabled: true,
            kind: 'divider' as const,
            label: 'Other options',
          },
        ]
      : []),
    ...(recommendedOptions.length
      ? remainingOptions
      : resolution.candidates.map((candidate) => ({
          description:
            candidate.score > 0 ? `${Math.round(candidate.score * 100)}% match` : undefined,
          kind: 'option' as const,
          label: candidate.label,
          value: candidate.value,
        }))),
  ]
}

const groupedColumns = computed(() => {
  const groups = new Map<string, SpreadsheetReferenceResolution[]>()

  for (const resolution of props.spreadsheet.referenceResolutions.value) {
    const group = groups.get(resolution.referenceField) ?? []
    groups.set(resolution.referenceField, [...group, resolution])
  }

  return [...groups.entries()].map(([referenceField, items]) => {
    const sourceField = items[0]?.sourceField ?? referenceField
    const outputField = items[0]?.outputField ?? referenceField
    const resolvedCount = items.filter((item) => item.status === 'matched').length
    const unresolvedCount = items.length - resolvedCount

    return {
      items,
      outputField,
      outputLabel: getOutputLabel(outputField),
      progressWidth: `${Math.max(0, Math.min(100, items.length ? (resolvedCount / items.length) * 100 : 0))}%`,
      resolutionKey: referenceField,
      resolvedCount,
      sourceField,
      sourceLabel: getSourceLabel(sourceField),
      unresolvedCount,
    }
  })
})

const summaryItems = computed(() => [
  {
    barClass: 'bg-muted',
    key: 'groups',
    label: 'Columns to reconcile',
    value: groupedColumns.value.length,
  },
  {
    barClass: 'bg-success',
    key: 'resolved',
    label: 'Values resolved',
    value: props.spreadsheet.referenceResolutions.value.filter(
      (resolution) => resolution.status === 'matched',
    ).length,
  },
  {
    barClass: 'bg-warning',
    key: 'unresolved',
    label: 'Values to resolve',
    value: props.spreadsheet.unresolvedReferenceResolutions.value.length,
  },
  {
    barClass: 'bg-muted',
    key: 'rows',
    label: 'Total rows',
    value: props.spreadsheet.rowSummary.value.totalRows,
  },
])

const unresolvedGroupKeys = computed(() =>
  groupedColumns.value
    .filter((group) => group.unresolvedCount > 0)
    .map((group) => group.resolutionKey),
)

function getNextExpandableKey(currentKey: string) {
  const currentIndex = groupedColumns.value.findIndex((group) => group.resolutionKey === currentKey)
  if (currentIndex === -1) {
    return unresolvedGroupKeys.value[0] ?? groupedColumns.value[0]?.resolutionKey
  }

  for (let index = currentIndex + 1; index < groupedColumns.value.length; index += 1) {
    const nextGroup = groupedColumns.value[index]
    if (nextGroup?.unresolvedCount) {
      return nextGroup.resolutionKey
    }
  }

  return unresolvedGroupKeys.value[0] ?? currentKey
}

watch(
  groupedColumns,
  (nextGroups, previousGroups) => {
    if (!nextGroups.length) {
      expandedResolutionKey.value = undefined
      return
    }

    if (!expandedResolutionKey.value) {
      expandedResolutionKey.value = unresolvedGroupKeys.value[0] ?? nextGroups[0]?.resolutionKey
      return
    }

    const currentGroup = nextGroups.find(
      (group) => group.resolutionKey === expandedResolutionKey.value,
    )
    if (!currentGroup) {
      expandedResolutionKey.value = unresolvedGroupKeys.value[0] ?? nextGroups[0]?.resolutionKey
      return
    }

    const previousGroup = previousGroups?.find(
      (group) => group.resolutionKey === expandedResolutionKey.value,
    )
    if (!previousGroup) {
      return
    }
    if (!previousGroup.unresolvedCount || currentGroup.unresolvedCount) {
      return
    }

    expandedResolutionKey.value = getNextExpandableKey(currentGroup.resolutionKey)
  },
  {
    immediate: true,
  },
)

function getMetaTone(resolution: SpreadsheetReferenceResolution) {
  if (resolution.status === 'matched') {
    return null
  }

  const bestScore = getBestScore(resolution.candidates)
  if (bestScore === null) {
    return { label: 'No options available', class: 'text-error' }
  }
  if (bestScore === 0) {
    return null
  }

  return { class: 'text-warning', label: `Best match: ${bestScore}%` }
}

function getResolutionBadge(resolution: SpreadsheetReferenceResolution) {
  if (resolution.status === 'matched') {
    return { label: 'Resolved', color: 'success' as const }
  }

  const bestScore = getBestScore(resolution.candidates)
  if (bestScore === null) {
    return { label: 'No options', color: 'error' as const }
  }

  return { color: 'warning' as const, label: 'Needs review' }
}

function handleSelect(resolution: SpreadsheetReferenceResolution, value: SpreadsheetValue) {
  const candidate = resolution.candidates.find((entry) => entry.value === value)
  if (!candidate) {
    return
  }

  props.spreadsheet.selectReference({
    referenceField: resolution.referenceField,
    selectedLabel: candidate.label,
    selectedValue: candidate.value,
    sourceValue: resolution.sourceValue,
  })
}
</script>

<template>
  <div class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-6">
    <div class="grid gap-6">
      <SpreadsheetReferencesSummary :items="summaryItems" />

      <SpreadsheetReferencesAccordion
        v-model="expandedResolutionKey"
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
