<script setup lang="ts">
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useSpreadsheetImporter } from '../../composables/use-spreadsheet-import-context'
import type { SpreadsheetImporter } from '../../types'

const props = defineProps<{ importer?: SpreadsheetImporter }>()
defineSlots<{ rows?: () => unknown }>()
const importer = useSpreadsheetImporter(() => props.importer)
const { t } = useUiToolsLocale()

const created = computed(() =>
  importer.value.values.questions
    .filter((question) => question.answer?.action === 'create')
    .map((question) => question.value),
)
const edited = computed(() =>
  importer.value.rows.all.reduce((total, row) => total + row.edited.length, 0),
)
const lines = computed(() => {
  const rows = importer.value.rows
  return [
    { key: 'file', value: importer.value.file.name },
    { key: 'toImport', strong: true, value: rows.importable.length.toLocaleString() },
    ...(rows.byMode.update
      ? [
          { key: 'create', value: rows.byMode.create.toLocaleString() },
          { key: 'update', value: rows.byMode.update.toLocaleString() },
        ]
      : []),
    ...(rows.invalid.length
      ? [{ key: 'invalid', value: rows.invalid.length.toLocaleString() }]
      : []),
    ...(rows.discarded.length
      ? [{ key: 'discarded', value: rows.discarded.length.toLocaleString() }]
      : []),
    ...(edited.value ? [{ key: 'edited', value: edited.value.toLocaleString() }] : []),
    ...(created.value.length ? [{ key: 'created', value: created.value.join(', ') }] : []),
  ]
})
</script>

<template>
  <dl data-spreadsheet-summary class="grid border-t border-default">
    <div
      v-for="line in lines"
      :key="line.key"
      class="grid grid-cols-[minmax(0,14rem)_minmax(0,1fr)] gap-4 border-b border-default py-2.5 text-sm"
    >
      <dt class="text-muted">{{ t(`spreadsheet.summary.${line.key}`) }}</dt>
      <dd
        class="min-w-0 break-words text-highlighted tabular-nums"
        :class="'strong' in line ? 'font-semibold' : ''"
      >
        {{ line.value }}
      </dd>
    </div>
    <slot name="rows" />
  </dl>
</template>
