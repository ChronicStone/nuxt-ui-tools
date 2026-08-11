<script setup lang="ts">
import { onMounted } from 'vue'
import { utils, write } from 'xlsx'

import { useSpreadsheetImport } from '#ui-tools/spreadsheet'
import SpreadsheetImport from '#ui-tools/spreadsheet/components/SpreadsheetImport.vue'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'

definePageMeta({
  layout: 'empty',
})

const { t } = useI18n()

const products = [
  { label: 'Business English 4 Skills', value: 'prod_be' },
  { label: 'Career Readiness Bundle', value: 'prod_cr' },
] as const

function createDerivedReferencesSchema() {
  return defineSpreadsheetSchema({
    importKey: 'playground.spreadsheet.derived-references-lab',
    file: {
      accept: ['.xlsx', '.xls', '.csv'],
      maxRecords: 20,
    },
    sheet: {
      strategy: 'auto',
    },
    header: {
      strategy: 'detected',
    },
    matching: {
      strategy: 'smart',
    },
    columns: {
      static: (column) => [
        column.text('candidateName', {
          match: {
            headers: ['Candidate'],
          },
          rules: (v) => [v.required()],
        }),
        column.text('productLabelRaw', {
          match: {
            headers: ['Product'],
          },
          rules: (v) => [v.required()],
        }),
      ],
    },
    references: (reference) => [
      reference.select('productId', {
        source: 'productLabelRaw',
        options: products,
        rules: (v) => [
          v.required({
            message: 'A product match is required before import',
          }),
        ],
      }),
    ],
  })
}

const schema = createDerivedReferencesSchema()
const spreadsheet = useSpreadsheetImport(schema)

function createWorkbook() {
  const rows = [
    ['Candidate', 'Product'],
    ['Lina Martin', 'Business English 4 Skills'],
    ['Noah Bernard', 'Unknown Product'],
    ['Emma Laurent', 'Career Readiness Bundle'],
  ]

  const workbook = utils.book_new()
  const sheet = utils.aoa_to_sheet(rows)
  utils.book_append_sheet(workbook, sheet, 'Derived references')

  return {
    fileName: 'spreadsheet-derived-references-lab.xlsx',
    binary: write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    }),
  }
}

onMounted(() => {
  const workbook = createWorkbook()
  spreadsheet.loadSource({
    source: workbook.binary,
    fileName: workbook.fileName,
  })
})
</script>

<template>
  <section class="h-full overflow-hidden bg-default">
    <SpreadsheetImport
      :spreadsheet="spreadsheet"
      :title="t('playground.spreadsheetPages.derivedReferences.title')"
      :description="t('playground.spreadsheetPages.derivedReferences.description')"
      closable
      mode="fullscreen"
      @close="navigateTo('/spreadsheet')"
    />
  </section>
</template>
