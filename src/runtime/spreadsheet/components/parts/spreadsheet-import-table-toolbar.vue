<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import USelect from '@nuxt/ui/components/Select.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useSpreadsheetImporter } from '../../composables/use-spreadsheet-import-context'
import type {
  SpreadsheetImporter,
  SpreadsheetReviewLevel,
  SpreadsheetReviewMode,
  SpreadsheetReviewTab,
} from '../../types'

const ALL = '__all__'
const props = defineProps<{ importer?: SpreadsheetImporter }>()
const importer = useSpreadsheetImporter(() => props.importer)
const { t } = useUiToolsLocale()

const review = computed(() => importer.value.review)
const labels = computed(
  () => new Map(importer.value.columns.fields.map((field) => [field.path, field.label])),
)

const tabs = computed(() =>
  (
    [
      ['all', importer.value.rows.all.length],
      ['importable', importer.value.rows.importable.length],
      ['invalid', importer.value.rows.invalid.length],
      ['discarded', importer.value.rows.discarded.length],
    ] as const
  ).map(([key, count]) => ({ count, key, label: t(`spreadsheet.table.tabs.${key}`) })),
)
const levels = computed(() => {
  const live = importer.value.rows.all.filter((row) => !row.discardReason)
  return [
    { count: null, key: 'all' as const },
    { count: live.filter((row) => row.errors.length).length, key: 'blocking' as const },
    { count: live.filter((row) => row.warnings.length).length, key: 'warnings' as const },
  ]
})
const showModes = computed(() => importer.value.rows.byMode.update > 0)
const modes = computed(() => [
  { key: 'all' as const, label: t('spreadsheet.table.modes.all') },
  {
    key: 'create' as const,
    label: `${t('spreadsheet.table.modes.create')} · ${importer.value.rows.byMode.create}`,
  },
  {
    key: 'update' as const,
    label: `${t('spreadsheet.table.modes.update')} · ${importer.value.rows.byMode.update}`,
  },
])
const issueItems = computed(() => [
  { label: t('spreadsheet.table.anyIssue'), value: ALL },
  { label: t('spreadsheet.table.byColumn'), type: 'label' as const },
  ...[...review.value.fieldIssues.entries()].map(([field, count]) => ({
    label: t('spreadsheet.table.columnIssueOption', {
      count: count.rowCount,
      field: labels.value.get(field) ?? field,
    }),
    value: `${field}|*`,
  })),
  { label: t('spreadsheet.table.byIssue'), type: 'label' as const },
  ...review.value.issueTypes.map((type) => ({
    label: t('spreadsheet.table.issueOption', {
      count: type.rowCount,
      field: labels.value.get(type.field) ?? type.field,
      message: type.message,
    }),
    value: type.id,
  })),
])

function setTab(key: SpreadsheetReviewTab) {
  importer.value.review.setTab(key)
}

function setLevel(key: SpreadsheetReviewLevel) {
  importer.value.review.setLevel(key)
}

function setMode(key: SpreadsheetReviewMode) {
  importer.value.review.setMode(key)
}

function setIssue(value: string | undefined) {
  importer.value.review.setIssue(!value || value === ALL ? '' : value)
}

function setSearch(value: string | number | undefined) {
  importer.value.review.setSearch(String(value ?? ''))
}

function discardSelected() {
  importer.value.rows.discard([...importer.value.review.selection])
  importer.value.review.clearSelection()
}

function restoreSelected() {
  importer.value.rows.restore([...importer.value.review.selection])
  importer.value.review.clearSelection()
}
</script>

<template>
  <div data-spreadsheet-table-toolbar class="border-b border-default bg-default">
    <div class="flex flex-wrap items-end justify-between gap-x-4 border-b border-default px-3">
      <div class="flex gap-0.5 overflow-x-auto" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          class="inline-flex h-11 items-center gap-2 px-3 text-sm whitespace-nowrap"
          :class="
            review.tab === tab.key
              ? 'font-semibold text-highlighted shadow-[inset_0_-2px_0_var(--ui-primary)]'
              : 'text-muted hover:text-highlighted'
          "
          :aria-selected="review.tab === tab.key"
          @click="setTab(tab.key)"
        >
          {{ tab.label }}
          <span
            class="rounded-md px-1.5 text-xs font-semibold tabular-nums"
            :class="
              tab.key === 'invalid' && tab.count
                ? 'bg-error/10 text-error'
                : 'bg-elevated text-muted'
            "
          >
            {{ tab.count }}
          </span>
        </button>
      </div>
      <div v-if="review.tab !== 'discarded'" class="flex max-w-full gap-1 overflow-x-auto py-2">
        <button
          v-for="level in levels"
          :key="level.key"
          type="button"
          class="h-7 shrink-0 rounded-md px-2.5 text-[12.5px] font-medium whitespace-nowrap tabular-nums"
          :class="
            review.level === level.key
              ? 'bg-inverted text-inverted'
              : 'text-muted hover:bg-elevated hover:text-highlighted'
          "
          :aria-pressed="review.level === level.key"
          @click="setLevel(level.key)"
        >
          {{ t(`spreadsheet.table.levels.${level.key}`)
          }}<template v-if="level.count !== null"> · {{ level.count }}</template>
        </button>
      </div>
    </div>
    <div class="flex min-h-13 flex-wrap items-center gap-2 bg-elevated/40 px-3 py-2">
      <div
        v-if="review.selection.size"
        class="flex items-center gap-1 rounded-lg bg-inverted py-1 ps-3 pe-1 text-sm text-inverted"
      >
        {{ t('spreadsheet.table.selected', { count: review.selection.size }) }}
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          class="text-inverted hover:bg-default/15"
          icon="i-lucide-ban"
          :label="t('spreadsheet.table.discard')"
          @click="discardSelected"
        />
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          class="text-inverted hover:bg-default/15"
          :label="t('spreadsheet.table.restore')"
          @click="restoreSelected"
        />
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          class="text-inverted hover:bg-default/15"
          :label="t('spreadsheet.table.clearSelection')"
          @click="review.clearSelection()"
        />
      </div>
      <template v-else>
        <UInput
          :model-value="review.search"
          icon="i-lucide-search"
          size="sm"
          :placeholder="t('spreadsheet.table.search')"
          :aria-label="t('spreadsheet.table.search')"
          class="w-56 max-w-full"
          @update:model-value="setSearch"
        />
        <USelect
          :model-value="review.issue || ALL"
          :items="issueItems"
          size="sm"
          class="w-60 max-w-full"
          :aria-label="t('spreadsheet.table.anyIssue')"
          @update:model-value="setIssue"
        />
        <UButton
          v-if="review.issue"
          size="sm"
          color="neutral"
          variant="ghost"
          :label="t('spreadsheet.table.clearFilter')"
          @click="review.setIssue('')"
        />
        <div
          v-if="showModes"
          class="flex gap-0.5 rounded-lg bg-default p-0.5 ring-1 ring-default ring-inset"
        >
          <button
            v-for="mode in modes"
            :key="mode.key"
            type="button"
            class="h-6 rounded-md px-2 text-xs font-medium whitespace-nowrap tabular-nums"
            :class="
              review.mode === mode.key
                ? 'bg-elevated text-highlighted'
                : 'text-muted hover:text-highlighted'
            "
            :aria-pressed="review.mode === mode.key"
            @click="setMode(mode.key)"
          >
            {{ mode.label }}
          </button>
        </div>
      </template>
      <span class="ms-auto text-xs text-dimmed tabular-nums">{{
        t('spreadsheet.table.rowCount', { count: review.visible.length })
      }}</span>
    </div>
  </div>
</template>
