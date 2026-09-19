<script setup lang="ts">
import { faker } from '@faker-js/faker'
import { onMounted } from 'vue'
import { utils, write } from 'xlsx'

import { createSheetRule, useSpreadsheetImport } from '#ui-tools/spreadsheet'
import SpreadsheetImport from '#ui-tools/spreadsheet/components/spreadsheet-import.vue'
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
        { id: 'secondary', name: 'Secondary' },
        { id: 'higher-education', name: 'Higher education' },
        { id: 'professional', name: 'Professional' },
      ],
      name: 'School level',
      slug: 'schoolLevel',
    },
    {
      id: 'programme',
      items: [
        { id: 'general-english', name: 'General English' },
        { id: 'business-english', name: 'Business English' },
        { id: 'career-readiness', name: 'Career Readiness' },
      ],
      name: 'Programme',
      slug: 'programme',
    },
  ],
  country: 'Spain',
  id: 'tc_madrid',
  products: [
    { id: 'prod_be_4skills', name: 'Positionnement VTest Business English - 4 Skills' },
    { id: 'prod_general_4skills', name: 'Positionnement VTest English - 4 Skills' },
    { id: 'prod_career_screen', name: 'Career Screening English Bundle' },
  ],
} as const

type SpreadsheetProduct = (typeof center.products)[number]
interface SpreadsheetAffiliationOption {
  id: string
  name: string
}

const batchCodeRule = createSheetRule<string, [], NonNullable<unknown>>({
  message: ({ value }) => `"${value}" cannot start with underscore`,
  name: 'batchCode',
  validator: (value) => !value.startsWith('_'),
})

const centerMatchRule = createSheetRule<
  string,
  [expectedId: string],
  {
    expectedId: string
  }
>({
  message: ({ params: [expectedId] }) => `Row test center must be ${expectedId}`,
  name: 'testCenterMatch',
  validator: (value, expectedId) => ({
    $valid: value === expectedId,
    expectedId,
  }),
})

const scoreBandRule = createSheetRule<
  number,
  [min: number, max: number],
  {
    min: number
    max: number
  }
>({
  message: ({ value, params: [min, max] }) => `${value} must be between ${min} and ${max}`,
  name: 'scoreBand',
  validator: (value, min, max) => ({
    $valid: !Number.isNaN(value) && value >= min && value <= max,
    max,
    min,
  }),
})

function createLargeValidationSchema() {
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
          options: (group: { items: readonly SpreadsheetAffiliationOption[] }) =>
            group.items.map((item: SpreadsheetAffiliationOption) => ({
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
          rules: (v) => [v.required(), centerMatchRule(center.id)],
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
        column.text('status', {
          match: { headers: ['Status'] },
          rules: (v) => [v.required(), v.oneOf(['Done'])],
        }),
        column.text('country', {
          match: { headers: ['Tc country'] },
          rules: (v) => [v.required()],
        }),
        column.text('batchName', {
          match: { headers: ['Batch'] },
          rules: (v) => [v.required(), batchCodeRule()],
        }),
        column.number('scores.general', {
          match: { headers: ['General score'] },
          parse: ({ cell }) => Number(cell.text.trim()),
          rules: (v) => [
            v.number({
              message: 'General score must be numeric',
            }),
            scoreBandRule(0, 100),
          ],
        }),
        column.number('scores.listening', {
          match: { headers: ['Listening score'] },
          parse: ({ cell }) => Number(cell.text.trim()),
          rules: (v) => [
            v.number({
              message: 'Listening score must be numeric',
            }),
            scoreBandRule(0, 100),
          ],
        }),
      ],
    },
    file: {
      accept: ['.xlsx', '.xls', '.csv'],
      maxRecords: 500,
    },
    header: { strategy: 'selection' },
    importKey: 'playground.spreadsheet.large-validation-lab',
    matching: { strategy: 'smart' },
    references: (reference) => [
      reference.select('productId', {
        options: center.products.map((product: SpreadsheetProduct) => ({
          label: product.name,
          value: product.id,
        })),
        source: 'examNameRaw',
      }),
    ],
    sheet: { strategy: 'selection' },
  }).refine({
    relations: [
      {
        column: 'scores.general',
        condition: (row) => row.status === 'Done',
        rules: (v) => [
          v.required({
            message: 'General score is required when status is Done',
          }),
        ],
      },
    ],
  })
}

const schema = createLargeValidationSchema()
const spreadsheet = useSpreadsheetImport(schema)

function createWorkbook() {
  faker.seed(20_260_326)

  const rowCount = 250
  const invalidRowCount = Math.floor(rowCount * 0.2)
  const invalidIndexes = new Set(Array.from({ length: invalidRowCount }, (_, index) => index * 5))

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
      'General score',
      'Listening score',
      'School level: PRÉREQUIS CECR',
      'Programme: PRÉREQUIS CECR',
    ],
    ...Array.from({ length: rowCount }, (_, index) => {
      const firstName = faker.person.firstName()
      const lastName = faker.person.lastName()
      const product = faker.helpers.arrayElement(center.products)
      const schoolLevel = faker.helpers.arrayElement(center.affiliationGroups[0].items).name
      const programme = faker.helpers.arrayElement(center.affiliationGroups[1].items).name
      const baseRow = [
        center.id,
        `MAD-${String(index + 1).padStart(4, '0')}`,
        product.name,
        firstName,
        lastName,
        faker.internet.email({ firstName, lastName }).toLowerCase(),
        faker.date.recent({ days: 45 }).toUTCString(),
        'Done',
        `Madrid Wave ${Math.floor(index / 25) + 1}`,
        center.country,
        String(faker.number.int({ max: 98, min: 48 })),
        String(faker.number.int({ max: 96, min: 42 })),
        schoolLevel,
        programme,
      ]

      if (!invalidIndexes.has(index)) {
        return baseRow
      }

      const invalidVariant = index % 4
      if (invalidVariant === 0) {
        baseRow[0] = 'tc_barcelona'
      }
      if (invalidVariant === 1) {
        baseRow[3] = ''
      }
      if (invalidVariant === 2) {
        baseRow[10] = 'oops'
      }
      if (invalidVariant === 3) {
        baseRow[8] = `_internal-${index + 1}`
      }

      return baseRow
    }),
  ]

  const workbook = utils.book_new()
  const sheet = utils.aoa_to_sheet(rows)
  utils.book_append_sheet(workbook, sheet, 'Bulk import')

  return {
    binary: write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    }),
    fileName: 'spreadsheet-large-validation-lab.xlsx',
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
      :title="t('playground.spreadsheetPages.largeValidation.title')"
      :description="t('playground.spreadsheetPages.largeValidation.description')"
      closable
      mode="fullscreen"
      @close="navigateTo('/spreadsheet')"
    />
  </section>
</template>
