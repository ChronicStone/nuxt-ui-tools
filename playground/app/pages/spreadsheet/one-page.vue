<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import { useSpreadsheetImport } from '#ui-tools/spreadsheet'
import SpreadsheetImportColumnMapping from '#ui-tools/spreadsheet/components/parts/spreadsheet-import-column-mapping.vue'
import SpreadsheetImportDropzone from '#ui-tools/spreadsheet/components/parts/spreadsheet-import-dropzone.vue'
import SpreadsheetImportFileCard from '#ui-tools/spreadsheet/components/parts/spreadsheet-import-file-card.vue'
import SpreadsheetImportProgress from '#ui-tools/spreadsheet/components/parts/spreadsheet-import-progress.vue'
import SpreadsheetImportStats from '#ui-tools/spreadsheet/components/parts/spreadsheet-import-stats.vue'
import SpreadsheetImportSubmitButton from '#ui-tools/spreadsheet/components/parts/spreadsheet-import-submit-button.vue'
import SpreadsheetImportTableToolbar from '#ui-tools/spreadsheet/components/parts/spreadsheet-import-table-toolbar.vue'
import SpreadsheetImportTable from '#ui-tools/spreadsheet/components/parts/spreadsheet-import-table.vue'
import SpreadsheetImportValueMapping from '#ui-tools/spreadsheet/components/parts/spreadsheet-import-value-mapping.vue'
import SpreadsheetImportRoot from '#ui-tools/spreadsheet/components/spreadsheet-import-root.vue'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'

definePageMeta({ layout: 'empty' })

const { t } = useI18n()

/** A price list imported from our own template: fixed sheet, fixed header row, nothing to guess. */
const ratesImport = defineSpreadsheetSchema({
  key: 'playground.rates',
  file: { headerRow: 1 },
  columns: (c) =>
    c
      .text('code', { label: 'Product code', headers: 'Code', required: true })
      .select('currency', { label: 'Currency', options: ['EUR', 'USD', 'GBP'], required: true })
      .number('price', { label: 'Price', decimal: ',', required: true, rules: (v) => [v.min(0)] })
      .date('validFrom', { label: 'Valid from', headers: 'From', formats: ['dd/MM/yyyy'] }),
  rows: { key: (row) => row.code, duplicates: 'keep-last' },
})

const importer = useSpreadsheetImport(ratesImport, {
  async onSubmit({ rows, reportProgress }) {
    await new Promise((resolve) => setTimeout(resolve, 400))
    reportProgress(rows.length)
  },
})
const loaded = computed(() => importer.file.loaded)

function loadSample() {
  importer.file.paste(
    [
      'Code\tCurrency\tPrice\tFrom',
      'EN-4\tEUR\t89,90\t01/09/2026',
      'BE-4\tEUR\t99\t01/09/2026',
      'EN-S\tYEN\t49,50\t01/09/2026',
      'EN-4\tEUR\t84,90\t15/09/2026',
      'FR-4\tEUR\t-5\t01/10/2026',
    ].join('\n'),
    'rates.tsv',
  )
}
</script>

<template>
  <section class="min-h-full bg-muted/60 px-4 py-10">
    <SpreadsheetImportRoot :importer="importer">
      <div class="mx-auto grid max-w-5xl gap-5 rounded-xl border border-default bg-default p-6">
        <header class="grid gap-1">
          <h1 class="text-lg font-semibold text-highlighted">
            {{ t('playground.spreadsheetPages.onePage.title') }}
          </h1>
          <p class="text-sm text-muted">
            {{ t('playground.spreadsheetPages.onePage.description') }}
          </p>
        </header>
        <template v-if="!loaded">
          <SpreadsheetImportDropzone />
          <UButton
            class="justify-self-start"
            size="sm"
            color="neutral"
            variant="outline"
            label="Paste a sample"
            @click="loadSample"
          />
        </template>
        <template v-else>
          <SpreadsheetImportFileCard />
          <SpreadsheetImportColumnMapping only="missing" />
          <SpreadsheetImportValueMapping only="open" />
          <SpreadsheetImportStats />
          <div class="overflow-hidden rounded-xl border border-default">
            <SpreadsheetImportTableToolbar />
            <SpreadsheetImportTable height="20rem" />
          </div>
          <SpreadsheetImportProgress />
          <SpreadsheetImportSubmitButton class="justify-self-end" />
        </template>
      </div>
    </SpreadsheetImportRoot>
  </section>
</template>
