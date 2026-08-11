<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UTable from '@nuxt/ui/components/Table.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import TableEmptyState from '../../../table/components/table/TableEmptyState.vue'
import { useSpreadsheetReview } from '../../composables/use-spreadsheet-review'
import type { SpreadsheetRowIssue } from '../../types'
import type { SpreadsheetComponentApi } from '../types'
import SpreadsheetReviewInspection from './review/SpreadsheetReviewInspection.vue'
import SpreadsheetReviewOverflowAlert from './review/SpreadsheetReviewOverflowAlert.vue'
import SpreadsheetReviewStats from './review/SpreadsheetReviewStats.vue'

const props = defineProps<{
  spreadsheet: SpreadsheetComponentApi
}>()
const { t } = useUiToolsLocale()

function getSchemaMaxRecords(schema: { importKey: string }): number | undefined {
  if (
    'file' in schema &&
    schema.file &&
    typeof schema.file === 'object' &&
    'maxRecords' in schema.file &&
    typeof schema.file.maxRecords === 'number'
  )
    return schema.file.maxRecords

  if (
    'source' in schema &&
    schema.source &&
    typeof schema.source === 'object' &&
    'maxRecords' in schema.source &&
    typeof schema.source.maxRecords === 'number'
  )
    return schema.source.maxRecords

  return undefined
}

const maxRecords = computed(() => getSchemaMaxRecords(props.spreadsheet.schema.value) ?? Infinity)
const review = useSpreadsheetReview({
  resolvedRows: computed(() => props.spreadsheet.resolvedRows.value),
  maxRecords,
})
const tableHasRows = computed(() => review.visibleRows.value.length > 0)

const summaryLimitText = computed(() => {
  if (!Number.isFinite(maxRecords.value)) return undefined
  return t('spreadsheet.steps.review.importLimit', {
    importable: Math.min(props.spreadsheet.resolvedRows.value.length, maxRecords.value),
    total: props.spreadsheet.resolvedRows.value.length,
  })
})

function showIssueRows() {
  review.setActiveTab('invalid')
  review.closeInspection()
}
</script>

<template>
  <div class="grid min-h-0 h-full gap-4">
    <SpreadsheetReviewOverflowAlert
      v-if="review.hasOverflow.value"
      :review-rows-length="props.spreadsheet.resolvedRows.value.length"
      :max-records="maxRecords"
      :overflow-count="review.overflowCount.value"
      @auto-trim="review.setActiveTab('discarded')"
    />

    <SpreadsheetReviewInspection
      v-if="review.inspectedRow.value"
      :inspected-row="review.inspectedRow.value"
      :table-columns="review.tableColumns.value"
      :issue-rows-length="review.issueRows.value.length"
      :inspected-issue-row-position="review.inspectedIssueRowPosition.value"
      :format-cell="review.formatSpreadsheetCell"
      :get-object-entries="review.getSpreadsheetObjectEntries"
      :humanize-key="review.humanizeSpreadsheetKey"
      :get-issue-badge="review.getIssueBadge"
      :get-issue-value-tone="review.getIssueValueTone"
      :get-issue-value="review.getIssueValue"
      :get-issue-raw-value="review.getIssueRawValue"
      :get-related-issue-count="review.getRelatedIssueCount"
      :is-discarded="review.isDiscarded"
      :is-manually-discarded="review.isManuallyDiscarded"
      @close="review.closeInspection"
      @prev="review.inspectPrevIssueRow"
      @next="review.inspectNextIssueRow"
      @discard-row="review.discardRow"
      @restore-row="review.restoreRow"
      @show-issue-rows="showIssueRows"
    />

    <div v-else class="grid min-h-0 h-full gap-4 grid-rows-[minmax(0,1fr)_auto]">
      <div
        class="grid min-h-0 h-full overflow-hidden rounded-[4px] border border-default/70 bg-default grid-rows-[auto_minmax(0,1fr)]"
      >
        <div class="grid gap-0">
          <div
            class="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-default/70 px-4"
          >
            <div class="flex min-w-0 items-center gap-1">
              <button
                v-for="item in review.tabItems.value"
                :key="item.key"
                type="button"
                class="h-10 border-b-2 px-3 text-[12px] font-medium transition-colors"
                :class="
                  review.activeTab.value === item.key
                    ? 'border-highlighted text-highlighted'
                    : 'border-transparent text-muted hover:text-toned'
                "
                @click="review.setActiveTab(item.key)"
              >
                {{ item.label }}
              </button>
            </div>

            <div class="flex flex-wrap items-center gap-1.5">
              <button
                v-for="item in review.issueFilterItems.value"
                :key="item.key"
                type="button"
                class="rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors"
                :class="
                  review.issueFilter.value === item.key
                    ? 'bg-elevated text-highlighted'
                    : 'text-muted hover:bg-elevated/60 hover:text-toned'
                "
                :disabled="
                  review.activeTab.value === 'valid' || review.activeTab.value === 'discarded'
                "
                @click="review.setIssueFilter(item.key)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>

          <div
            v-if="review.selectedRowIndexes.value.length"
            class="flex min-h-10 flex-wrap items-center gap-2 border-b border-default/70 bg-elevated/35 px-4 py-1.5"
          >
            <span class="font-mono text-[11px] text-muted">
              {{
                t('spreadsheet.steps.review.selected', {
                  count: review.selectedRowIndexes.value.length,
                })
              }}
            </span>
            <UButton
              color="error"
              variant="outline"
              size="xs"
              icon="i-lucide-trash-2"
              :label="t('spreadsheet.steps.review.discard')"
              :disabled="!review.canDiscardSelection.value"
              @click="review.discardSelectedRows"
            />
            <UButton
              color="neutral"
              variant="outline"
              size="xs"
              icon="i-lucide-undo-2"
              :label="t('spreadsheet.steps.review.restore')"
              :disabled="!review.canRestoreSelection.value"
              @click="review.restoreSelectedRows"
            />
          </div>
        </div>

        <div class="relative min-h-0 h-full overflow-hidden border-t border-default/70">
          <UTable
            :data="review.visibleRows.value"
            :columns="review.reviewTableColumns.value"
            :row-selection="review.rowSelection.value"
            :get-row-id="(row) => String(row.index)"
            sticky="header"
            class="h-full min-h-0"
            :on-select="(_event, row) => review.inspectRow(row.original.index)"
            :meta="{
              class: {
                tr: (row: {
                  original: { index: number; issues: readonly SpreadsheetRowIssue[] }
                }) => review.getRowToneClass(row.original),
              },
            }"
            :ui="{
              root: 'h-full overflow-auto',
              base: 'min-w-max',
              tr: 'cursor-pointer border-b border-default/40 text-[12px] transition-colors',
              td: 'px-3 py-2 align-middle',
              th: 'bg-elevated/45 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-muted',
            }"
            :virtualize="{ enabled: tableHasRows, overscan: 10, estimateSize: () => 41 }"
          />

          <div
            v-if="!tableHasRows"
            class="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-center"
            style="top: 2.625rem"
          >
            <TableEmptyState min-height="20rem" />
          </div>
        </div>
      </div>

      <SpreadsheetReviewStats :items="review.stats.value" :limit-text="summaryLimitText" />
    </div>
  </div>
</template>
