<script setup lang="ts">
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import { resolveTextValue } from '#ui-tools/shared/utils/render'
import type { SpreadsheetColumnAssignmentOption } from '../../types'
import type { SpreadsheetComponentApi } from '../types'
import SpreadsheetMatchingSummary from './matching/SpreadsheetMatchingSummary.vue'
import SpreadsheetMatchingTable from './matching/SpreadsheetMatchingTable.vue'

const props = defineProps<{
  spreadsheet: SpreadsheetComponentApi
}>()
const { t } = useUiToolsLocale()

const internals = props.spreadsheet.__internals

function getStaticColumnLabel(columnKey: string) {
  const column = internals.rows.staticColumns.value.find((entry) => entry.key === columnKey)
  if (!column) return columnKey
  return resolveTextValue(column.label, column.key)
}

const assignedStaticKeys = computed(() => new Set(
  internals.rows.columnMatches.value.map((match) => match.key),
))

const usedColumnIndexes = computed(() => new Set<number>([
  ...internals.rows.columnMatches.value.map((match) => match.columnIndex),
  ...internals.rows.dynamicColumnMatches.value.map((match) => match.columnIndex),
]))

const ignoredHeaderRows = computed(() =>
  props.spreadsheet.headerCells.value
    .filter((header) => !usedColumnIndexes.value.has(header.index))
    .map((header) => ({
      key: `ignored:${header.index}`,
      fileColumn: header.text || t('spreadsheet.steps.matching.columnFallback', { index: header.index + 1 }),
    })),
)

const expectedFieldRows = computed(() =>
  internals.rows.staticColumns.value.map((column) => {
    const match = internals.rows.columnMatches.value.find((entry) => entry.key === column.key)

    return {
      key: column.key,
      systemFieldKey: column.key,
      systemFieldLabel: getStaticColumnLabel(column.key),
      required: Boolean(column.required),
      selectedHeaderIndex: match?.columnIndex ?? null,
      selectedFileColumn: match?.header.text ?? '',
      status: match ? 'matched' as const : 'unmatched' as const,
    }
  }),
)

const autoMappedRows = computed(() =>
  internals.rows.dynamicColumnMatches.value.map((match) => ({
    key: `dynamic:${match.columnIndex}:${match.targetKey}`,
    systemFieldLabel: match.targetKey,
    selectedFileColumn: match.header.text,
  })),
)

const summaryItems = computed(() => [
  {
    key: 'matched',
    label: t('spreadsheet.steps.matching.matched'),
    value: expectedFieldRows.value.filter((row) => row.status === 'matched').length,
    tone: 'success' as const,
  },
  {
    key: 'unmatched',
    label: t('spreadsheet.steps.matching.missing'),
    value: internals.rows.unmatchedColumns.value.length,
    tone: 'error' as const,
  },
  {
    key: 'dynamic',
    label: t('spreadsheet.steps.matching.autoMapped'),
    value: autoMappedRows.value.length,
    tone: 'warning' as const,
  },
  {
    key: 'ignored',
    label: t('spreadsheet.steps.matching.ignored'),
    value: ignoredHeaderRows.value.length,
    tone: 'neutral' as const,
  },
])

function getOptionsForRow(row: { systemFieldKey: string, selectedHeaderIndex: number | null }) {
  return [
    ...props.spreadsheet.headerCells.value.map<SpreadsheetColumnAssignmentOption & { headerIndex: number }>((header) => {
      const selectedMatch = internals.rows.columnMatches.value.find((entry) => entry.key === row.systemFieldKey)
      const assignedMatch = internals.rows.columnMatches.value.find((entry) => entry.columnIndex === header.index)
      const assignedToOtherField = Boolean(assignedMatch && assignedMatch.key !== row.systemFieldKey)

      return {
        key: row.systemFieldKey,
        label: header.text || t('spreadsheet.steps.matching.columnFallback', { index: header.index + 1 }),
        assigned: assignedToOtherField,
        headerIndex: header.index,
        selected: selectedMatch?.columnIndex === header.index,
      }
    }),
    {
      key: '__ignore__',
      label: t('spreadsheet.steps.matching.ignoreField'),
      assigned: false,
      headerIndex: -1,
      selected: row.selectedHeaderIndex === null,
    },
  ]
    .sort((left, right) => {
      if ('selected' in left && 'selected' in right && left.selected !== right.selected)
        return Number(right.selected) - Number(left.selected)
      if (left.assigned !== right.assigned) return Number(left.assigned) - Number(right.assigned)
      return left.label.localeCompare(right.label)
    })
}
</script>

<template>
  <div class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
    <SpreadsheetMatchingSummary :items="summaryItems" />

    <SpreadsheetMatchingTable
      :expected-field-rows="expectedFieldRows"
      :auto-mapped-rows="autoMappedRows"
      :ignored-column-rows="ignoredHeaderRows"
      :get-options-for-row="getOptionsForRow"
      @assign="({ headerIndex, columnKey }) => {
        if (!columnKey)
          spreadsheet.clearColumnAssignment(headerIndex)
        else
          spreadsheet.assignColumn({ headerIndex, columnKey })
      }"
    />
  </div>
</template>
