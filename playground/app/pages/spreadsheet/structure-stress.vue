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
        { id: 'secondary', name: 'Secondary' },
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

function createStructureStressSchema() {
  return defineSpreadsheetSchema({
    importKey: 'playground.spreadsheet.structure-stress',
    file: {
      accept: ['.xlsx', '.xls', '.csv'],
      maxRecords: 12,
    },
    sheet: { strategy: 'selection' },
    header: { strategy: 'selection' },
    matching: { strategy: 'smart' },
    columns: {
      static: (column) => [
        column.text('testCenterId', { required: true, match: { headers: ['Test center ID'] } }),
        column.text('secureCode', { required: true, match: { headers: ['Secure code'] } }),
        column.text('examNameRaw', { required: true, match: { headers: ['Exam name'] } }),
        column.text('firstName', { required: true, match: { headers: ['First name'] } }),
        column.text('lastName', { required: true, match: { headers: ['Last name'] } }),
        column.email('email', {
          required: true,
          match: { headers: ['Email'] },
          parse: ({ cell }) => cell.text.trim().toLowerCase(),
        }),
        column.date('completionDate', {
          required: true,
          match: { headers: ['Completed date'] },
          parse: ({ cell }) => new Date(`${cell.text.trim()} UTC`).toISOString(),
        }),
        column.enum('status', {
          required: true,
          match: { headers: ['Status'] },
          options: ['Done'],
        }),
        column.text('country', { required: true, match: { headers: ['Tc country'] } }),
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
            normalize: ['trim', 'case-insensitive', 'accent-insensitive'],
          },
          options: {
            resolve: group => group.items,
            optionLabel: item => item.name,
            optionValue: item => item.id,
          },
          values: {
            mode: 'csv',
            separator: ',',
            resolve: 'label',
            normalize: ['trim', 'case-insensitive', 'accent-insensitive'],
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
        options: center.products,
        optionValue: product => product.id,
        optionLabel: product => product.name,
      }),
    ],
  })
}

const schema = createStructureStressSchema()

const spreadsheet = useSpreadsheetImport(schema)

function createWorkbook() {
  const workbook = utils.book_new()
  const mainRows = [
    ['Assessment import export'],
    ['Generated for stress testing'],
    [
      'Test center ID',
      'Secure code',
      'Exam name',
      'First name',
      'Last name',
      'Email',
      'Completed date',
      'Status',
      'Batch',
      'Tc country',
      'General level',
      'Listening level',
      'School level: PRÉREQUIS CECR',
      'Programme: PRÉREQUIS CECR',
    ],
    ...Array.from({ length: 18 }, (_, index) => [
      index === 14 ? `${center.id}-other` : center.id,
      `STRESS-${String(index + 1).padStart(3, '0')}`,
      index % 5 === 0
        ? 'Unknown exam bundle'
        : center.products[index % center.products.length]?.name ?? '',
      index === 10 ? '' : `Candidate ${index + 1}`,
      `Stress ${index + 1}`,
      index === 10 ? '' : `candidate.${index + 1}@example.com`,
      'March 25, 2024 11:34 AM',
      'Done',
      `Stress wave ${Math.floor(index / 3) + 1}`,
      center.country,
      index % 4 === 0 ? '' : 'B2',
      'B1',
      index % 6 === 0 ? 'Unknown option' : 'Higher education',
      index % 2 === 0 ? 'Business English' : 'General English',
    ]),
  ]
  const mainSheet = utils.aoa_to_sheet(mainRows)
  utils.book_append_sheet(workbook, mainSheet, 'Assessment import raw')
  const overviewSheet = utils.aoa_to_sheet([
    ['Structure stress test'],
    ['Expected sheet', 'Assessment import raw'],
    ['Expected header row', '3'],
  ])
  utils.book_append_sheet(workbook, overviewSheet, 'Overview')

  return {
    fileName: 'spreadsheet-structure-stress.xlsx',
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
      title="Structure Stress Test"
      description="Large seeded workbook with offset headers, broken rows, unresolved values, and import overflow."
      mode="fullscreen"
    />
  </section>
</template>
