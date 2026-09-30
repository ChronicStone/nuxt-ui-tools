<script setup lang="ts">
/* oxlint-disable sort-keys -- schema callbacks are typed from `columns`, which must come first */
import USelect from '@nuxt/ui/components/Select.vue'
import { computed, ref } from 'vue'

import { useSpreadsheetImport } from '#ui-tools/spreadsheet'
import SpreadsheetImport from '#ui-tools/spreadsheet/components/spreadsheet-import.vue'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'
import type { SpreadsheetExistingAction } from '#ui-tools/spreadsheet/types'

definePageMeta({ layout: 'empty' })

const { t } = useI18n()
const duplicates = ref<'error' | 'keep-first' | 'keep-last'>('error')
const action = ref<SpreadsheetExistingAction | 'changed'>('changed')

const STORED = [
  { code: 'A-100', score: 72, id: 1 },
  { code: 'A-101', score: 64, id: 2 },
  { code: 'A-102', score: 88, id: 3 },
]

const schema = computed(() =>
  defineSpreadsheetSchema({
    key: 'playground.identity-lab',
    columns: (c) =>
      c
        .text('code', { label: 'Code', required: true })
        .number('score', { label: 'Score', required: true, rules: (v) => [v.between(0, 100)] }),
    rows: {
      key: (row) => row.code,
      duplicates: duplicates.value,
      existing: {
        lookup: async ({ keys }) => {
          await new Promise((resolve) => setTimeout(resolve, 250))
          return STORED.filter((record) => keys.includes(record.code))
        },
        action: ({ row, existing }) =>
          action.value === 'changed'
            ? row.score === existing.score
              ? 'skip'
              : 'update'
            : action.value,
      },
    },
    output: ({ row, mode, existing }) => ({ ...row, id: existing?.id, mode }),
  }),
)

const importer = useSpreadsheetImport(schema, {
  onSubmit: async ({ create, update }) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    // oxlint-disable-next-line no-console -- playground trace of what an API receives
    console.info('create', create, 'update', update)
  },
})

onMounted(() =>
  importer.file.paste(
    ['Code\tScore', 'A-100\t72', 'A-101\t70', 'A-103\t55', 'A-103\t58', 'A-104\t120'].join('\n'),
    'identity.tsv',
  ),
)
</script>

<template>
  <section class="min-h-full bg-muted/60 px-4 py-10">
    <div class="mx-auto grid max-w-[64rem] gap-4">
      <div class="flex flex-wrap gap-4 rounded-xl border border-default bg-default p-4 text-sm">
        <label class="grid gap-1 font-medium text-toned">
          {{ t('playground.spreadsheetPages.identityLab.duplicates') }}
          <USelect
            v-model="duplicates"
            :items="['error', 'keep-first', 'keep-last']"
            class="w-44"
          />
        </label>
        <label class="grid gap-1 font-medium text-toned">
          {{ t('playground.spreadsheetPages.identityLab.existing') }}
          <USelect v-model="action" :items="['changed', 'update', 'skip', 'error']" class="w-44" />
        </label>
      </div>
      <SpreadsheetImport
        :importer="importer"
        :title="t('playground.spreadsheetPages.identityLab.title')"
      />
    </div>
  </section>
</template>
