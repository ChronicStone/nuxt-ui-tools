<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import USelect from '@nuxt/ui/components/Select.vue'
import { computed, shallowRef } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useSpreadsheetImporter } from '../../composables/use-spreadsheet-import-context'
import type { SpreadsheetImporter } from '../../types'

const props = defineProps<{
  importer?: SpreadsheetImporter
  /** Shows the sheet and header-row pickers even when detection is sure. */
  always?: boolean
  /** Hides the preview of the rows around the header row. */
  noPreview?: boolean
}>()
const importer = useSpreadsheetImporter(() => props.importer)
const { t } = useUiToolsLocale()
const editing = shallowRef<boolean>(false)

const layout = computed(() => importer.value.layout)
const matched = computed(
  () => importer.value.columns.fields.filter((field) => field.status === 'matched').length,
)
const problem = computed(() => {
  if (!layout.value.detection?.best) return 'no-match'
  if (!matched.value) return 'no-match'
  if (layout.value.ambiguous) return 'ambiguous'
  return null
})
const showPickers = computed(
  () => props.always || editing.value || problem.value !== null || !layout.value.detected,
)

const sheetItems = computed(() =>
  importer.value.file.sheets.map((sheet) => ({
    label: t('spreadsheet.file.sheetOption', { count: sheet.rowCount, name: sheet.name }),
    value: sheet.name,
  })),
)
const rowItems = computed(() =>
  layout.value.candidates.map((row) => ({
    label: row.preview.length
      ? t('spreadsheet.file.rowOption', { preview: row.preview.join(', '), row: row.rowNumber })
      : t('spreadsheet.file.emptyRow', { row: row.rowNumber }),
    value: row.index,
  })),
)
const previewWidth = computed(() =>
  Math.min(Math.max(...layout.value.preview.map((row) => row.cells.length), 0), 8),
)

function selectSheet(value: string) {
  importer.value.layout.setSheet(value)
}

function selectRow(value: number) {
  importer.value.layout.setHeaderRow(value)
}
</script>

<template>
  <div v-if="importer.file.loaded" data-spreadsheet-source-settings class="grid gap-3">
    <div v-if="!showPickers" class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
      <UIcon name="i-lucide-circle-check" class="size-4 text-success" />
      <span>
        <b class="font-medium text-highlighted">{{ layout.sheet }}</b>
        · {{ t('spreadsheet.file.headerRow') }}
        <b class="font-medium text-highlighted tabular-nums">{{ layout.headerRowNumber }}</b>
      </span>
      <span class="text-dimmed">· {{ t('spreadsheet.file.detected') }}</span>
      <span v-if="layout.headerRow > 0" class="text-dimmed">
        · {{ t('spreadsheet.file.titleRows', { count: layout.headerRow }) }}
      </span>
      <UButton
        variant="link"
        color="neutral"
        size="xs"
        class="px-0"
        icon="i-lucide-pencil"
        :aria-label="t('spreadsheet.file.sheet')"
        @click="editing = true"
      />
    </div>
    <template v-else>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="grid min-w-0 gap-1.5 text-sm font-medium text-toned">
          {{ t('spreadsheet.file.sheet') }}
          <USelect
            :model-value="layout.sheet ?? undefined"
            :items="sheetItems"
            class="w-full"
            @update:model-value="selectSheet"
          />
        </label>
        <label class="grid min-w-0 gap-1.5 text-sm font-medium text-toned">
          {{ t('spreadsheet.file.headerRow') }}
          <USelect
            :model-value="layout.headerRow"
            :items="rowItems"
            class="w-full"
            @update:model-value="selectRow"
          />
        </label>
      </div>
      <p
        v-if="problem === 'no-match'"
        class="flex flex-wrap items-center gap-1.5 text-sm text-error"
      >
        <UIcon name="i-lucide-circle-x" class="size-4 shrink-0" />
        {{ t('spreadsheet.file.noMatch') }}
        <UButton
          v-if="layout.detection?.best && !layout.detected"
          variant="link"
          size="xs"
          class="px-0"
          :label="t('spreadsheet.file.useDetected')"
          @click="layout.redetect()"
        />
      </p>
      <p v-else-if="problem === 'ambiguous'" class="flex items-center gap-1.5 text-sm text-warning">
        <UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0" />
        {{ t('spreadsheet.file.ambiguous') }}
      </p>
      <p v-else-if="layout.detected" class="flex items-center gap-1.5 text-sm text-dimmed">
        <UIcon name="i-lucide-circle-check" class="size-4 text-success" />
        {{ t('spreadsheet.file.detected') }}
      </p>
    </template>

    <div
      v-if="!noPreview && layout.preview.length"
      class="overflow-x-auto rounded-lg border border-default bg-default"
    >
      <table class="w-full border-collapse text-[12.5px]">
        <tbody>
          <tr
            v-for="row in layout.preview"
            :key="row.rowNumber"
            :class="{
              'text-dimmed': row.kind === 'title',
              'bg-primary/6 font-semibold text-highlighted': row.kind === 'header',
              'text-toned': row.kind === 'data',
            }"
          >
            <td
              class="w-10 border-e border-default px-2 py-1.5 text-end font-mono text-[11px] text-dimmed tabular-nums"
            >
              {{ row.rowNumber }}
            </td>
            <td
              v-for="index in previewWidth"
              :key="index"
              class="max-w-40 truncate border-b border-default/60 px-2.5 py-1.5 whitespace-nowrap"
              :class="row.kind === 'title' ? 'italic' : ''"
            >
              {{ row.cells[index - 1] }}
            </td>
            <td
              class="w-full border-b border-default/60 px-2 py-1.5 text-end text-[11px] font-normal text-dimmed"
            >
              <template v-if="row.kind === 'title'">{{
                t('spreadsheet.file.previewTitle')
              }}</template>
              <template v-else-if="row.kind === 'header'">{{
                t('spreadsheet.file.previewHeader')
              }}</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
