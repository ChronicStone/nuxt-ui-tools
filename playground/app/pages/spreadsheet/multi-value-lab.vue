<script setup lang="ts">
import { onMounted } from 'vue'
import { utils, write } from 'xlsx'

import { useSpreadsheetImport } from '#ui-tools/spreadsheet'
import type { SpreadsheetData, SpreadsheetRowData } from '#ui-tools/spreadsheet'
import SpreadsheetImport from '#ui-tools/spreadsheet/components/spreadsheet-import.vue'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'

definePageMeta({
  layout: 'empty',
})

const { t } = useI18n()

const center = {
  country: 'France',
  id: 'tc_lyon',
  name: 'Lyon Import Lab',
  products: [
    { id: 'prod_be_4skills', name: 'Business English 4 Skills' },
    { id: 'prod_general_4skills', name: 'General English 4 Skills' },
    { id: 'prod_career_readiness', name: 'Career Readiness Bundle' },
  ],
} as const

function createMultiValueSchema() {
  return defineSpreadsheetSchema({
    columns: {
      static: (column) => [
        column.text('testCenterId', {
          match: {
            headers: ['Test center ID'],
          },
          rules: (v) => [
            v.required(),
            v.validate({
              message: `Row test center must be ${center.id}`,
              name: 'testCenterMatch',
              validator: (value: string) => value === center.id,
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
              message: 'At least 2 tags are required',
              name: 'tagCount',
              validator: (value: string[]) => value.length >= 2,
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
              message: 'Every score must be at least 50',
              name: 'allPassing',
              validator: (value: number[]) => value.every((score) => score >= 50),
            }),
          ],
        }),
        column.option('productIds', {
          match: {
            headers: ['Products'],
          },
          multiple: {
            matchBy: 'label',
            separator: ',',
          },
          options: ({ context }) =>
            context.products.map((product) => ({
              label: product.name,
              value: product.id,
            })),
          rules: (v) => [
            v.validate({
              message: 'At least one product must be selected',
              name: 'selectedProducts',
              validator: (value: string[]) => value.length >= 1,
            }),
          ],
        }),
        column.enum('statuses', {
          match: {
            headers: ['Statuses'],
          },
          multiple: {
            itemModifiers: ['trim', 'case-insensitive'],
            separator: '|',
          },
          options: ['pending', 'validated', 'archived'],
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
      candidateName: row.candidateName,
      flags: row.flags,
      notes: row.notes,
      productIds: row.productIds,
      scores: row.scores,
      statuses: row.statuses,
      tags: row.tags,
      testCenterId: row.testCenterId,
    }),
    context: [
      {
        key: 'products',
        query: () => ({
          queryFn: () => center.products,
          queryKey: ['playground', 'spreadsheet', 'multi-value-lab', 'products'],
        }),
      },
    ],
    file: {
      accept: ['.xlsx', '.xls', '.csv'],
      maxRecords: 100,
    },
    header: {
      strategy: 'detected',
    },
    importKey: 'playground.spreadsheet.multi-value-lab',
    matching: {
      strategy: 'smart',
    },
    sheet: {
      strategy: 'auto',
    },
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
    binary: write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    }),
    fileName: 'spreadsheet-multi-value-lab.xlsx',
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
      :title="t('playground.spreadsheetPages.multiValue.title')"
      :description="t('playground.spreadsheetPages.multiValue.description')"
      closable
      mode="fullscreen"
      @close="navigateTo('/spreadsheet')"
    />
  </section>
</template>
