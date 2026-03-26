<script setup lang="ts">
import { computed, ref } from 'vue'
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import type { SpreadsheetRowIssue } from '../../../types'

const emit = defineEmits<{
  close: []
  prev: []
  next: []
  discardRow: [rowIndex: number]
  restoreRow: [rowIndex: number]
  showIssueRows: []
}>()

const props = defineProps<{
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

type InspectionGroupMode = 'property' | 'issue'

const groupMode = ref<InspectionGroupMode>('property')

const rowPrimaryLabel = computed(() =>
  props.formatCell(props.inspectedRow.rowObject[props.tableColumns[0] ?? '']),
)
const blockingIssueCount = computed(() =>
  props.inspectedRow.issues.filter(issue => issue.level === 'error').length,
)
const warningIssueCount = computed(() =>
  props.inspectedRow.issues.filter(issue => issue.level === 'warning').length,
)
const issueGroups = computed(() => {
  if (groupMode.value === 'issue') {
    const groups = new Map<string, {
      key: string
      title: string
      subtitle: string
      issues: SpreadsheetRowIssue[]
    }>()

    for (const issue of props.inspectedRow.issues) {
      const key = issue.ruleKey ?? issue.code
      const existing = groups.get(key)
      if (existing) {
        existing.issues.push(issue)
        continue
      }

      groups.set(key, {
        key,
        title: props.humanizeKey(issue.ruleKey ?? issue.code),
        subtitle: issue.ruleKey ? `Rule key: ${issue.ruleKey}` : 'Grouped by issue type',
        issues: [issue],
      })
    }

    return Array.from(groups.values())
  }

  const groups = new Map<string, {
    key: string
    title: string
    subtitle: string
    issues: SpreadsheetRowIssue[]
  }>()

  for (const issue of props.inspectedRow.issues) {
    const key = issue.columnKey ?? '__row__'
    const existing = groups.get(key)
    if (existing) {
      existing.issues.push(issue)
      continue
    }

    groups.set(key, {
      key,
      title: key === '__row__' ? 'Row-level issue' : props.humanizeKey(key),
      subtitle: key === '__row__' ? 'Affects the full row' : `Property: ${key}`,
      issues: [issue],
    })
  }

  return Array.from(groups.values())
})

function getFieldIssues(key: string) {
  return props.inspectedRow.issues.filter(issue => issue.columnKey === key)
}

function getFieldIssueTone(key: string) {
  const issues = getFieldIssues(key)
  if (issues.some(issue => issue.level === 'error')) return 'error'
  if (issues.some(issue => issue.level === 'warning')) return 'warning'
  return 'neutral'
}
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
        <div class="grid gap-2">
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-xl font-semibold text-highlighted">
              Inspecting row #{{ inspectedRow.index + 1 }}
            </span>
            <UBadge
              :color="isDiscarded(inspectedRow.index) ? 'neutral' : blockingIssueCount ? 'error' : warningIssueCount ? 'warning' : 'success'"
              variant="soft"
              size="sm"
            >
              {{ isDiscarded(inspectedRow.index) ? 'Discarded' : blockingIssueCount ? 'Blocking issues' : warningIssueCount ? 'Warnings only' : 'Valid row' }}
            </UBadge>
          </div>
          <span class="text-sm text-toned">
            {{ rowPrimaryLabel }}
          </span>
        </div>
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

    <div class="grid gap-3 rounded-[var(--ui-radius)] border border-default/70 bg-elevated/20 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div class="flex flex-wrap items-center gap-2">
        <UBadge color="error" variant="soft" size="sm">
          {{ blockingIssueCount }} blocking
        </UBadge>
        <UBadge color="warning" variant="soft" size="sm">
          {{ warningIssueCount }} warnings
        </UBadge>
        <UBadge color="neutral" variant="subtle" size="sm">
          {{ issueGroups.length }} {{ groupMode === 'property' ? 'property groups' : 'issue groups' }}
        </UBadge>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-2">
        <UButton
          v-if="!isDiscarded(inspectedRow.index)"
          color="error"
          variant="outline"
          size="sm"
          icon="i-lucide-trash-2"
          label="Discard row"
          @click="emit('discardRow', inspectedRow.index)"
        />
        <UButton
          v-else-if="isManuallyDiscarded(inspectedRow.index)"
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-undo-2"
          label="Restore row"
          @click="emit('restoreRow', inspectedRow.index)"
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
            class="grid gap-2 border-b border-default/50 px-5 py-3 text-sm last:border-b-0"
            :class="{
              'bg-error/5': getFieldIssueTone(key) === 'error',
              'bg-warning/10': getFieldIssueTone(key) === 'warning',
            }"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="grid gap-1">
                <span
                  class="font-mono text-[11px]"
                  :class="{
                    'text-error': getFieldIssueTone(key) === 'error',
                    'text-warning': getFieldIssueTone(key) === 'warning',
                    'text-muted': getFieldIssueTone(key) === 'neutral',
                  }"
                >
                  {{ humanizeKey(key) }}
                </span>
                <span
                  class="text-sm"
                  :class="{
                    'text-error': getFieldIssueTone(key) === 'error',
                    'text-warning': getFieldIssueTone(key) === 'warning',
                    'text-toned': getFieldIssueTone(key) === 'neutral',
                  }"
                >
                  {{ formatCell(value) }}
                </span>
              </div>

              <UBadge
                v-if="getFieldIssues(key).length"
                :color="getFieldIssueTone(key) === 'error' ? 'error' : 'warning'"
                variant="soft"
                size="sm"
              >
                {{ getFieldIssues(key).length }}
              </UBadge>
            </div>

            <div v-if="getFieldIssues(key).length" class="flex flex-wrap gap-2">
              <UBadge
                v-for="issue in getFieldIssues(key)"
                :key="`${key}:${issue.ruleKey ?? issue.code}`"
                :color="getIssueBadge(issue).color"
                variant="subtle"
                size="xs"
                class="font-mono"
              >
                {{ issue.ruleKey ?? issue.code }}
              </UBadge>
            </div>
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
            <button
              type="button"
              class="rounded px-3 py-1 text-xs font-medium transition-colors"
              :class="groupMode === 'property' ? 'bg-inverted text-inverted' : 'text-muted hover:text-toned'"
              @click="groupMode = 'property'"
            >
              By property
            </button>
            <button
              type="button"
              class="rounded px-3 py-1 text-xs font-medium transition-colors"
              :class="groupMode === 'issue' ? 'bg-inverted text-inverted' : 'text-muted hover:text-toned'"
              @click="groupMode = 'issue'"
            >
              By issue type
            </button>
          </div>
        </div>

        <div class="grid max-h-[42rem] overflow-auto">
          <div
            v-for="group in issueGroups"
            :key="group.key"
            class="border-b border-default/50 last:border-b-0"
          >
            <div class="border-b border-default/50 bg-elevated/15 px-5 py-3">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="grid gap-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-sm font-semibold text-highlighted">
                      {{ group.title }}
                    </span>
                    <UBadge
                      :color="group.issues.some(issue => issue.level === 'error') ? 'error' : 'warning'"
                      variant="soft"
                      size="sm"
                    >
                      {{ group.issues.length }}
                    </UBadge>
                  </div>
                  <span class="font-mono text-[11px] text-muted">
                    {{ group.subtitle }}
                  </span>
                </div>
              </div>
            </div>

            <div class="grid gap-4 px-5 py-4">
              <div
                v-for="issue in group.issues"
                :key="`${group.key}:${issue.code}:${issue.columnKey ?? 'row'}`"
                class="grid gap-3 rounded-[var(--ui-radius)] border border-default/60 bg-default px-4 py-4"
              >
                <div class="flex flex-wrap items-center gap-3">
                  <UIcon
                    :name="issue.level === 'error' ? 'i-lucide-circle-x' : 'i-lucide-triangle-alert'"
                    class="size-4"
                    :class="issue.level === 'error' ? 'text-error' : 'text-warning'"
                  />

                  <UBadge :color="getIssueBadge(issue).color" variant="soft" size="sm">
                    {{ getIssueBadge(issue).label }}
                  </UBadge>
                  <UBadge color="neutral" variant="subtle" size="xs" class="font-mono">
                    {{ issue.ruleKey ?? issue.code }}
                  </UBadge>
                  <span class="text-sm text-toned">
                    {{ humanizeKey(issue.columnKey ?? issue.code) }}
                  </span>
                </div>

                <div class="rounded-[var(--ui-radius)] px-4 py-3" :class="getIssueValueTone(issue)">
                  <div class="mb-1 font-mono text-xs text-muted">Value in file</div>
                  <div class="font-mono text-sm" :class="issue.level === 'error' ? 'text-error' : 'text-warning'">
                    {{ getIssueValue(inspectedRow.rowObject, issue) }}
                  </div>
                </div>

                <p class="text-sm leading-6 text-toned">
                  {{ issue.message }}
                </p>

                <button
                  v-if="getRelatedIssueCount(issue) > 1"
                  type="button"
                  class="justify-self-start text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  @click="emit('showIssueRows')"
                >
                  View all {{ getRelatedIssueCount(issue) }} rows with this issue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
