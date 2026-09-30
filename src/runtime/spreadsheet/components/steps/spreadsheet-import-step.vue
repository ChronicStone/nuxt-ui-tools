<script setup lang="ts">
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import {
  useSpreadsheetImporter,
  useSpreadsheetStepsContext,
} from '../../composables/use-spreadsheet-import-context'
import type { SpreadsheetImporter, SpreadsheetSteps } from '../../types'
import SpreadsheetImportHeading from '../internal/spreadsheet-import-heading.vue'
import SpreadsheetImportColumnMapping from '../parts/spreadsheet-import-column-mapping.vue'
import SpreadsheetImportDropzone from '../parts/spreadsheet-import-dropzone.vue'
import SpreadsheetImportExpectedColumns from '../parts/spreadsheet-import-expected-columns.vue'
import SpreadsheetImportExportButton from '../parts/spreadsheet-import-export-button.vue'
import SpreadsheetImportFileCard from '../parts/spreadsheet-import-file-card.vue'
import SpreadsheetImportProgress from '../parts/spreadsheet-import-progress.vue'
import SpreadsheetImportRowInspector from '../parts/spreadsheet-import-row-inspector.vue'
import SpreadsheetImportSourceSettings from '../parts/spreadsheet-import-source-settings.vue'
import SpreadsheetImportStats from '../parts/spreadsheet-import-stats.vue'
import SpreadsheetImportSummary from '../parts/spreadsheet-import-summary.vue'
import SpreadsheetImportTableToolbar from '../parts/spreadsheet-import-table-toolbar.vue'
import SpreadsheetImportTable from '../parts/spreadsheet-import-table.vue'
import SpreadsheetImportTemplateButton from '../parts/spreadsheet-import-template-button.vue'
import SpreadsheetImportValueMapping from '../parts/spreadsheet-import-value-mapping.vue'

/**
 * The current step. A slot named after the step key replaces its content; built-in steps
 * otherwise render their default parts.
 */
const props = defineProps<{
  importer?: SpreadsheetImporter
  steps?: SpreadsheetSteps
  /** Shows the built-in title and description above the default content. */
  headings?: boolean
}>()
const importer = useSpreadsheetImporter(() => props.importer)
const steps = useSpreadsheetStepsContext(() => props.steps)
const { t } = useUiToolsLocale()
const step = computed(() => steps.value?.step ?? null)
</script>

<template>
  <div v-if="step" :key="step.key" :data-spreadsheet-step="step.key" class="grid min-w-0 gap-5">
    <slot :name="step.key" :step="step">
      <template v-if="step.builtIn === 'file'">
        <SpreadsheetImportHeading
          v-if="headings"
          :title="t('spreadsheet.headings.file.title')"
          :description="t('spreadsheet.headings.file.description')"
        >
          <SpreadsheetImportTemplateButton v-if="!importer.file.loaded" />
        </SpreadsheetImportHeading>
        <template v-if="importer.file.loaded">
          <SpreadsheetImportFileCard />
          <SpreadsheetImportSourceSettings />
        </template>
        <template v-else>
          <SpreadsheetImportDropzone />
          <SpreadsheetImportExpectedColumns />
        </template>
      </template>
      <template v-else-if="step.builtIn === 'columns'">
        <SpreadsheetImportHeading
          v-if="headings"
          :title="t('spreadsheet.headings.columns.title')"
          :description="t('spreadsheet.headings.columns.description')"
        />
        <SpreadsheetImportColumnMapping />
      </template>
      <template v-else-if="step.builtIn === 'values'">
        <SpreadsheetImportHeading
          v-if="headings"
          :title="t('spreadsheet.headings.values.title')"
          :description="t('spreadsheet.headings.values.description')"
        />
        <SpreadsheetImportValueMapping />
      </template>
      <template v-else-if="step.builtIn === 'review'">
        <SpreadsheetImportHeading
          v-if="headings"
          :title="t('spreadsheet.headings.review.title')"
          :description="t('spreadsheet.headings.review.description')"
        >
          <SpreadsheetImportExportButton />
        </SpreadsheetImportHeading>
        <SpreadsheetImportStats />
        <div class="min-w-0 overflow-hidden rounded-xl border border-default">
          <SpreadsheetImportTableToolbar />
          <div
            class="grid min-w-0"
            :class="importer.review.inspected ? 'lg:grid-cols-[minmax(0,1fr)_24rem]' : ''"
          >
            <SpreadsheetImportTable />
            <SpreadsheetImportRowInspector
              v-if="importer.review.inspected"
              class="border-default max-lg:border-t lg:border-s"
            />
          </div>
        </div>
      </template>
      <template v-else-if="step.builtIn === 'submit'">
        <SpreadsheetImportProgress v-if="importer.submit.status !== 'idle'" />
        <template v-else>
          <SpreadsheetImportHeading
            v-if="headings"
            :title="t('spreadsheet.headings.submit.title')"
            :description="t('spreadsheet.headings.submit.description')"
          />
          <SpreadsheetImportSummary />
        </template>
      </template>
    </slot>
  </div>
</template>
