<script setup lang="ts">
/* oxlint-disable sort-keys -- schema callbacks are typed from `columns`, which must come first */
import { useSpreadsheetImport } from '#ui-tools/spreadsheet'
import SpreadsheetImport from '#ui-tools/spreadsheet/components/spreadsheet-import.vue'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'

definePageMeta({ layout: 'empty' })

const { t } = useI18n()
const ROWS = 5000

const schema = defineSpreadsheetSchema({
  key: 'playground.large-file',
  file: { maxRows: 4800 },
  columns: (c) =>
    c
      .text('code', { label: 'Code', required: true })
      .text('email', {
        label: 'Email',
        required: true,
        rules: (v) => [v.email({ level: 'warning' })],
      })
      .select('level', { label: 'Level', options: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] })
      .number('score', { label: 'Score', rules: (v) => [v.between(0, 100)] })
      .date('date', { label: 'Date', formats: ['dd/MM/yyyy'] }),
  rows: { key: (row) => row.code },
})

const importer = useSpreadsheetImport(schema)

onMounted(() => {
  const lines = ['Code\tEmail\tLevel\tScore\tDate']
  for (let index = 0; index < ROWS; index += 1)
    lines.push(
      [
        `C-${String(index).padStart(5, '0')}`,
        index % 97 === 0 ? 'broken@' : `person${index}@example.com`,
        ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'B3'][index % 7],
        index % 211 === 0 ? '130' : String(index % 100),
        `${String((index % 28) + 1).padStart(2, '0')}/09/2026`,
      ].join('\t'),
    )
  importer.file.paste(lines.join('\n'), `large-${ROWS}.tsv`)
})
</script>

<template>
  <section class="min-h-full bg-muted/60 px-4 py-10">
    <div class="mx-auto max-w-[80rem]">
      <SpreadsheetImport
        :importer="importer"
        :title="t('playground.spreadsheetPages.largeFile.title')"
      />
    </div>
  </section>
</template>
