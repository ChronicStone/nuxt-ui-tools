<script setup lang="ts">
import { onMounted } from 'vue'
import { utils, write } from 'xlsx'

import { useSpreadsheetImport } from '#ui-tools/spreadsheet'
import SpreadsheetImport from '#ui-tools/spreadsheet/components/SpreadsheetImport.vue'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'

definePageMeta({
  layout: 'empty',
})

const center = {
  id: 'tc_paris',
  country: 'France',
  products: [
    { id: 'prod_be_4skills', name: 'Positionnement VTest Business English - 4 Skills' },
    { id: 'prod_general_4skills', name: 'Positionnement VTest English - 4 Skills' },
  ],
  affiliationGroups: [
    {
      id: 'school-level',
      name: 'School level',
      slug: 'schoolLevel',
      items: [
        { id: 'primary', name: 'Primary' },
        { id: 'higher-education', name: 'Higher education' },
      ],
    },
    {
      id: 'programme',
      name: 'Programme',
      slug: 'programme',
      items: [
        { id: 'general-english', name: 'General English' },
        { id: 'business-english', name: 'Business English' },
      ],
    },
  ],
}

function createManualMatchingSchema() {
  return defineSpreadsheetSchema({
    importKey: 'playground.spreadsheet.manual-matching',
    file: {
      accept: ['.xlsx', '.xls', '.csv'],
      maxRecords: 100,
    },
    sheet: { strategy: 'selection' },
    header: { strategy: 'selection' },
    matching: { strategy: 'smart' },
    columns: {
      static: (column) => [
        column.text('testCenterId', {
          match: { headers: ['Test center ID'] },
          rules: v => [v.required()],
        }),
        column.text('secureCode', {
          match: { headers: ['Secure code'] },
          rules: v => [v.required()],
        }),
        column.text('examNameRaw', {
          match: { headers: ['Exam name'] },
          rules: v => [v.required()],
        }),
        column.text('firstName', {
          match: { headers: ['First name'] },
          rules: v => [v.required()],
        }),
        column.text('lastName', {
          match: { headers: ['Last name'] },
          rules: v => [v.required()],
        }),
        column.email('email', {
          match: { headers: ['Email'] },
          parse: ({ cell }) => cell.text.trim().toLowerCase(),
          rules: v => [v.required()],
        }),
        column.date('completionDate', {
          match: { headers: ['Completed date'] },
          parse: ({ cell }) => new Date(`${cell.text.trim()} UTC`).toISOString(),
          rules: v => [v.required()],
        }),
        column.enum('status', {
          match: { headers: ['Status'] },
          options: ['Done'],
          rules: v => [v.required()],
        }),
        column.text('country', {
          match: { headers: ['Tc country'] },
          rules: v => [v.required()],
        }),
        column.text('batchName', { match: { headers: ['Batch'] } }),
        column.text('scores.general', { match: { headers: ['General level'] } }),
        column.text('scores.listening', { match: { headers: ['Listening level'] } }),
      ],
      dynamic: ({ dynamic }) => [
        dynamic.optionGroups({
          key: 'affiliations',
          source: center.affiliationGroups,
          itemKey: group => group.id,
          itemLabel: group => group.name,
          targetKey: group => group.slug,
          header: {
            strategy: 'template',
            template: ({ source }) => `${source.name}: PRÉREQUIS CECR`,
          },
          options: group => group.items.map(item => ({
            label: item.name,
            value: item.id,
          })),
          values: {
            mode: 'csv',
            separator: ',',
            resolve: 'label',
            itemModifiers: ['trim', 'case-insensitive', 'accent-insensitive'],
          },
          output: {
            into: 'affiliations',
          },
        }),
      ],
    },
    references: reference => [
      reference.select('productId', {
        source: 'examNameRaw',
        options: center.products.map(product => ({
          label: product.name,
          value: product.id,
        })),
      }),
    ],
  })
}

const schema = createManualMatchingSchema()

const spreadsheet = useSpreadsheetImport(schema)

function createWorkbook() {
  const workbook = utils.book_new()
  const rows = [
    ['Assessment import export'],
    [
      'Assessment Center',
      'Passcode',
      'Session label',
      'Candidate given name',
      'Candidate family name',
      'Candidate email address',
      'Finished at',
      'Completion status',
      'Wave',
      'Country of center',
      'CEFR overall',
      'CEFR listening',
      'School level selection',
      'Programme selection',
    ],
    [
      center.id,
      'PAR-001-A',
      center.products[0]?.name ?? '',
      'Lina',
      'Martin',
      'lina.martin@example.com',
      'March 25, 2024 11:34 AM',
      'Done',
      'Spring Paris 1',
      center.country,
      'B2',
      'B2',
      'Higher education',
      'Business English',
    ],
    [
      center.id,
      'PAR-002-B',
      center.products[1]?.name ?? '',
      'Noah',
      'Bernard',
      'noah.bernard@example.com',
      'March 26, 2024 09:10 AM',
      'Done',
      'Spring Paris 1',
      center.country,
      'B1',
      'B1',
      'Primary',
      'General English',
    ],
  ]
  const sheet = utils.aoa_to_sheet(rows)
  utils.book_append_sheet(workbook, sheet, 'Candidate import')

  return {
    fileName: 'spreadsheet-manual-matching.xlsx',
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
      title="Manual Matching Lab"
      description="Header row confirmation and manual column assignment should be the main focus in this scenario."
      mode="fullscreen"
    />
  </section>
</template>
