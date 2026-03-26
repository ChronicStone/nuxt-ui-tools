<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UTable from '@nuxt/ui/components/Table.vue'
import { computed } from 'vue'

import { useSpreadsheetReview } from '../../composables/use-spreadsheet-review'
import type { SpreadsheetRowIssue } from '../../types'
import type { SpreadsheetComponentApi } from '../types'
import SpreadsheetReviewInspection from './review/SpreadsheetReviewInspection.vue'
import SpreadsheetReviewOverflowAlert from './review/SpreadsheetReviewOverflowAlert.vue'
import SpreadsheetReviewStats from './review/SpreadsheetReviewStats.vue'

const props = defineProps<{
  spreadsheet: SpreadsheetComponentApi
}>()

function getSchemaMaxRecords(schema: { importKey: string }): number | undefined {
  if (
    'file' in schema
    && schema.file
    && typeof schema.file === 'object'
    && 'maxRecords' in schema.file
    && typeof schema.file.maxRecords === 'number'
  )
    return schema.file.maxRecords

  if (
    'source' in schema
    && schema.source
    && typeof schema.source === 'object'
    && 'maxRecords' in schema.source
    && typeof schema.source.maxRecords === 'number'
  )
    return schema.source.maxRecords

  return undefined
}

const maxRecords = computed(() => getSchemaMaxRecords(props.spreadsheet.schema.value) ?? Infinity)
const review = useSpreadsheetReview({
  resolvedRows: computed(() => props.spreadsheet.resolvedRows.value),
  maxRecords,
})
</script>

<template>
  <div class="grid gap-5" :class="review.inspectedRow.value ? '' : 'grid-rows-[auto_auto_minmax(0,1fr)] min-h-full'">
    <SpreadsheetReviewOverflowAlert
      v-if="review.hasOverflow.value"
      :review-rows-length="props.spreadsheet.resolvedRows.value.length"
      :max-records="maxRecords"
      :overflow-count="review.overflowCount.value"
      @auto-trim="review.setActiveTab('discarded')"
    />

    <SpreadsheetReviewStats :items="review.stats.value" />

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
      @show-issue-rows="review.setActiveTab('invalid'); review.closeInspection()"
    />

    <div v-else class="grid min-h-[24rem] overflow-hidden rounded-[var(--ui-radius)] border border-default/70 bg-default grid-rows-[auto_auto_minmax(0,1fr)]">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-default/70 px-5 pt-2">
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="item in review.tabItems.value"
            :key="item.key"
            type="button"
            class="border-b-2 px-4 py-3 text-sm transition-colors"
            :class="review.activeTab.value === item.key
              ? 'border-highlighted font-semibold text-highlighted'
              : 'border-transparent text-muted hover:text-toned'"
            @click="review.setActiveTab(item.key)"
          >
            {{ item.label }}
          </button>
        </div>

        <div v-if="review.selectedRowIndexes.value.length" class="flex flex-wrap items-center gap-2 pb-2">
          <span class="font-mono text-sm text-muted">
            {{ review.selectedRowIndexes.value.length }} selected
          </span>
          <UButton
            color="error"
            variant="outline"
            size="xs"
            icon="i-lucide-trash-2"
            label="Discard selected"
            :disabled="!review.canDiscardSelection.value"
            @click="review.discardSelectedRows"
          />
          <UButton
            color="neutral"
            variant="outline"
            size="xs"
            icon="i-lucide-undo-2"
            label="Restore"
            :disabled="!review.canRestoreSelection.value"
            @click="review.restoreSelectedRows"
          />
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 border-b border-default/70 px-5 py-3">
        <button
          v-for="item in review.issueFilterItems.value"
          :key="item.key"
          type="button"
          class="rounded-md px-3 py-1.5 text-sm transition-colors"
          :class="review.issueFilter.value === item.key
            ? 'bg-elevated text-highlighted'
            : 'text-muted hover:bg-elevated/60 hover:text-toned'"
          :disabled="review.activeTab.value === 'valid' || review.activeTab.value === 'discarded'"
          @click="review.setIssueFilter(item.key)"
        >
          {{ item.label }}
        </button>
      </div>

      <UTable
        :data="review.visibleRows.value"
        :columns="review.reviewTableColumns.value"
        :row-selection="review.rowSelection.value"
        :get-row-id="row => String(row.index)"
        sticky="header"
        class="h-full min-h-0"
        :on-select="(_event, row) => review.inspectRow(row.original.index)"
        :meta="{
          class: {
            tr: (row: { original: { index: number, issues: readonly SpreadsheetRowIssue[] } }) => review.getRowToneClass(row.original),
          },
        }"
        :ui="{
          root: 'overflow-x-auto overflow-y-visible',
          base: 'min-w-max',
          tr: 'cursor-pointer border-b border-default/40 transition-colors',
          td: 'py-3 align-middle',
          th: 'bg-elevated/60',
        }"
      />
    </div>
  </div>
</template>
