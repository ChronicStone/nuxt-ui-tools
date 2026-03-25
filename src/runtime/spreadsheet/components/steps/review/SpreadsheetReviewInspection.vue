<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import type { SpreadsheetRowIssue } from '../../../types'

defineProps<{
  inspectedRow: {
    index: number
    rowObject: Record<string, unknown>
    issues: readonly SpreadsheetRowIssue[]
  }
  tableColumns: string[]
  issueRowsLength: number
  inspectedIssueRowPosition: number
  formatCell: (value: unknown) => string
  getObjectEntries: (value: unknown) => Array<[string, unknown]>
  humanizeKey: (value: string) => string
  getIssueBadge: (issue: SpreadsheetRowIssue) => {
    label: string
    color: 'error' | 'warning'
  }
  getIssueValueTone: (issue: SpreadsheetRowIssue) => string
  getIssueValue: (rowData: Record<string, unknown>, issue: SpreadsheetRowIssue) => string
  getRelatedIssueCount: (issue: SpreadsheetRowIssue) => number
  isDiscarded: (index: number) => boolean
  isManuallyDiscarded: (index: number) => boolean
}>()

const emit = defineEmits<{
  close: []
  prev: []
  next: []
  discardRow: [rowIndex: number]
  restoreRow: [rowIndex: number]
  showIssueRows: []
}>()
</script>

<template>
  <div class="grid gap-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-4">
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-arrow-left"
          label="Back to table"
          @click="emit('close')"
        />
        <span class="text-xl font-semibold text-highlighted">
          Inspecting row #{{ inspectedRow.index + 1 }} — {{ formatCell(inspectedRow.rowObject[tableColumns[0] ?? '']) }}
        </span>
      </div>

      <div class="flex items-center gap-3">
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-chevron-left"
          label="Prev"
          :disabled="inspectedIssueRowPosition <= 0"
          @click="emit('prev')"
        />
        <span class="font-mono text-sm text-muted">
          {{ inspectedIssueRowPosition + 1 }} of {{ issueRowsLength }} with issues
        </span>
        <UButton
          color="neutral"
          variant="solid"
          size="sm"
          trailing-icon="i-lucide-chevron-right"
          label="Next"
          :disabled="inspectedIssueRowPosition < 0 || inspectedIssueRowPosition >= issueRowsLength - 1"
          @click="emit('next')"
        />
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <div class="overflow-hidden rounded-[var(--ui-radius)] border border-default/70 bg-default">
        <div class="flex items-center justify-between border-b border-default/70 bg-elevated/35 px-5 py-[14px]">
          <span class="text-[13px] font-semibold text-highlighted">Row data</span>
          <span class="font-mono text-[11px] text-muted">Row #{{ inspectedRow.index + 1 }}</span>
        </div>

        <div class="grid">
          <div
            v-for="[key, value] in getObjectEntries(inspectedRow.rowObject)"
            :key="key"
            class="flex items-center justify-between gap-6 border-b border-default/50 px-5 py-[10px] text-sm last:border-b-0"
            :class="{
              'bg-error/5': inspectedRow.issues.some(issue => issue.columnKey === key && issue.level === 'error'),
              'bg-warning/10': inspectedRow.issues.some(issue => issue.columnKey === key && issue.level === 'warning'),
            }"
          >
            <span
              class="font-mono text-[11px]"
              :class="{
                'text-error': inspectedRow.issues.some(issue => issue.columnKey === key && issue.level === 'error'),
                'text-warning': inspectedRow.issues.some(issue => issue.columnKey === key && issue.level === 'warning'),
                'text-muted': !inspectedRow.issues.some(issue => issue.columnKey === key),
              }"
            >
              {{ humanizeKey(key) }}
            </span>
            <span
              class="text-right text-sm"
              :class="{
                'text-error': inspectedRow.issues.some(issue => issue.columnKey === key && issue.level === 'error'),
                'text-warning': inspectedRow.issues.some(issue => issue.columnKey === key && issue.level === 'warning'),
                'text-toned': !inspectedRow.issues.some(issue => issue.columnKey === key),
              }"
            >
              {{ formatCell(value) }}
            </span>
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-[var(--ui-radius)] border border-default/70 bg-default">
        <div class="flex items-center justify-between border-b border-default/70 bg-elevated/35 px-5 py-[14px]">
          <div class="flex items-center gap-3">
            <span class="text-[13px] font-semibold text-highlighted">Issues on this row</span>
            <UBadge color="error" variant="soft" size="sm">{{ inspectedRow.issues.length }}</UBadge>
          </div>

          <div class="flex items-center rounded-md border border-default/70 bg-default p-1">
            <button type="button" class="rounded bg-inverted px-3 py-1 text-xs font-medium text-inverted">
              By property
            </button>
            <button type="button" class="rounded px-3 py-1 text-xs text-muted">
              By issue type
            </button>
          </div>
        </div>

        <div class="grid">
          <div
            v-for="issue in inspectedRow.issues"
            :key="`${issue.code}:${issue.columnKey ?? 'row'}`"
            class="border-b border-default/50 px-5 py-4 last:border-b-0"
          >
            <div class="mb-3 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <UIcon
                  :name="issue.level === 'error' ? 'i-lucide-circle-x' : 'i-lucide-triangle-alert'"
                  class="size-4"
                  :class="issue.level === 'error' ? 'text-error' : 'text-warning'"
                />

                <UBadge :color="getIssueBadge(issue).color" variant="soft" size="sm">
                  {{ getIssueBadge(issue).label }}
                </UBadge>
                <span class="text-base font-semibold text-highlighted">
                  {{ humanizeKey(issue.columnKey ?? issue.code) }}
                </span>
              </div>

              <UButton
                v-if="!isDiscarded(inspectedRow.index)"
                color="neutral"
                variant="outline"
                size="sm"
                label="Discard row"
                @click="emit('discardRow', inspectedRow.index)"
              />
              <UButton
                v-else-if="isManuallyDiscarded(inspectedRow.index)"
                color="neutral"
                variant="outline"
                size="sm"
                label="Restore row"
                @click="emit('restoreRow', inspectedRow.index)"
              />
            </div>

            <div class="mb-3 rounded-[var(--ui-radius)] px-4 py-3" :class="getIssueValueTone(issue)">
              <div class="mb-1 font-mono text-xs text-muted">Value in file</div>
              <div class="font-mono text-sm" :class="issue.level === 'error' ? 'text-error' : 'text-warning'">
                {{ getIssueValue(inspectedRow.rowObject, issue) }}
              </div>
            </div>

            <p class="mb-3 text-sm text-toned">
              {{ issue.message }}
            </p>

            <button
              v-if="getRelatedIssueCount(issue) > 1"
              type="button"
              class="text-sm font-medium text-primary transition-colors hover:text-primary/80"
              @click="emit('showIssueRows')"
            >
              View all {{ getRelatedIssueCount(issue) }} rows with this issue
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
