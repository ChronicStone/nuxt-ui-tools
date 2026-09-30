<script setup lang="ts">
import { defineRemoteOptions } from '#ui-tools/shared'
/* oxlint-disable sort-keys -- schema callbacks are typed from `columns`, which must come first */
import { useSpreadsheetImport } from '#ui-tools/spreadsheet'
import SpreadsheetImport from '#ui-tools/spreadsheet/components/spreadsheet-import.vue'
import { defineSpreadsheetSchema } from '#ui-tools/spreadsheet/schema'

definePageMeta({ layout: 'empty' })

const { t } = useI18n()
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const CANDIDATES = Array.from({ length: 400 }, (_, index) => ({
  id: `cand_${index + 1}`,
  name: `Candidate ${String(index + 1).padStart(3, '0')}`,
  reference: String(480000 + index * 7),
}))

/** One remote list, as a table filter or a form field would use it. */
const candidates = defineRemoteOptions(
  {
    load: ({ search, page }) => ({
      queryKey: ['playground', 'candidates', 'page', search, page.index],
      queryFn: async () => {
        await wait(200)
        const found = CANDIDATES.filter(
          (entry) =>
            entry.name.toLowerCase().includes(search.toLowerCase()) ||
            entry.reference.includes(search),
        )
        return {
          rows: found.slice((page.index - 1) * page.size, page.index * page.size),
          total: found.length,
        }
      },
    }),
    resolveSelected: ({ values }) => ({
      queryKey: ['playground', 'candidates', 'ids', ...values],
      queryFn: async () => {
        await wait(150)
        return {
          rows: CANDIDATES.filter((entry) => values.includes(entry.id)),
          total: values.length,
        }
      },
    }),
    resolveLabels: ({ labels }) => ({
      queryKey: ['playground', 'candidates', 'labels', ...labels],
      queryFn: async () => {
        await wait(300)
        return {
          rows: CANDIDATES.filter((entry) => labels.includes(entry.reference)),
          total: labels.length,
        }
      },
    }),
  },
  {
    key: 'playground-candidates',
    mapPage: (result) => ({
      hasMore: result.total > result.rows.length,
      options: result.rows.map((entry) => ({
        label: `${entry.name} · ${entry.reference}`,
        value: entry.id,
        aliases: [entry.reference],
      })),
    }),
    mapSelected: (result) =>
      result.rows.map((entry) => ({
        label: `${entry.name} · ${entry.reference}`,
        value: entry.id,
        aliases: [entry.reference],
      })),
    pagination: { size: 20, type: 'page' },
  },
)

const productsQuery = {
  queryKey: ['playground', 'lab-products'],
  queryFn: async () => {
    await wait(300)
    return [
      {
        label: 'VTest English · 4 skills',
        value: 'prod_en',
        aliases: ['VTEST ENGLISH - 4 SKILLS'],
      },
      { label: 'VTest Business English', value: 'prod_be' },
    ]
  },
}

const schema = defineSpreadsheetSchema({
  key: 'playground.options-lab',
  columns: (c) =>
    c
      .text('examName', { label: 'Exam name', required: true })
      .select('productId', {
        label: 'Product',
        from: 'examName',
        options: productsQuery,
        required: true,
      })
      .select('candidateId', {
        label: 'Candidate',
        headers: 'Candidate reference',
        options: candidates,
        required: true,
      })
      .select('status', { label: 'Status', options: ['Done', 'Absent'], unknown: 'skip-rows' })
      .select('sites', {
        label: 'Sites',
        multiple: true,
        options: {
          source: [
            { label: 'Lyon', value: 'lyon' },
            { label: 'Grenoble', value: 'grenoble' },
          ],
          create: {
            handler: async ({ label }) => {
              await wait(200)
              return { label, value: label.toLowerCase() }
            },
          },
        },
        unknown: 'create',
      }),
})

const importer = useSpreadsheetImport(schema)

function loadSample() {
  importer.file.paste(
    [
      'Exam name\tCandidate reference\tStatus\tSites',
      'VTEST ENGLISH - 4 SKILLS\t480000\tDone\tLyon',
      'vtest business english\t480007\tDone\tLyon, Villeurbanne',
      'VTest Speaking\t480014\tDone\tGrenoble',
      'VTest Business English\t999999\tAbsent\t',
      'VTEST ENGLISH - 4 SKILLS\t480021\tIn progress\tGrenoble',
    ].join('\n'),
    'options-lab.tsv',
  )
}

onMounted(loadSample)
</script>

<template>
  <section class="min-h-full bg-muted/60 px-4 py-10">
    <div class="mx-auto max-w-[72rem]">
      <SpreadsheetImport
        :importer="importer"
        :title="t('playground.spreadsheetPages.optionsLab.title')"
      />
    </div>
  </section>
</template>
