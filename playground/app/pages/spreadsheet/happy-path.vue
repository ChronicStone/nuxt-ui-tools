<script setup lang="ts">
import { onMounted } from 'vue'
import { utils, write } from 'xlsx'

import { stringCodec, useQueryState } from '#ui-tools/query-state'
import { useSpreadsheetImport } from '#ui-tools/spreadsheet'
import SpreadsheetImport from '#ui-tools/spreadsheet/components/SpreadsheetImport.vue'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'

definePageMeta({
  layout: 'empty',
})

const center = {
  id: 'tc_paris',
  name: 'Paris Academic Hub',
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

function createHappyPathSchema() {
  return defineSpreadsheetSchema({
    importKey: 'playground.spreadsheet.happy-path',
    file: {
      accept: ['.xlsx', '.xls', '.csv'],
      maxRecords: 100,
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
    context: [
      {
        key: 'products',
        query: () => ({
          queryKey: ['playground', 'spreadsheet', 'happy-path', 'products'],
          queryFn: async () => center.products,
        }),
      },
      {
        key: 'affiliationGroups',
        query: () => ({
          queryKey: ['playground', 'spreadsheet', 'happy-path', 'affiliation-groups'],
          queryFn: async () => center.affiliationGroups,
        }),
      },
    ],
    columns: {
      static: (column) => [
        column.text('testCenterId', {
          match: {
            headers: ['Test center ID'],
          },
          rules: v => [
            v.required(),
            v.validate({
              name: 'testCenterMismatch',
              validator: (value: string) => value === center.id,
              message: 'Row test center does not match this playground.',
            }),
          ],
        }),
        column.text('secureCode', {
          match: {
            headers: ['Secure code'],
          },
          rules: v => [v.required()],
        }),
        column.text('examNameRaw', {
          match: {
            headers: ['Exam name'],
          },
          rules: v => [v.required()],
        }),
        column.option('productId', {
          match: {
            headers: ['Product'],
          },
          options: ({ context }) =>
            context.products.map(product => ({
              label: product.name,
              value: product.id,
            })),
          rules: v => [v.required()],
        }),
        column.text('firstName', {
          match: {
            headers: ['First name'],
          },
          rules: v => [v.required()],
        }),
        column.text('lastName', {
          match: {
            headers: ['Last name'],
          },
          rules: v => [v.required()],
        }),
        column.email('email', {
          match: {
            headers: ['Email'],
          },
          parse: ({ cell }) => cell.text.trim().toLowerCase(),
          rules: v => [v.required()],
        }),
        column.date('completionDate', {
          match: {
            headers: ['Completed date'],
          },
          parse: ({ cell }) => new Date(`${cell.text.trim()} UTC`).toISOString(),
          rules: v => [v.required()],
        }),
        column.enum('status', {
          match: {
            headers: ['Status'],
          },
          options: ['Done'],
          rules: v => [v.required()],
        }),
        column.text('country', {
          match: {
            headers: ['Tc country'],
          },
          rules: v => [v.required()],
        }),
        column.text('batchName', {
          match: {
            headers: ['Batch'],
          },
        }),
        column.text('scores.general', {
          match: {
            headers: ['General level'],
          },
        }),
        column.text('scores.listening', {
          match: {
            headers: ['Listening level'],
          },
        }),
      ],
      dynamic: ({ dynamic, context }) => [
        dynamic.optionGroups({
          key: 'affiliations',
          source: context.affiliationGroups,
          itemKey: (group) => group.id,
          itemLabel: (group) => group.name,
          targetKey: (group) => group.slug,
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
    buildRow: ({ row }) => ({
      testCenterId: row.testCenterId,
      secureCode: row.secureCode,
      candidate: {
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
      },
      examName: row.examNameRaw,
      productId: row.productId,
      completionDate: row.completionDate,
      status: row.status,
      country: row.country,
      batchName: row.batchName,
      scores: row.scores,
    }),
  })
}

const schema = createHappyPathSchema()

const spreadsheet = useSpreadsheetImport(schema)

function createWorkbook() {
  const workbook = utils.book_new()
  const rows = [
    [
      'Test center ID',
      'Secure code',
      'Exam name',
      'Product',
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
    [
      center.id,
      'PAR-001-A',
      center.products[0]?.name ?? '',
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
  utils.book_append_sheet(workbook, sheet, 'Assessments')

  return {
    fileName: 'spreadsheet-happy-path.xlsx',
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
      title="Happy Path Import"
      description="Clean baseline scenario with strong automatic matching and successful reference resolution."
      closable
      mode="fullscreen"
      @close="navigateTo('/spreadsheet')"
    />
  </section>
</template>
