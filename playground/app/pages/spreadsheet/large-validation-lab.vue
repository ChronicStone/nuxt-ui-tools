<script setup lang="ts">
import { faker } from '@faker-js/faker'
import { onMounted } from 'vue'
import { utils, write } from 'xlsx'

import { createSheetRule, useSpreadsheetImport } from '#ui-tools/spreadsheet'
import SpreadsheetImport from '#ui-tools/spreadsheet/components/SpreadsheetImport.vue'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'

definePageMeta({
  layout: 'empty',
})

const { t } = useI18n()

const center = {
  id: 'tc_madrid',
  country: 'Spain',
  products: [
    { id: 'prod_be_4skills', name: 'Positionnement VTest Business English - 4 Skills' },
    { id: 'prod_general_4skills', name: 'Positionnement VTest English - 4 Skills' },
    { id: 'prod_career_screen', name: 'Career Screening English Bundle' },
  ],
  affiliationGroups: [
    {
      id: 'school-level',
      name: 'School level',
      slug: 'schoolLevel',
      items: [
        { id: 'secondary', name: 'Secondary' },
        { id: 'higher-education', name: 'Higher education' },
        { id: 'professional', name: 'Professional' },
      ],
    },
    {
      id: 'programme',
      name: 'Programme',
      slug: 'programme',
      items: [
        { id: 'general-english', name: 'General English' },
        { id: 'business-english', name: 'Business English' },
        { id: 'career-readiness', name: 'Career Readiness' },
      ],
    },
  ],
} as const

type SpreadsheetProduct = (typeof center.products)[number]
type SpreadsheetAffiliationOption = {
  id: string
  name: string
}

const batchCodeRule = createSheetRule<string, [], {}>({
  name: 'batchCode',
  validator: value => !value.startsWith('_'),
  message: ({ value }) => `"${value}" cannot start with underscore`,
})

const centerMatchRule = createSheetRule<string, [expectedId: string], {
  expectedId: string
}>({
  name: 'testCenterMatch',
  validator: (value, expectedId) => ({
    $valid: value === expectedId,
    expectedId,
  }),
  message: ({ params: [expectedId] }) => `Row test center must be ${expectedId}`,
})

const scoreBandRule = createSheetRule<number, [min: number, max: number], {
  min: number
  max: number
}>({
  name: 'scoreBand',
  validator: (value, min, max) => ({
    $valid: !Number.isNaN(value) && value >= min && value <= max,
    min,
    max,
  }),
  message: ({ value, params: [min, max] }) => `${value} must be between ${min} and ${max}`,
})

function createLargeValidationSchema() {
  return defineSpreadsheetSchema({
    importKey: 'playground.spreadsheet.large-validation-lab',
    file: {
      accept: ['.xlsx', '.xls', '.csv'],
      maxRecords: 500,
    },
    sheet: { strategy: 'selection' },
    header: { strategy: 'selection' },
    matching: { strategy: 'smart' },
    columns: {
      static: (column) => [
        column.text('testCenterId', {
          match: { headers: ['Test center ID'] },
          rules: v => [
            v.required(),
            centerMatchRule(center.id),
          ],
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
        column.text('status', {
          match: { headers: ['Status'] },
          rules: v => [
            v.required(),
            v.oneOf(['Done']),
          ],
        }),
        column.text('country', {
          match: { headers: ['Tc country'] },
          rules: v => [v.required()],
        }),
        column.text('batchName', {
          match: { headers: ['Batch'] },
          rules: v => [
            v.required(),
            batchCodeRule(),
          ],
        }),
        column.number('scores.general', {
          match: { headers: ['General score'] },
          parse: ({ cell }) => Number(cell.text.trim()),
          rules: v => [
            v.number({
              message: 'General score must be numeric',
            }),
            scoreBandRule(0, 100),
          ],
        }),
        column.number('scores.listening', {
          match: { headers: ['Listening score'] },
          parse: ({ cell }) => Number(cell.text.trim()),
          rules: v => [
            v.number({
              message: 'Listening score must be numeric',
            }),
            scoreBandRule(0, 100),
          ],
        }),
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
          options: (group: { items: readonly SpreadsheetAffiliationOption[] }) =>
            group.items.map((item: SpreadsheetAffiliationOption) => ({
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
        options: center.products.map((product: SpreadsheetProduct) => ({
          label: product.name,
          value: product.id,
        })),
      }),
    ],
  }).refine({
    relations: [
      {
        column: 'scores.general',
        condition: row => row.status === 'Done',
        rules: v => [
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
  faker.seed(20260326)

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
        String(faker.number.int({ min: 48, max: 98 })),
        String(faker.number.int({ min: 42, max: 96 })),
        schoolLevel,
        programme,
      ]

      if (!invalidIndexes.has(index)) return baseRow

      const invalidVariant = index % 4
      if (invalidVariant === 0) baseRow[0] = 'tc_barcelona'
      if (invalidVariant === 1) baseRow[3] = ''
      if (invalidVariant === 2) baseRow[10] = 'oops'
      if (invalidVariant === 3) baseRow[8] = `_internal-${index + 1}`

      return baseRow
    }),
  ]

  const workbook = utils.book_new()
  const sheet = utils.aoa_to_sheet(rows)
  utils.book_append_sheet(workbook, sheet, 'Bulk import')

  return {
    fileName: 'spreadsheet-large-validation-lab.xlsx',
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
      :title="t('playground.spreadsheetPages.largeValidation.title')"
      :description="t('playground.spreadsheetPages.largeValidation.description')"
      closable
      mode="fullscreen"
      @close="navigateTo('/spreadsheet')"
    />
  </section>
</template>
