import UBadge from '@nuxt/ui/components/Badge.vue'
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import { computed, ref, type ComputedRef, h } from 'vue'

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
    if (value === 'valid' || value === 'discarded') issueFilter.value = 'all'
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
    manuallyDiscardedRowIndexes.value = Array.from(
      new Set([...manuallyDiscardedRowIndexes.value, ...discardableIndexes]),
    )
    clearSelection()
  }

  function restoreSelectedRows() {
    manuallyDiscardedRowIndexes.value = manuallyDiscardedRowIndexes.value.filter(
      (index) => !selectedRowIndexes.value.includes(index),
    )
    clearSelection()
  }

  function discardRow(index: number) {
    if (isDiscarded(index)) return
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
      key: 'ready',
      value: validRows.value.length,
      label: t('spreadsheet.steps.review.ready'),
      hint: t('spreadsheet.steps.review.validRows', { count: validRows.value.length }),
      valueClass: 'text-success',
      accentClass: 'bg-success',
      cardClass: 'border-default/70',
    },
    {
      key: 'invalid',
      value: invalidRows.value.length,
      label: t('spreadsheet.steps.review.invalid', { count: invalidRows.value.length }),
      hint: invalidRows.value.length
        ? `${t('spreadsheet.steps.review.blocking', { count: blockingIssueCount.value })} · ${t('spreadsheet.steps.review.warnings', { count: warningIssueCount.value })}`
        : t('spreadsheet.steps.review.noBlockingIssues'),
      valueClass: 'text-error',
      accentClass: 'bg-error',
      cardClass: 'border-default/70',
    },
    {
      key: 'discarded',
      value: discardedRows.value.length,
      label: t('spreadsheet.steps.review.discarded', { count: discardedRows.value.length }),
      hint: discardedRows.value.length
        ? t('spreadsheet.steps.review.willNotBeImported')
        : t('spreadsheet.steps.review.nothingDiscarded'),
      valueClass: 'text-warning',
      accentClass: 'bg-warning',
      cardClass: discardedRows.value.length ? 'border-warning/40' : 'border-default/70',
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

    if (activeTab.value === 'valid' || activeTab.value === 'discarded') return baseRows
    if (issueFilter.value === 'blocking')
      return baseRows.filter((row) => hasBlockingIssue(row.issues))
    if (issueFilter.value === 'warning')
      return baseRows.filter((row) => !hasBlockingIssue(row.issues) && hasWarningIssue(row.issues))
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
    if (isDiscarded(index))
      return {
        label: t('spreadsheet.steps.review.discardedStatus'),
        color: 'neutral' as const,
        icon: 'i-lucide-ban',
      }

    if (hasBlockingIssue(issues))
      return {
        label: t('spreadsheet.steps.review.blockingStatus'),
        color: 'error' as const,
        icon: 'i-lucide-circle-x',
      }

    if (hasWarningIssue(issues))
      return {
        label: t('spreadsheet.steps.review.warningStatus'),
        color: 'warning' as const,
        icon: 'i-lucide-triangle-alert',
      }

    return {
      label: t('spreadsheet.steps.review.validStatus'),
      color: 'success' as const,
      icon: 'i-lucide-circle-check',
    }
  }

  function getIssueBadge(issue: SpreadsheetRowIssue) {
    if (issue.level === 'error')
      return { label: t('spreadsheet.steps.review.issueBadgeBlocking'), color: 'error' as const }

    return { label: t('spreadsheet.steps.review.issueBadgeWarning'), color: 'warning' as const }
  }

  function getIssueValueTone(issue: SpreadsheetRowIssue) {
    if (issue.level === 'error') return 'bg-error/6'
    return 'bg-warning/10'
  }

  function getIssueValue(rowData: SpreadsheetRecord, issue: SpreadsheetRowIssue) {
    if (!issue.columnKey) return t('spreadsheet.steps.review.noValue')
    return formatSpreadsheetCell(getSpreadsheetValueAtPath(rowData, issue.columnKey))
  }

  function getIssueRawValue(rowData: SpreadsheetRecord, issue: SpreadsheetRowIssue) {
    if (!issue.columnKey) return undefined
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
    if (isDiscarded(row.index)) return 'opacity-45'
    if (hasBlockingIssue(row.issues)) return 'bg-error/5'
    if (hasWarningIssue(row.issues)) return 'bg-warning/5'
    return ''
  }

  const reviewTableColumns = computed(() => [
    {
      id: 'select',
      header: () =>
        h('div', { class: 'flex justify-center' }, [
          h(UCheckbox, {
            modelValue: allVisibleSelected.value,
            'onUpdate:modelValue': selectAllVisible,
          }),
        ]),
      cell: ({ row }: { row: { original: { index: number } } }) =>
        h('div', { class: 'flex justify-center' }, [
          h(UCheckbox, {
            modelValue: rowSelection.value[String(row.original.index)] ?? false,
            disabled: isOverflowRow(row.original.index) && activeTab.value !== 'discarded',
            'onUpdate:modelValue': (value: SpreadsheetValue) => {
              rowSelection.value = {
                ...rowSelection.value,
                [String(row.original.index)]: value === true,
              }
            },
          }),
        ]),
      meta: {
        class: {
          th: 'w-12',
          td: 'w-12',
        },
      },
    },
    {
      id: 'row',
      header: t('spreadsheet.steps.review.row'),
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
              color: status.color,
              variant: 'soft',
              size: 'sm',
              icon: status.icon,
              class: 'font-medium',
            },
            () => statusLabel,
          ),
        ])
      },
      meta: {
        class: {
          th: 'w-44',
          td: 'w-44 align-top',
        },
      },
    },
    ...tableColumns.value.map((column: string) => ({
      id: column,
      header: humanizeSpreadsheetKey(column),
      accessorFn: (row: { data: SpreadsheetRecord }) =>
        formatSpreadsheetCell(getSpreadsheetValueAtPath(row.data, column)),
      cell: ({ row }: { row: { original: { data: SpreadsheetRecord } } }) =>
        h(SpreadsheetValuePreview, {
          value: getSpreadsheetValueAtPath(row.original.data, column),
          compact: true,
        }),
      meta: {
        class: {
          th: 'min-w-44',
          td: 'min-w-44 max-w-80 align-top text-toned',
        },
      },
    })),
  ])

  function inspectPrevIssueRow() {
    if (inspectedIssueRowPosition.value <= 0) return
    inspectedRowIndex.value = issueRows.value[inspectedIssueRowPosition.value - 1]?.index ?? null
  }

  function inspectNextIssueRow() {
    if (inspectedIssueRowPosition.value < 0) return
    inspectedRowIndex.value = issueRows.value[inspectedIssueRowPosition.value + 1]?.index ?? null
  }

  return {
    activeTab,
    issueFilter,
    inspectedRow,
    inspectedIssueRowPosition,
    issueRows,
    rowSelection,
    selectedRowIndexes,
    visibleRows,
    stats,
    hasOverflow,
    overflowCount,
    tabItems,
    issueFilterItems,
    canDiscardSelection,
    canRestoreSelection,
    reviewTableColumns,
    tableColumns,
    formatSpreadsheetCell,
    getSpreadsheetObjectEntries,
    humanizeSpreadsheetKey,
    getIssueBadge,
    getIssueValueTone,
    getIssueValue,
    getIssueRawValue,
    getRelatedIssueCount,
    getRowToneClass,
    getRowStatus,
    setActiveTab,
    setIssueFilter,
    discardSelectedRows,
    restoreSelectedRows,
    discardRow,
    restoreRow,
    inspectRow,
    closeInspection,
    inspectPrevIssueRow,
    inspectNextIssueRow,
    isDiscarded,
    isManuallyDiscarded,
  }
}
