<script setup lang="ts">
import { onMounted } from 'vue'
import { utils, write } from 'xlsx'

import { useSpreadsheetImport } from '#ui-tools/spreadsheet'
import SpreadsheetImport from '#ui-tools/spreadsheet/components/SpreadsheetImport.vue'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'

definePageMeta({
  layout: 'empty',
})

const products = [
  { label: 'Business English 4 Skills', value: 'prod_be' },
  { label: 'Career Readiness Bundle', value: 'prod_cr' },
]

function createReferenceRulesSchema() {
  return defineSpreadsheetSchema({
    importKey: 'playground.spreadsheet.reference-rules-lab',
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
          rules: v => [v.required()],
        }),
        column.text('optionalProductLabel', {
          match: {
            headers: ['Optional product'],
          },
        }),
        column.text('requiredProductLabel', {
          match: {
            headers: ['Required product'],
          },
        }),
      ],
    },
    references: reference => [
      reference.select('optionalProductId', {
        source: 'optionalProductLabel',
        options: products,
      }),
      reference.select('requiredProductId', {
        source: 'requiredProductLabel',
        options: products,
        rules: v => [
          v.required({
            message: 'Required product must be matched before import',
          }),
        ],
      }),
    ],
  })
}

const schema = createReferenceRulesSchema()
const spreadsheet = useSpreadsheetImport(schema)

function createWorkbook() {
  const rows = [
    ['Candidate', 'Optional product', 'Required product'],
    ['Lina Martin', 'Business English 4 Skills', 'Career Readiness Bundle'],
    ['Noah Bernard', 'Unknown Product', 'Career Readiness Bundle'],
    ['Emma Laurent', 'Business English 4 Skills', 'Unknown Product'],
  ]

  const workbook = utils.book_new()
  const sheet = utils.aoa_to_sheet(rows)
  utils.book_append_sheet(workbook, sheet, 'Reference rules')

  return {
    fileName: 'spreadsheet-reference-rules-lab.xlsx',
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
      title="Reference Rules Lab"
      description="Unresolved references are allowed in matching, then reference rules decide row validity in review."
      mode="fullscreen"
    />
  </section>
</template>
