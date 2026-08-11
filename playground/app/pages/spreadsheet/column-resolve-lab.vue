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

const centers = [
  { label: '1201', value: 1201 },
  { label: '1202', value: 1202 },
] as const

function createColumnResolveSchema() {
  return defineSpreadsheetSchema({
    importKey: 'playground.spreadsheet.column-resolve-lab',
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
        column.text('productId', {
          match: {
            headers: ['Product'],
          },
          resolve: {
            options: products,
          },
          rules: (v) => [
            v.required({
              message: 'Product must be resolved before import',
            }),
          ],
        }),
        column.number('centerId', {
          match: {
            headers: ['Center code'],
          },
          resolve: {
            options: centers,
          },
        }),
      ],
    },
  })
}

const schema = createColumnResolveSchema()
const spreadsheet = useSpreadsheetImport(schema)

function createWorkbook() {
  const rows = [
    ['Candidate', 'Product', 'Center code'],
    ['Lina Martin', 'Business English 4 Skills', '1201'],
    ['Noah Bernard', 'Unknown Product', '1202'],
    ['Emma Laurent', 'Career Readiness Bundle', '9999'],
  ]

  const workbook = utils.book_new()
  const sheet = utils.aoa_to_sheet(rows)
  utils.book_append_sheet(workbook, sheet, 'Column resolve')

  return {
    fileName: 'spreadsheet-column-resolve-lab.xlsx',
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
      :title="t('playground.spreadsheetPages.columnResolve.title')"
      :description="t('playground.spreadsheetPages.columnResolve.description')"
      closable
      mode="fullscreen"
      @close="navigateTo('/spreadsheet')"
    />
  </section>
</template>
