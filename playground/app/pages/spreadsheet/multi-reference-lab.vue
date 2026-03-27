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
  { id: 'prod_be', name: 'Business English 4 Skills' },
  { id: 'prod_ge', name: 'General English 4 Skills' },
  { id: 'prod_cr', name: 'Career Readiness Bundle' },
] as const

function createMultiReferenceSchema() {
  return defineSpreadsheetSchema({
    importKey: 'playground.spreadsheet.multi-reference-lab',
    file: {
      accept: ['.xlsx', '.xls', '.csv'],
      maxRecords: 50,
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
          rules: v => [v.required()],
        }),
        column.text('productLabels', {
          match: {
            headers: ['Products'],
          },
          multiple: {
            separator: ',',
          },
          rules: v => [v.required()],
        }),
        column.text('notes', {
          match: {
            headers: ['Notes'],
          },
        }),
      ],
    },
    references: reference => [
      reference.select('productIds', {
        source: 'productLabels',
        options: products.map(product => ({
          label: product.name,
          value: product.id,
        })),
      }),
    ],
  })
}

const schema = createMultiReferenceSchema()
const spreadsheet = useSpreadsheetImport(schema)

function createWorkbook() {
  const rows = [
    ['Candidate', 'Products', 'Notes'],
    [
      'Lina Martin',
      'Business English 4 Skills, Career Readiness Bundle',
      'Valid multi-reference row. productIds should resolve to two ids in the same order.',
    ],
    [
      'Noah Bernard',
      'Career Readiness Bundle, General English 4 Skills',
      'Valid multi-reference row with reversed source order.',
    ],
    [
      'Emma Laurent',
      'Business English 4 Skills, Unknown Product',
      'Partially unresolved row so the references step stays active.',
    ],
  ]

  const workbook = utils.book_new()
  const sheet = utils.aoa_to_sheet(rows)
  utils.book_append_sheet(workbook, sheet, 'Multi references')

  return {
    fileName: 'spreadsheet-multi-reference-lab.xlsx',
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
      :title="t('playground.spreadsheetPages.multiReference.title')"
      :description="t('playground.spreadsheetPages.multiReference.description')"
      closable
      mode="fullscreen"
      @close="navigateTo('/spreadsheet')"
    />
  </section>
</template>
