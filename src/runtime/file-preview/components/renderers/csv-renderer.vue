<script setup lang="ts">
import { computed, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import { useFilePreviewText } from '../../composables/use-file-preview-text'
import type { FilePreviewRendererEmits, FilePreviewRendererProps } from '../../types'
import { parseCsv } from '../../utils/csv'
import FilePreviewTextLoading from './file-preview-text-loading.vue'

/** Rows shown, not counting the header. */
const MAX_ROWS = 1000
const NUMBER = /^-?[\d\s  .,]+%?$/u

const props = defineProps<FilePreviewRendererProps>()
const emit = defineEmits<FilePreviewRendererEmits>()

const { t } = useUiToolsLocale()
const content = useFilePreviewText(props)
const table = computed(() => {
  const parsed = parseCsv(content.text.value, {
    delimiter: props.file.extension === 'tsv' ? '\t' : undefined,
    maxRows: MAX_ROWS + 1,
  })
  const [head = [], ...rows] = parsed.rows
  const width = Math.max(head.length, ...rows.map((row) => row.length))
  const columns = Array.from({ length: width }, (_, index) => head[index] ?? '')
  const numeric = columns.map((_, index) => {
    const values = rows.map((row) => (row[index] ?? '').trim()).filter(Boolean)
    return values.length > 0 && values.every((value) => NUMBER.test(value))
  })
  return { columns, complete: parsed.complete, delimiter: parsed.delimiter, numeric, rows }
})
const facts = computed(() =>
  [
    t('filePreview.csv.rows', { count: table.value.rows.length.toLocaleString() }),
    t('filePreview.csv.columns', { count: table.value.columns.length }),
    t('filePreview.csv.delimiter', {
      value: table.value.delimiter === '\t' ? t('filePreview.csv.tab') : table.value.delimiter,
    }),
    content.notice.value,
  ].filter((fact) => fact !== null),
)

watch(
  content.status,
  (status) => {
    if (status === 'error')
      emit('error', { message: content.error.value?.message, reason: 'source' })
    if (status !== 'ready') return
    emit('ready', [
      { label: t('filePreview.fields.rows'), value: table.value.rows.length.toLocaleString() },
      { label: t('filePreview.fields.columns'), value: String(table.value.columns.length) },
    ])
  },
  { immediate: true },
)
</script>

<template>
  <div
    v-if="content.status.value === 'ready'"
    class="absolute inset-0 flex flex-col bg-default"
    data-file-preview-csv=""
  >
    <div class="min-h-0 flex-1 overflow-auto">
      <table class="min-w-full border-separate border-spacing-0 text-[12.5px] tabular-nums">
        <thead>
          <tr>
            <th
              class="sticky top-0 left-0 z-20 min-w-10 border-e border-b border-default bg-elevated px-3 py-1.5 text-end font-normal text-dimmed"
              scope="col"
            >
              #
            </th>
            <th
              v-for="(column, index) in table.columns"
              :key="index"
              scope="col"
              :class="[
                'sticky top-0 z-10 max-w-72 truncate border-e border-b border-default bg-elevated px-3 py-1.5 font-semibold whitespace-nowrap text-toned',
                table.numeric[index] ? 'text-end' : 'text-start',
              ]"
            >
              {{ column }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in table.rows" :key="rowIndex" class="hover:bg-elevated/60">
            <td
              class="sticky left-0 z-10 border-e border-b border-(--ui-border-muted) bg-elevated px-3 py-1.5 text-end text-dimmed"
            >
              {{ rowIndex + 1 }}
            </td>
            <td
              v-for="(_, index) in table.columns"
              :key="index"
              :title="row[index]"
              :class="[
                'max-w-72 truncate border-e border-b border-(--ui-border-muted) px-3 py-1.5 whitespace-nowrap text-default',
                table.numeric[index] ? 'text-end' : 'text-start',
              ]"
            >
              {{ row[index] ?? '' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div
      class="flex shrink-0 flex-wrap gap-x-3.5 gap-y-1 border-t border-default bg-elevated px-3.5 py-1.5 text-[11.5px] text-muted tabular-nums"
      data-file-preview-facts=""
    >
      <span v-for="fact in facts" :key="fact">{{ fact }}</span>
    </div>
  </div>
  <FilePreviewTextLoading v-else />
</template>
