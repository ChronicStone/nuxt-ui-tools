<script setup lang="ts">
import { onMounted } from 'vue'
import { utils, write } from 'xlsx'

import {
  useSpreadsheetImport,
  type SpreadsheetData,
  type SpreadsheetRowData,
} from '#ui-tools/spreadsheet'
import SpreadsheetImport from '#ui-tools/spreadsheet/components/SpreadsheetImport.vue'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'

definePageMeta({
  layout: 'empty',
})

const { t } = useI18n()

const center = {
  id: 'tc_lyon',
  name: 'Lyon Import Lab',
  country: 'France',
  products: [
    { id: 'prod_be_4skills', name: 'Business English 4 Skills' },
    { id: 'prod_general_4skills', name: 'General English 4 Skills' },
    { id: 'prod_career_readiness', name: 'Career Readiness Bundle' },
  ],
} as const

function createMultiValueSchema() {
  return defineSpreadsheetSchema({
    importKey: 'playground.spreadsheet.multi-value-lab',
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
          queryKey: ['playground', 'spreadsheet', 'multi-value-lab', 'products'],
          queryFn: async () => center.products,
        }),
      },
    ],
    columns: {
      static: (column) => [
        column.text('testCenterId', {
          match: {
            headers: ['Test center ID'],
          },
          rules: (v) => [
            v.required(),
            v.validate({
              name: 'testCenterMatch',
              validator: (value: string) => value === center.id,
              message: `Row test center must be ${center.id}`,
            }),
          ],
        }),
        column.text('candidateName', {
          match: {
            headers: ['Candidate'],
          },
          rules: (v) => [v.required()],
        }),
        column.text('tags', {
          match: {
            headers: ['Tags'],
          },
          multiple: true,
          rules: (v) => [
            v.validate({
              name: 'tagCount',
              validator: (value: string[]) => value.length >= 2,
              message: 'At least 2 tags are required',
            }),
          ],
        }),
        column.number('scores', {
          match: {
            headers: ['Scores'],
          },
          multiple: {
            separator: ';',
          },
          rules: (v) => [
            v.validate({
              name: 'allPassing',
              validator: (value: number[]) => value.every((score) => score >= 50),
              message: 'Every score must be at least 50',
            }),
          ],
        }),
        column.option('productIds', {
          match: {
            headers: ['Products'],
          },
          options: ({ context }) =>
            context.products.map((product) => ({
              label: product.name,
              value: product.id,
            })),
          multiple: {
            separator: ',',
            matchBy: 'label',
          },
          rules: (v) => [
            v.validate({
              name: 'selectedProducts',
              validator: (value: string[]) => value.length >= 1,
              message: 'At least one product must be selected',
            }),
          ],
        }),
        column.enum('statuses', {
          match: {
            headers: ['Statuses'],
          },
          options: ['pending', 'validated', 'archived'],
          multiple: {
            separator: '|',
            itemModifiers: ['trim', 'case-insensitive'],
          },
        }),
        column.boolean('flags', {
          match: {
            headers: ['Flags'],
          },
          multiple: true,
        }),
        column.text('notes', {
          match: {
            headers: ['Notes'],
          },
        }),
      ],
    },
    buildRow: ({ row }) => ({
      testCenterId: row.testCenterId,
      candidateName: row.candidateName,
      tags: row.tags,
      scores: row.scores,
      productIds: row.productIds,
      statuses: row.statuses,
      flags: row.flags,
      notes: row.notes,
    }),
  })
}

const schema = createMultiValueSchema()
const spreadsheet = useSpreadsheetImport(schema)
type output = SpreadsheetData<typeof schema>

function createWorkbook() {
  const rows = [
    ['Test center ID', 'Candidate', 'Tags', 'Scores', 'Products', 'Statuses', 'Flags', 'Notes'],
    [
      center.id,
      'Lina Martin',
      'priority, remote',
      '82;91',
      'Business English 4 Skills, Career Readiness Bundle',
      'Validated | Archived',
      'yes,no,true',
      'Clean valid row covering all multi-value column types.',
    ],
    [
      center.id,
      'Noah Bernard',
      'solo',
      '82;49',
      'General English 4 Skills',
      'pending',
      '1,0',
      'Row is structurally valid but fails the array-level score rule.',
    ],
    [
      center.id,
      'Emma Laurent',
      'priority, hybrid',
      '88;oops',
      'Business English 4 Skills, Ghost Product',
      'Validated | Unknown',
      'yes,maybe',
      'Row demonstrates token parsing errors and partial array output.',
    ],
    [
      'tc_other',
      'Milo Petit',
      '',
      '',
      '',
      '',
      '',
      'Row demonstrates required and single-value validation errors on empty multi-value cells.',
    ],
  ]

  const workbook = utils.book_new()
  const sheet = utils.aoa_to_sheet(rows)
  utils.book_append_sheet(workbook, sheet, 'Multi value import')

  return {
    fileName: 'spreadsheet-multi-value-lab.xlsx',
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
      :title="t('playground.spreadsheetPages.multiValue.title')"
      :description="t('playground.spreadsheetPages.multiValue.description')"
      closable
      mode="fullscreen"
      @close="navigateTo('/spreadsheet')"
    />
  </section>
</template>
