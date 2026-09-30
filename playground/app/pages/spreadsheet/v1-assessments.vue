<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import USelect from '@nuxt/ui/components/Select.vue'
import { computed, ref } from 'vue'

import { spreadsheetSteps, useSpreadsheetImport } from '#ui-tools/spreadsheet'
import SpreadsheetImport from '#ui-tools/spreadsheet/components/spreadsheet-import.vue'

import {
  TEST_CENTERS,
  assessmentsImport,
  cleanWorkbook,
  productsQuery,
  storedAssessments,
  vtestExportWorkbook,
} from '../../data/spreadsheet-v1-assessments'

definePageMeta({ layout: 'empty' })

const { t } = useI18n()
const centerId = ref<string>(TEST_CENTERS[0]?.id ?? '')
const center = computed(
  () => TEST_CENTERS.find((entry) => entry.id === centerId.value) ?? TEST_CENTERS[0]!,
)
const centerItems = TEST_CENTERS.map((entry) => ({
  label: `${entry.name} · ${entry.vtestId}`,
  value: entry.id,
}))

const importer = useSpreadsheetImport(assessmentsImport, {
  context: {
    center: () => center.value,
    products: productsQuery(),
    stored: () => storedAssessments(center.value),
  },
  async onSubmit({ rows, reportProgress }) {
    for (let done = 0; done < rows.length; done += 25) {
      await new Promise((resolve) => setTimeout(resolve, 120))
      reportProgress(Math.min(done + 25, rows.length))
    }
  },
})

const steps = [
  {
    key: 'center',
    label: t('playground.spreadsheetPages.v1Assessments.testCenter'),
    ready: () => Boolean(centerId.value),
  },
  spreadsheetSteps.file(),
  spreadsheetSteps.columns({ show: 'when-needed' }),
  spreadsheetSteps.values({ show: 'when-needed' }),
  spreadsheetSteps.review(),
  spreadsheetSteps.submit(),
]

function loadSample(kind: 'clean' | 'export') {
  const file = kind === 'clean' ? cleanWorkbook(center.value) : vtestExportWorkbook(center.value)
  importer.file.load(file.binary, file.name)
}
</script>

<template>
  <section class="min-h-full bg-muted/60 px-4 py-10">
    <div
      class="mx-auto transition-[max-width] duration-300"
      :class="importer.rows.all.length ? 'max-w-[84rem]' : 'max-w-[60rem]'"
    >
      <SpreadsheetImport
        :importer="importer"
        :steps="steps"
        :title="t('playground.spreadsheetPages.v1Assessments.title')"
        closable
        @close="navigateTo('/spreadsheet')"
      >
        <template #center>
          <label class="grid max-w-sm gap-1.5 text-sm font-medium text-toned">
            {{ t('playground.spreadsheetPages.v1Assessments.testCenter') }}
            <USelect v-model="centerId" :items="centerItems" class="w-full" />
          </label>
          <div class="flex flex-wrap items-center gap-2 text-sm text-muted">
            {{ t('playground.spreadsheetPages.v1Assessments.trySample') }}
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              :label="t('playground.spreadsheetPages.v1Assessments.sampleClean')"
              @click="loadSample('clean')"
            />
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              :label="t('playground.spreadsheetPages.v1Assessments.sampleMessy')"
              @click="loadSample('export')"
            />
          </div>
        </template>
      </SpreadsheetImport>
    </div>
  </section>
</template>
