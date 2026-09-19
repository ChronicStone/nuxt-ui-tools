import UBadge from '@nuxt/ui/components/Badge.vue'
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import { computed, ref, h } from 'vue'
import type { ComputedRef } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import SpreadsheetValuePreview from '../components/shared/SpreadsheetValuePreview.vue'
import type {
  SpreadsheetRecord,
  SpreadsheetRowIssue,
  SpreadsheetResolvedReferenceRow,
  SpreadsheetValue,
} from '../types'
import { formatSpreadsheetCell, humanizeSpreadsheetKey } from '../utils/display'
import {
  getSpreadsheetLeafPaths,
  getSpreadsheetObjectEntries,
  getSpreadsheetValueAtPath,
} from '../utils/object'

export type SpreadsheetReviewTab = 'all' | 'valid' | 'invalid' | 'discarded'
export type SpreadsheetReviewIssueFilter = 'all' | 'blocking' | 'warning'

interface SpreadsheetReviewRow extends SpreadsheetResolvedReferenceRow<SpreadsheetRecord> {
  rowObject: SpreadsheetRecord
}

export interface UseSpreadsheetReviewParams {
  resolvedRows: ComputedRef<readonly SpreadsheetResolvedReferenceRow<SpreadsheetRecord>[]>
  maxRecords: ComputedRef<number>
}

export function useSpreadsheetReview(params: UseSpreadsheetReviewParams) {
  const { t } = useUiToolsLocale()
  const activeTab = ref<SpreadsheetReviewTab>('all')
  const issueFilter = ref<SpreadsheetReviewIssueFilter>('all')
  const inspectedRowIndex = ref<number | null>(null)
  const manuallyDiscardedRowIndexes = ref<number[]>([])
  const rowSelection = ref<Record<string, boolean>>({})

  function isOverflowRow(index: number) {
    return index >= params.maxRecords.value
  }

  function isManuallyDiscarded(index: number) {
    return manuallyDiscardedRowIndexes.value.includes(index)
  }

  function isDiscarded(index: number) {
    return isOverflowRow(index) || isManuallyDiscarded(index)
  }

  function hasBlockingIssue(issues: readonly SpreadsheetRowIssue[]) {
    return issues.some((issue) => issue.level === 'error')
  }

  function hasWarningIssue(issues: readonly SpreadsheetRowIssue[]) {
    return issues.some((issue) => issue.level === 'warning')
  }

  function clearSelection() {
    rowSelection.value = {}
  }

  function setActiveTab(value: SpreadsheetReviewTab) {
    activeTab.value = value
    clearSelection()
    if (value === 'valid' || value === 'discarded') {
      issueFilter.value = 'all'
    }
  }

  function setIssueFilter(value: SpreadsheetReviewIssueFilter) {
    issueFilter.value = value
    clearSelection()
  }

  function selectAllVisible(checked: SpreadsheetValue) {
    if (checked !== true) {
      clearSelection()
      return
    }

    rowSelection.value = Object.fromEntries(
      visibleRows.value
        .filter((row) => !isOverflowRow(row.index) || activeTab.value === 'discarded')
        .map((row) => [String(row.index), true]),
    )
  }

  function discardSelectedRows() {
    const discardableIndexes = selectedRowIndexes.value.filter((index) => !isDiscarded(index))
    manuallyDiscardedRowIndexes.value = [
      ...new Set([...manuallyDiscardedRowIndexes.value, ...discardableIndexes]),
    ]
    clearSelection()
  }

  function restoreSelectedRows() {
    manuallyDiscardedRowIndexes.value = manuallyDiscardedRowIndexes.value.filter(
      (index) => !selectedRowIndexes.value.includes(index),
    )
    clearSelection()
  }

  function discardRow(index: number) {
    if (isDiscarded(index)) {
      return
    }
    manuallyDiscardedRowIndexes.value = [...manuallyDiscardedRowIndexes.value, index]
  }

  function restoreRow(index: number) {
    manuallyDiscardedRowIndexes.value = manuallyDiscardedRowIndexes.value.filter(
      (value) => value !== index,
    )
  }

  function inspectRow(index: number) {
    inspectedRowIndex.value = index
  }

  function closeInspection() {
    inspectedRowIndex.value = null
  }

  const reviewRows = computed<SpreadsheetReviewRow[]>(() =>
    params.resolvedRows.value.map((row) => ({
      ...row,
      rowObject: Object.fromEntries(getSpreadsheetObjectEntries(row.data)),
    })),
  )
  const validRows = computed(() =>
    reviewRows.value.filter((row) => row.isValid && !isDiscarded(row.index)),
  )
  const invalidRows = computed(() =>
    reviewRows.value.filter((row) => !row.isValid && !isDiscarded(row.index)),
  )
  const discardedRows = computed(() => reviewRows.value.filter((row) => isDiscarded(row.index)))
  const issueRows = computed(() =>
    reviewRows.value.filter((row) => row.issues.length > 0 && !isDiscarded(row.index)),
  )
  const inspectedRow = computed(() =>
    inspectedRowIndex.value == null
      ? null
      : (reviewRows.value.find((row) => row.index === inspectedRowIndex.value) ?? null),
  )
  const inspectedIssueRowPosition = computed(() =>
    inspectedRow.value == null
      ? -1
      : issueRows.value.findIndex((row) => row.index === inspectedRow.value?.index),
  )
  const blockingIssueCount = computed(() =>
    invalidRows.value.reduce(
      (count, row) => count + row.issues.filter((issue) => issue.level === 'error').length,
      0,
    ),
  )
  const warningIssueCount = computed(() =>
    invalidRows.value.reduce(
      (count, row) => count + row.issues.filter((issue) => issue.level === 'warning').length,
      0,
    ),
  )
  const stats = computed(() => [
    {
      accentClass: 'bg-success',
      cardClass: 'border-default/70',
      hint: t('spreadsheet.steps.review.validRows', { count: validRows.value.length }),
      key: 'ready',
      label: t('spreadsheet.steps.review.ready'),
      value: validRows.value.length,
      valueClass: 'text-success',
    },
    {
      accentClass: 'bg-error',
      cardClass: 'border-default/70',
      hint: invalidRows.value.length
        ? `${t('spreadsheet.steps.review.blocking', { count: blockingIssueCount.value })} · ${t('spreadsheet.steps.review.warnings', { count: warningIssueCount.value })}`
        : t('spreadsheet.steps.review.noBlockingIssues'),
      key: 'invalid',
      label: t('spreadsheet.steps.review.invalid', { count: invalidRows.value.length }),
      value: invalidRows.value.length,
      valueClass: 'text-error',
    },
    {
      accentClass: 'bg-warning',
      cardClass: discardedRows.value.length ? 'border-warning/40' : 'border-default/70',
      hint: discardedRows.value.length
        ? t('spreadsheet.steps.review.willNotBeImported')
        : t('spreadsheet.steps.review.nothingDiscarded'),
      key: 'discarded',
      label: t('spreadsheet.steps.review.discarded', { count: discardedRows.value.length }),
      value: discardedRows.value.length,
      valueClass: 'text-warning',
    },
  ])
  const hasOverflow = computed(() => reviewRows.value.length > params.maxRecords.value)
  const overflowCount = computed(() =>
    hasOverflow.value ? reviewRows.value.length - params.maxRecords.value : 0,
  )
  const tabItems = computed(() => [
    {
      key: 'all' as const,
      label: t('spreadsheet.steps.review.allRows', { count: reviewRows.value.length }),
    },
    {
      key: 'valid' as const,
      label: t('spreadsheet.steps.review.valid', { count: validRows.value.length }),
    },
    {
      key: 'invalid' as const,
      label: t('spreadsheet.steps.review.invalid', { count: invalidRows.value.length }),
    },
    {
      key: 'discarded' as const,
      label: t('spreadsheet.steps.review.discarded', { count: discardedRows.value.length }),
    },
  ])
  const issueFilterItems = computed(() => [
    { key: 'all' as const, label: t('spreadsheet.steps.review.allIssues') },
    {
      key: 'blocking' as const,
      label: t('spreadsheet.steps.review.blocking', {
        count: invalidRows.value.filter((row) => hasBlockingIssue(row.issues)).length,
      }),
    },
    {
      key: 'warning' as const,
      label: t('spreadsheet.steps.review.warnings', {
        count: invalidRows.value.filter(
          (row) => !hasBlockingIssue(row.issues) && hasWarningIssue(row.issues),
        ).length,
      }),
    },
  ])
  const visibleRows = computed(() => {
    const baseRows =
      activeTab.value === 'valid'
        ? validRows.value
        : activeTab.value === 'invalid'
          ? invalidRows.value
          : activeTab.value === 'discarded'
            ? discardedRows.value
            : reviewRows.value

    if (activeTab.value === 'valid' || activeTab.value === 'discarded') {
      return baseRows
    }
    if (issueFilter.value === 'blocking') {
      return baseRows.filter((row) => hasBlockingIssue(row.issues))
    }
    if (issueFilter.value === 'warning') {
      return baseRows.filter((row) => !hasBlockingIssue(row.issues) && hasWarningIssue(row.issues))
    }
    return baseRows
  })
  const selectedRowIndexes = computed(() =>
    Object.entries(rowSelection.value)
      .filter(([, selected]) => selected)
      .map(([key]) => Number(key))
      .filter((index) => !Number.isNaN(index)),
  )
  const selectedRows = computed(() =>
    visibleRows.value.filter((row) => selectedRowIndexes.value.includes(row.index)),
  )
  const allVisibleSelected = computed(
    () =>
      visibleRows.value.length > 0 &&
      visibleRows.value
        .filter((row) => !isOverflowRow(row.index) || activeTab.value === 'discarded')
        .every((row) => rowSelection.value[String(row.index)]),
  )
  const canDiscardSelection = computed(() =>
    selectedRows.value.some((row) => !isDiscarded(row.index)),
  )
  const canRestoreSelection = computed(() =>
    selectedRows.value.some((row) => isManuallyDiscarded(row.index)),
  )
  const tableColumns = computed(() => {
    const sample = visibleRows.value[0]?.data ?? reviewRows.value[0]?.data ?? {}
    return getSpreadsheetLeafPaths(sample)
  })

  function getRowStatus(index: number, issues: readonly SpreadsheetRowIssue[]) {
    if (isDiscarded(index)) {
      return {
        color: 'neutral' as const,
        icon: 'i-lucide-ban',
        label: t('spreadsheet.steps.review.discardedStatus'),
      }
    }

    if (hasBlockingIssue(issues)) {
      return {
        color: 'error' as const,
        icon: 'i-lucide-circle-x',
        label: t('spreadsheet.steps.review.blockingStatus'),
      }
    }

    if (hasWarningIssue(issues)) {
      return {
        color: 'warning' as const,
        icon: 'i-lucide-triangle-alert',
        label: t('spreadsheet.steps.review.warningStatus'),
      }
    }

    return {
      color: 'success' as const,
      icon: 'i-lucide-circle-check',
      label: t('spreadsheet.steps.review.validStatus'),
    }
  }

  function getIssueBadge(issue: SpreadsheetRowIssue) {
    if (issue.level === 'error') {
      return { color: 'error' as const, label: t('spreadsheet.steps.review.issueBadgeBlocking') }
    }

    return { color: 'warning' as const, label: t('spreadsheet.steps.review.issueBadgeWarning') }
  }

  function getIssueValueTone(issue: SpreadsheetRowIssue) {
    if (issue.level === 'error') {
      return 'bg-error/6'
    }
    return 'bg-warning/10'
  }

  function getIssueValue(rowData: SpreadsheetRecord, issue: SpreadsheetRowIssue) {
    if (!issue.columnKey) {
      return t('spreadsheet.steps.review.noValue')
    }
    return formatSpreadsheetCell(getSpreadsheetValueAtPath(rowData, issue.columnKey))
  }

  function getIssueRawValue(rowData: SpreadsheetRecord, issue: SpreadsheetRowIssue) {
    if (!issue.columnKey) {
      return undefined
    }
    return getSpreadsheetValueAtPath(rowData, issue.columnKey)
  }

  function getRelatedIssueCount(issue: SpreadsheetRowIssue) {
    return issueRows.value.filter((row) =>
      row.issues.some(
        (candidate) =>
          candidate.code === issue.code &&
          candidate.columnKey === issue.columnKey &&
          candidate.message === issue.message,
      ),
    ).length
  }

  function getRowToneClass(row: { index: number; issues: readonly SpreadsheetRowIssue[] }) {
    if (isDiscarded(row.index)) {
      return 'opacity-45'
    }
    if (hasBlockingIssue(row.issues)) {
      return 'bg-error/5'
    }
    if (hasWarningIssue(row.issues)) {
      return 'bg-warning/5'
    }
    return ''
  }

  const reviewTableColumns = computed(() => [
    {
      cell: ({ row }: { row: { original: { index: number } } }) =>
        h('div', { class: 'flex justify-center' }, [
          h(UCheckbox, {
            disabled: isOverflowRow(row.original.index) && activeTab.value !== 'discarded',
            modelValue: rowSelection.value[String(row.original.index)] ?? false,
            'onUpdate:modelValue': (value: SpreadsheetValue) => {
              rowSelection.value = {
                ...rowSelection.value,
                [String(row.original.index)]: value === true,
              }
            },
          }),
        ]),
      header: () =>
        h('div', { class: 'flex justify-center' }, [
          h(UCheckbox, {
            modelValue: allVisibleSelected.value,
            'onUpdate:modelValue': selectAllVisible,
          }),
        ]),
      id: 'select',
      meta: {
        class: {
          td: 'w-12',
          th: 'w-12',
        },
      },
    },
    {
      accessorFn: (row: { index: number }) => row.index + 1,
      cell: ({
        row,
      }: {
        row: { original: { index: number; issues: readonly SpreadsheetRowIssue[] } }
      }) => {
        const status = getRowStatus(row.original.index, row.original.issues)
        const issueCount = row.original.issues.length
        const statusLabel = issueCount > 0 ? `${status.label} · ${issueCount}` : status.label

        return h('div', { class: 'flex items-center gap-2 whitespace-nowrap leading-none' }, [
          h('span', { class: 'font-mono text-xs text-muted' }, `#${row.original.index + 1}`),
          h(
            UBadge,
            {
              class: 'font-medium',
              color: status.color,
              icon: status.icon,
              size: 'sm',
              variant: 'soft',
            },
            () => statusLabel,
          ),
        ])
      },
      header: t('spreadsheet.steps.review.row'),
      id: 'row',
      meta: {
        class: {
          td: 'w-44 align-top',
          th: 'w-44',
        },
      },
    },
    ...tableColumns.value.map((column: string) => ({
      accessorFn: (row: { data: SpreadsheetRecord }) =>
        formatSpreadsheetCell(getSpreadsheetValueAtPath(row.data, column)),
      cell: ({ row }: { row: { original: { data: SpreadsheetRecord } } }) =>
        h(SpreadsheetValuePreview, {
          compact: true,
          value: getSpreadsheetValueAtPath(row.original.data, column),
        }),
      header: humanizeSpreadsheetKey(column),
      id: column,
      meta: {
        class: {
          td: 'min-w-44 max-w-80 align-top text-toned',
          th: 'min-w-44',
        },
      },
    })),
  ])

  function inspectPrevIssueRow() {
    if (inspectedIssueRowPosition.value <= 0) {
      return
    }
    inspectedRowIndex.value = issueRows.value[inspectedIssueRowPosition.value - 1]?.index ?? null
  }

  function inspectNextIssueRow() {
    if (inspectedIssueRowPosition.value < 0) {
      return
    }
    inspectedRowIndex.value = issueRows.value[inspectedIssueRowPosition.value + 1]?.index ?? null
  }

  return {
    activeTab,
    canDiscardSelection,
    canRestoreSelection,
    closeInspection,
    discardRow,
    discardSelectedRows,
    formatSpreadsheetCell,
    getIssueBadge,
    getIssueRawValue,
    getIssueValue,
    getIssueValueTone,
    getRelatedIssueCount,
    getRowStatus,
    getRowToneClass,
    getSpreadsheetObjectEntries,
    hasOverflow,
    humanizeSpreadsheetKey,
    inspectNextIssueRow,
    inspectPrevIssueRow,
    inspectRow,
    inspectedIssueRowPosition,
    inspectedRow,
    isDiscarded,
    isManuallyDiscarded,
    issueFilter,
    issueFilterItems,
    issueRows,
    overflowCount,
    restoreRow,
    restoreSelectedRows,
    reviewTableColumns,
    rowSelection,
    selectedRowIndexes,
    setActiveTab,
    setIssueFilter,
    stats,
    tabItems,
    tableColumns,
    visibleRows,
  }
}
