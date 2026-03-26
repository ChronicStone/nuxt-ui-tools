<script setup lang="ts">
import { onMounted } from 'vue'
import { utils, write } from 'xlsx'

import { sheetRules, useSpreadsheetImport } from '#ui-tools/spreadsheet'
import SpreadsheetImport from '#ui-tools/spreadsheet/components/SpreadsheetImport.vue'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'

definePageMeta({
  layout: 'empty',
})

const center = {
  id: 'tc_newyork',
  country: 'United States',
  products: [
    { id: 'prod_corp_4skills', name: 'Placement Test Corporate English - 4 Skills' },
    { id: 'prod_remote_screening', name: 'Remote Screening Bundle' },
  ],
  affiliationGroups: [
    {
      id: 'district',
      name: 'District',
      slug: 'district',
      items: [
        { id: 'manhattan', name: 'Manhattan' },
        { id: 'queens', name: 'Queens' },
      ],
    },
    {
      id: 'delivery-format',
      name: 'Delivery format',
      slug: 'deliveryFormat',
      items: [
        { id: 'onsite', name: 'Onsite' },
        { id: 'remote', name: 'Remote' },
      ],
    },
  ],
}

function createReferenceReconciliationSchema() {
  return defineSpreadsheetSchema({
    importKey: 'playground.spreadsheet.reference-reconciliation',
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
          rules: { required: sheetRules.required() },
        }),
        column.text('secureCode', {
          match: { headers: ['Secure code'] },
          rules: { required: sheetRules.required() },
        }),
        column.text('examNameRaw', {
          match: { headers: ['Exam name'] },
          rules: { required: sheetRules.required() },
        }),
        column.text('firstName', {
          match: { headers: ['First name'] },
          rules: { required: sheetRules.required() },
        }),
        column.text('lastName', {
          match: { headers: ['Last name'] },
          rules: { required: sheetRules.required() },
        }),
        column.email('email', {
          match: { headers: ['Email'] },
          parse: ({ cell }) => cell.text.trim().toLowerCase(),
          rules: { required: sheetRules.required() },
        }),
        column.date('completionDate', {
          match: { headers: ['Completed date'] },
          parse: ({ cell }) => new Date(`${cell.text.trim()} UTC`).toISOString(),
          rules: { required: sheetRules.required() },
        }),
        column.enum('status', {
          match: { headers: ['Status'] },
          options: ['Done'],
          rules: { required: sheetRules.required() },
        }),
        column.text('country', {
          match: { headers: ['Tc country'] },
          rules: { required: sheetRules.required() },
        }),
        column.text('batchName', { match: { headers: ['Batch'] } }),
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

const schema = createReferenceReconciliationSchema()

const spreadsheet = useSpreadsheetImport(schema)

function createWorkbook() {
  const workbook = utils.book_new()
  const rows = [
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
      'District: PRÉREQUIS CECR',
      'Delivery format: PRÉREQUIS CECR',
    ],
    [
      center.id,
      'NY-101-A',
      center.products[0]?.name ?? '',
      'Mia',
      'Brooks',
      'mia.brooks@example.com',
      'April 03, 2024 10:05 AM',
      'Done',
      'April NYC',
      center.country,
      'Manhattan',
      'Onsite',
    ],
    [
      center.id,
      'NY-102-B',
      'Remote screening gold package',
      'Jamie',
      'Resolver',
      'jamie.resolver@example.com',
      'April 04, 2024 01:20 PM',
      'Done',
      'April NYC',
      center.country,
      'Queens',
      'Remote',
    ],
  ]
  const sheet = utils.aoa_to_sheet(rows)
  utils.book_append_sheet(workbook, sheet, 'Assessments')

  return {
    fileName: 'spreadsheet-reference-reconciliation.xlsx',
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
      title="Reference Reconciliation"
      description="This scenario keeps one unresolved product label visible so the reconciliation step stays active."
      mode="fullscreen"
    />
  </section>
</template>
