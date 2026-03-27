<script setup lang="ts">
import { onMounted } from 'vue'
import { utils, write } from 'xlsx'

import { useSpreadsheetImport } from '#ui-tools/spreadsheet'
import SpreadsheetImport from '#ui-tools/spreadsheet/components/SpreadsheetImport.vue'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'

definePageMeta({
  layout: 'empty',
})

function createRefineRelationsSchema() {
  return defineSpreadsheetSchema({
    importKey: 'playground.spreadsheet.refine-relations-lab',
    file: {
      accept: ['.xlsx', '.xls', '.csv'],
      maxRecords: 50,
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
          rules: (v) => [v.required()],
        }),
        column.enum('status', {
          match: {
            headers: ['Status'],
          },
          options: ['Draft', 'Done'],
          rules: (v) => [v.required()],
        }),
        column.enum('country', {
          match: {
            headers: ['Country'],
          },
          options: ['FR', 'US'],
          rules: (v) => [v.required()],
        }),
        column.text('generalScore', {
          match: {
            headers: ['General score'],
          },
          rules: (v) => [
            v.validate({
              name: 'numericScore',
              validator: (value: string) => {
                if (!value.trim()) return true
                const numericValue = Number(value)
                return !Number.isNaN(numericValue) && Number.isFinite(numericValue)
              },
              message: 'General score must be numeric when provided',
            }),
          ],
        }),
        column.text('notes', {
          match: {
            headers: ['Notes'],
          },
        }),
        column.text('batchName', {
          match: {
            headers: ['Batch'],
          },
        }),
      ],
    },
  }).refine({
    relations: [
      {
        column: 'generalScore',
        condition: (row) => row.status === 'Done',
        rules: (v) => [
          v.required({
            message: 'General score is required when status is Done',
          }),
        ],
      },
      {
        column: 'generalScore',
        condition: (row) => row.status === 'Draft',
        rules: (v) => [
          v.validate({
            name: 'draftScoreEmpty',
            validator: (value: string | undefined) => !value?.trim(),
            message: 'General score must stay empty while status is Draft',
          }),
        ],
      },
      {
        column: 'notes',
        condition: (row) => row.status === 'Done',
        rules: (v, row) => [
          v.validate({
            name: 'doneNotesLength',
            validator: (value: string | undefined) => {
              const limit = row.country === 'FR' ? 18 : 32
              return (value?.length ?? 0) <= limit
            },
            message: () => {
              const limit = row.country === 'FR' ? 18 : 32
              return `Notes must be at most ${limit} characters when status is Done for ${row.country}`
            },
          }),
        ],
      },
      {
        column: 'batchName',
        condition: (row) => row.status === 'Done',
        rules: (v) => [
          v.required({
            message: 'Batch is required when status is Done',
          }),
        ],
      },
    ],
  })
}

const schema = createRefineRelationsSchema()
const spreadsheet = useSpreadsheetImport(schema)

function createWorkbook() {
  const rows = [
    ['Candidate', 'Status', 'Country', 'General score', 'Notes', 'Batch'],
    ['Lina Martin', 'Done', 'FR', '82', 'Ready to import', 'FR-WAVE-1'],
    ['Noah Bernard', 'Done', 'FR', '', 'Missing score', 'FR-WAVE-1'],
    [
      'Emma Laurent',
      'Draft',
      'US',
      '71',
      'Draft rows should not already contain a final score',
      '',
    ],
    ['Milo Petit', 'Done', 'FR', '65', 'This French note is intentionally too long', 'FR-WAVE-2'],
    ['Anjali Roy', 'Done', 'US', '90', 'Short US note', ''],
  ]

  const workbook = utils.book_new()
  const sheet = utils.aoa_to_sheet(rows)
  utils.book_append_sheet(workbook, sheet, 'Refine relations')

  return {
    fileName: 'spreadsheet-refine-relations-lab.xlsx',
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
      title="Refine Relations Lab"
      description="Small deterministic workbook focused on refine() relations with explicit cross-field messages for review."
      mode="fullscreen"
    />
  </section>
</template>
