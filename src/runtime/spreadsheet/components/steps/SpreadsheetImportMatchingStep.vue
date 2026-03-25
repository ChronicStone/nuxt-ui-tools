<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import { computed } from 'vue'

import type { SpreadsheetColumnAssignmentOption } from '../../types'
import type { SpreadsheetComponentApi } from '../types'
import SpreadsheetMatchingSummary from './matching/SpreadsheetMatchingSummary.vue'
import SpreadsheetMatchingTable from './matching/SpreadsheetMatchingTable.vue'

const props = defineProps<{
  spreadsheet: SpreadsheetComponentApi
}>()

const internals = props.spreadsheet.__internals

function resolveLabel(value: string | (() => string | number) | undefined, fallback: string) {
  if (typeof value === 'function')
    return String(value())

  return value ?? fallback
}

function getStaticColumnLabel(columnKey: string) {
  const column = internals.rows.staticColumns.value.find((entry) => entry.key === columnKey)
  if (!column) return columnKey
  return resolveLabel(column.label, column.key)
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
      headerIndex: header.index,
      fileColumn: header.text || `Column ${header.index + 1}`,
      systemFieldKey: '',
      systemFieldLabel: '— Ignored',
      status: 'ignored' as const,
      locked: false,
      kind: 'ignored' as const,
    })),
)

const matchRows = computed(() => [
  ...internals.rows.columnMatches.value.map((match) => ({
    key: `static:${match.columnIndex}`,
    headerIndex: match.columnIndex,
    fileColumn: match.header.text,
    systemFieldKey: match.key,
    systemFieldLabel: getStaticColumnLabel(match.key),
    status: 'matched' as const,
    locked: false,
    kind: 'static' as const,
  })),
  ...internals.rows.dynamicColumnMatches.value.map((match) => ({
    key: `dynamic:${match.columnIndex}:${match.targetKey}`,
    headerIndex: match.columnIndex,
    fileColumn: match.header.text,
    systemFieldKey: '',
    systemFieldLabel: match.targetKey,
    status: 'matched' as const,
    locked: true,
    kind: 'dynamic' as const,
  })),
  ...ignoredHeaderRows.value,
])

const summaryItems = computed(() => [
  {
    key: 'matched',
    label: 'Matched',
    value: matchRows.value.filter((row) => row.status === 'matched').length,
    tone: 'success' as const,
  },
  {
    key: 'ambiguous',
    label: 'Ambiguous',
    value: 0,
    tone: 'warning' as const,
  },
  {
    key: 'unmatched',
    label: 'Unmatched',
    value: internals.rows.unmatchedColumns.value.length,
    tone: 'error' as const,
  },
  {
    key: 'ignored',
    label: 'Ignored',
    value: ignoredHeaderRows.value.length,
    tone: 'neutral' as const,
  },
])

function getOptionsForRow(row: { systemFieldKey: string }) {
  return internals.rows.staticColumns.value
    .map<SpreadsheetColumnAssignmentOption>((column) => ({
      key: column.key,
      label: getStaticColumnLabel(column.key),
      assigned: assignedStaticKeys.value.has(column.key) && column.key !== row.systemFieldKey,
    }))
    .sort((left, right) => {
      if (left.assigned !== right.assigned) return Number(left.assigned) - Number(right.assigned)
      return left.label.localeCompare(right.label)
    })
}
</script>

<template>
  <div class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
    <SpreadsheetMatchingSummary :items="summaryItems" />

    <SpreadsheetMatchingTable
      :rows="matchRows"
      :get-options-for-row="getOptionsForRow"
      @assign="spreadsheet.assignColumn"
    />
  </div>
</template>
