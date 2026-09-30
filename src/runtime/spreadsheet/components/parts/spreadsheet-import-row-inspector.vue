<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, shallowRef } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import {
  useSpreadsheetImporter,
  useSpreadsheetStepsContext,
} from '../../composables/use-spreadsheet-import-context'
import type { SpreadsheetImporter, SpreadsheetRowIssue } from '../../types'
import SpreadsheetImportCellEditor from '../internal/spreadsheet-import-cell-editor.vue'
import SpreadsheetImportStatusBadge from '../internal/spreadsheet-import-status-badge.vue'

const LEVELS = ['info', 'warning', 'error']
const props = withDefaults(defineProps<{ importer?: SpreadsheetImporter; height?: string }>(), {
  height: '30rem',
  importer: undefined,
})
defineSlots<{ issue?: (props: { issue: SpreadsheetRowIssue }) => unknown }>()
const importer = useSpreadsheetImporter(() => props.importer)
const steps = useSpreadsheetStepsContext()
const { t } = useUiToolsLocale()
const editing = shallowRef<string | null>(null)

const row = computed(() => importer.value.review.inspected)
const fields = computed(() => importer.value.columns.fields)
const labels = computed(() => new Map(fields.value.map((field) => [field.path, field.label])))
const issues = computed(() =>
  [...(row.value?.issues ?? [])]
    .filter((issue) => issue.code !== 'value.skipped')
    .sort((left, right) => LEVELS.indexOf(right.level) - LEVELS.indexOf(left.level)),
)
const counts = computed(
  () => new Map(importer.value.review.issueTypes.map((type) => [type.id, type.rowCount])),
)
const position = computed(() => importer.value.review.position)

/** Options of a select cell, for this row: they may depend on the columns before it. */
function choicesOf(path: string) {
  const field = fields.value.find((entry) => entry.path === path)
  return field?.kind === 'select' && row.value
    ? importer.value.rows.cell(row.value.index, path).choices.map((option) => option.label)
    : undefined
}

function commit(path: string, text: string) {
  const current = row.value
  if (current && text !== importer.value.rows.cell(current.index, path).text)
    importer.value.rows.edit(current.index, path, text)
  editing.value = null
}

function revert(path: string) {
  if (row.value) importer.value.rows.revert(row.value.index, path)
}

function filterIssue(issue: SpreadsheetRowIssue) {
  importer.value.review.setIssue(`${issue.field}|${issue.code}`)
}

function toggleDiscard() {
  const current = row.value
  if (!current) return
  if (current.discardReason === 'manual') importer.value.rows.restore([current.index])
  else importer.value.rows.discard([current.index])
}

function openValues() {
  steps.value?.goTo('values')
}
</script>

<template>
  <aside
    v-if="row"
    data-spreadsheet-inspector
    class="flex min-w-0 flex-col bg-default"
    :style="{ height }"
    :aria-label="t('spreadsheet.inspector.title', { row: row.rowNumber })"
  >
    <div class="flex items-center gap-2.5 border-b border-default px-4 py-3">
      <b class="text-[15px] font-semibold text-highlighted tabular-nums">{{
        t('spreadsheet.inspector.title', { row: row.rowNumber })
      }}</b>
      <SpreadsheetImportStatusBadge :status="row.status" full />
      <span
        v-if="row.mode === 'update' && !row.discardReason"
        class="inline-flex h-5 items-center gap-1 rounded-md bg-info/10 px-1.5 text-[11.5px] font-semibold text-info"
      >
        <UIcon name="i-lucide-refresh-cw" class="size-3" />{{ t('spreadsheet.table.modeUpdate') }}
      </span>
      <UButton
        class="ms-auto"
        size="sm"
        color="neutral"
        variant="ghost"
        square
        icon="i-lucide-x"
        :aria-label="t('spreadsheet.inspector.close')"
        @click="importer.review.inspect(null)"
      />
    </div>
    <div
      class="flex items-center justify-between gap-2 border-b border-default px-4 py-2 text-[12.5px] text-muted"
    >
      <UButton
        size="xs"
        color="neutral"
        variant="outline"
        square
        icon="i-lucide-chevron-left"
        :disabled="position.current <= 1"
        :aria-label="t('spreadsheet.inspector.previous')"
        @click="importer.review.previous()"
      />
      <span class="tabular-nums">
        {{
          position.current
            ? t('spreadsheet.inspector.position', {
                current: position.current,
                total: position.total,
              })
            : t('spreadsheet.inspector.positionNone', { total: position.total })
        }}
      </span>
      <UButton
        size="xs"
        color="neutral"
        variant="outline"
        square
        icon="i-lucide-chevron-right"
        :disabled="position.current >= position.total"
        :aria-label="t('spreadsheet.inspector.next')"
        @click="importer.review.next()"
      />
    </div>

    <div class="grid flex-1 content-start gap-4 overflow-auto px-4 pt-3.5 pb-4">
      <p
        v-if="row.discardReason"
        class="flex items-center gap-2 rounded-lg bg-elevated px-3 py-2 text-[13px] text-muted"
      >
        <UIcon name="i-lucide-ban" class="size-4 shrink-0" />{{
          t(`spreadsheet.table.reasons.${row.discardReason}`)
        }}
      </p>
      <section class="grid gap-2">
        <h5 class="text-[11px] font-semibold tracking-[0.08em] text-dimmed uppercase">
          {{ t('spreadsheet.inspector.issues') }}
        </h5>
        <template v-if="issues.length">
          <div
            v-for="(issue, index) in issues"
            :key="`${issue.field}-${issue.code}-${index}`"
            class="grid gap-1.5 rounded-lg border px-3 py-2.5"
            :class="
              issue.level === 'error'
                ? 'border-error/30 bg-error/4'
                : issue.level === 'warning'
                  ? 'border-warning/30 bg-warning/4'
                  : 'border-default'
            "
          >
            <slot name="issue" :issue="issue">
              <div class="flex items-start gap-2">
                <UIcon
                  :name="issue.level === 'error' ? 'i-lucide-circle-x' : 'i-lucide-triangle-alert'"
                  class="mt-0.5 size-4 shrink-0"
                  :class="issue.level === 'error' ? 'text-error' : 'text-warning'"
                />
                <div class="grid min-w-0 gap-0.5">
                  <span v-if="issue.field" class="text-xs font-semibold text-toned">{{
                    labels.get(issue.field) ?? issue.field
                  }}</span>
                  <span class="text-[13px] text-highlighted">{{ issue.message }}</span>
                </div>
              </div>
              <div class="flex flex-wrap gap-x-3 ps-6">
                <UButton
                  v-if="steps && issue.code === 'value.unknown'"
                  variant="link"
                  size="xs"
                  class="px-0"
                  :label="t('spreadsheet.inspector.answerIt')"
                  @click="openValues"
                />
                <UButton
                  v-if="issue.field && (counts.get(`${issue.field}|${issue.code}`) ?? 0) > 1"
                  variant="link"
                  color="neutral"
                  size="xs"
                  class="px-0"
                  :label="
                    t('spreadsheet.inspector.allRows', {
                      count: counts.get(`${issue.field}|${issue.code}`) ?? 0,
                    })
                  "
                  @click="filterIssue(issue)"
                />
              </div>
            </slot>
          </div>
        </template>
        <p v-else class="flex items-center gap-2 text-[13px] text-success">
          <UIcon name="i-lucide-circle-check" class="size-4" />{{
            t('spreadsheet.inspector.noIssue')
          }}
        </p>
      </section>

      <section class="grid gap-2">
        <h5 class="text-[11px] font-semibold tracking-[0.08em] text-dimmed uppercase">
          {{ t('spreadsheet.inspector.values') }}
        </h5>
        <dl class="divide-y divide-default overflow-hidden rounded-lg border border-default">
          <div
            v-for="field in fields"
            :key="field.path"
            class="grid gap-0.5 px-3 py-2"
            :class="row.fieldIssues[field.path]?.level === 'error' ? 'bg-error/4' : ''"
          >
            <dt class="text-xs text-muted">{{ field.label }}</dt>
            <dd class="min-w-0">
              <div
                v-if="editing === field.path"
                class="h-8 overflow-hidden rounded-md ring-2 ring-primary ring-inset"
              >
                <SpreadsheetImportCellEditor
                  :text="importer.rows.cell(row.index, field.path).text"
                  :choices="choicesOf(field.path)"
                  @commit="(text) => commit(field.path, text)"
                  @cancel="editing = null"
                />
              </div>
              <button
                v-else
                type="button"
                class="w-full truncate rounded px-1 py-0.5 text-start text-[13px] text-highlighted hover:bg-elevated"
                :class="{
                  'italic text-dimmed': !importer.rows.cell(row.index, field.path).display,
                }"
                :disabled="Boolean(row.discardReason)"
                @click="editing = field.path"
              >
                {{
                  importer.rows.cell(row.index, field.path).display ||
                  t('spreadsheet.table.emptyCell')
                }}
              </button>
              <p
                v-if="importer.rows.cell(row.index, field.path).edited"
                class="flex items-center gap-1 px-1 text-[11.5px] text-dimmed"
              >
                {{
                  t('spreadsheet.table.edited', {
                    value:
                      importer.rows.cell(row.index, field.path).original ||
                      t('spreadsheet.table.emptyCell'),
                  })
                }}
                <UButton
                  variant="link"
                  size="xs"
                  class="px-0"
                  :label="t('spreadsheet.inspector.revert')"
                  @click="revert(field.path)"
                />
              </p>
              <p
                v-else-if="importer.rows.cell(row.index, field.path).stored !== null"
                class="px-1 text-[11.5px] text-info"
              >
                {{
                  t('spreadsheet.table.stored', {
                    value: importer.rows.cell(row.index, field.path).stored ?? '',
                  })
                }}
              </p>
            </dd>
          </div>
        </dl>
      </section>
    </div>
    <div class="border-t border-default px-4 py-2.5">
      <UButton
        v-if="!row.discardReason || row.discardReason === 'manual'"
        size="sm"
        color="neutral"
        variant="outline"
        block
        :icon="row.discardReason ? 'i-lucide-rotate-ccw' : 'i-lucide-ban'"
        :label="
          row.discardReason
            ? t('spreadsheet.inspector.restore')
            : t('spreadsheet.inspector.discard')
        "
        @click="toggleDiscard"
      />
    </div>
  </aside>
</template>
