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

const center = {
  affiliationGroups: [
    {
      id: 'school-level',
      items: [
        { id: 'primary', name: 'Primary' },
        { id: 'secondary', name: 'Secondary' },
        { id: 'higher-education', name: 'Higher education' },
      ],
      name: 'School level',
      slug: 'schoolLevel',
    },
    {
      id: 'programme',
      items: [
        { id: 'general-english', name: 'General English' },
        { id: 'business-english', name: 'Business English' },
      ],
      name: 'Programme',
      slug: 'programme',
    },
  ],
  country: 'France',
  id: 'tc_paris',
  products: [
    { id: 'prod_be_4skills', name: 'Positionnement VTest Business English - 4 Skills' },
    { id: 'prod_general_4skills', name: 'Positionnement VTest English - 4 Skills' },
  ],
}

function createStructureStressSchema() {
  return defineSpreadsheetSchema({
    columns: {
      dynamic: ({ dynamic }) => [
        dynamic.optionGroups({
          header: {
            strategy: 'template',
            template: ({ source }) => `${source.name}: PRÉREQUIS CECR`,
          },
          itemKey: (group) => group.id,
          itemLabel: (group) => group.name,
          key: 'affiliations',
          options: (group) =>
            group.items.map((item) => ({
              label: item.name,
              value: item.id,
            })),
          output: {
            into: 'affiliations',
          },
          source: center.affiliationGroups,
          targetKey: (group) => group.slug,
          values: {
            itemModifiers: ['trim', 'case-insensitive', 'accent-insensitive'],
            mode: 'csv',
            resolve: 'label',
            separator: ',',
          },
        }),
      ],
      static: (column) => [
        column.text('testCenterId', {
          match: { headers: ['Test center ID'] },
          rules: (v) => [v.required()],
        }),
        column.text('secureCode', {
          match: { headers: ['Secure code'] },
          rules: (v) => [v.required()],
        }),
        column.text('examNameRaw', {
          match: { headers: ['Exam name'] },
          rules: (v) => [v.required()],
        }),
        column.text('firstName', {
          match: { headers: ['First name'] },
          rules: (v) => [v.required()],
        }),
        column.text('lastName', {
          match: { headers: ['Last name'] },
          rules: (v) => [v.required()],
        }),
        column.email('email', {
          match: { headers: ['Email'] },
          parse: ({ cell }) => cell.text.trim().toLowerCase(),
          rules: (v) => [v.required()],
        }),
        column.date('completionDate', {
          match: { headers: ['Completed date'] },
          parse: ({ cell }) => new Date(`${cell.text.trim()} UTC`).toISOString(),
          rules: (v) => [v.required()],
        }),
        column.enum('status', {
          match: { headers: ['Status'] },
          options: ['Done'],
          rules: (v) => [v.required()],
        }),
        column.text('country', {
          match: { headers: ['Tc country'] },
          rules: (v) => [v.required()],
        }),
        column.text('batchName', { match: { headers: ['Batch'] } }),
        column.text('scores.general', { match: { headers: ['General level'] } }),
        column.text('scores.listening', { match: { headers: ['Listening level'] } }),
      ],
    },
    file: {
      accept: ['.xlsx', '.xls', '.csv'],
      maxRecords: 12,
    },
    header: { strategy: 'selection' },
    importKey: 'playground.spreadsheet.structure-stress',
    matching: { strategy: 'smart' },
    references: (reference) => [
      reference.select('productId', {
        options: center.products.map((product) => ({
          label: product.name,
          value: product.id,
        })),
        source: 'examNameRaw',
      }),
    ],
    sheet: { strategy: 'selection' },
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
        : (center.products[index % center.products.length]?.name ?? ''),
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
    binary: write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    }),
    fileName: 'spreadsheet-structure-stress.xlsx',
  }
}

onMounted(() => {
  const workbook = createWorkbook()
  spreadsheet.loadSource({
    fileName: workbook.fileName,
    source: workbook.binary,
  })
})
</script>

<template>
  <section class="h-full overflow-hidden bg-default">
    <SpreadsheetImport
      :spreadsheet="spreadsheet"
      :title="t('playground.spreadsheetPages.structureStress.title')"
      :description="t('playground.spreadsheetPages.structureStress.description')"
      closable
      mode="fullscreen"
      @close="navigateTo('/spreadsheet')"
    />
  </section>
</template>
