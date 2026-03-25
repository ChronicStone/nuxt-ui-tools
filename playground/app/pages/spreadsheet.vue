<script setup lang="ts">
import { computed } from 'vue'

import { useSpreadsheetImport } from '#ui-tools/spreadsheet'
import SpreadsheetImport from '#ui-tools/spreadsheet/components/SpreadsheetImport.vue'

import {
  createDemoAssessmentSchema,
  createDemoAssessmentTemplateWorkbook,
  demoAssessmentCenters,
  getDemoAssessmentCenter,
} from '../lib/demo-spreadsheet-import'

definePageMeta({
  layout: 'empty',
})

const selectedCenter = computed(() => getDemoAssessmentCenter(demoAssessmentCenters[0].id))
const schema = computed(() => createDemoAssessmentSchema(selectedCenter.value))
const spreadsheet = useSpreadsheetImport(schema)

function downloadTemplate() {
  const template = createDemoAssessmentTemplateWorkbook(selectedCenter.value)
  const blob = new Blob([template.binary], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = template.fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <section class="h-full overflow-hidden">
    <SpreadsheetImport
      :spreadsheet="spreadsheet"
      title="Import Workspace"
      description="Assessment data import"
      :on-download-template="downloadTemplate"
      mode="fullscreen"
    />
  </section>
</template>
