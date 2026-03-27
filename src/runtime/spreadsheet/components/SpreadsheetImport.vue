<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue'

import { useSpreadsheetView } from '../composables/use-spreadsheet-view'
import type { SpreadsheetComponentApi } from './types'
import SpreadsheetImportFooter from './layout/SpreadsheetImportFooter.vue'
import SpreadsheetImportFileBar from './layout/SpreadsheetImportFileBar.vue'
import SpreadsheetImportHeader from './layout/SpreadsheetImportHeader.vue'
import SpreadsheetImportSidebar from './layout/SpreadsheetImportSidebar.vue'
import SpreadsheetImportMatchingStep from './steps/SpreadsheetImportMatchingStep.vue'
import SpreadsheetImportReferencesStep from './steps/SpreadsheetImportReferencesStep.vue'
import SpreadsheetImportReviewStep from './steps/SpreadsheetImportReviewStep.vue'
import SpreadsheetImportStructureStep from './steps/SpreadsheetImportStructureStep.vue'
import SpreadsheetImportUploadStep from './steps/SpreadsheetImportUploadStep.vue'

const props = defineProps<{
  spreadsheet: SpreadsheetComponentApi
  title?: string
  description?: string
  onDownloadTemplate?: () => void
  mode?: 'inline' | 'fullscreen'
}>()

const view = useSpreadsheetView({
  hasReferences: () => props.spreadsheet.referenceResolutions.value.length > 0,
})

const workspaceTitle = computed(() =>
  props.title ?? humanizeKey(props.spreadsheet.schema.value.importKey),
)
const workspaceDescription = computed(() => props.description)
const {
  activeStep,
  activeStepIndex,
  steps,
  goToPrevStep,
  goToNextStep,
} = view
const currentStep = computed(() =>
  steps.value.find((step) => step.value === activeStep.value) ?? steps.value[0],
)
const stageTitle = computed(() => {
  if (activeStep.value === 'upload') return 'Upload your file'
  if (activeStep.value === 'structure') return 'Confirm file structure'
  return currentStep.value?.title ?? 'Spreadsheet import'
})
const stageDescription = computed(() => currentStep.value?.description ?? '')
const renderMode = computed(() => props.mode ?? 'inline')
const isFullscreen = computed(() => renderMode.value === 'fullscreen')
const isPreparingNextStep = ref<boolean>(false)
const hasWorkbook = computed(() => Boolean(props.spreadsheet.workbook.value))
const hasHeaders = computed(() => props.spreadsheet.headers.value.length > 0)
function getSchemaMaxRecords(schema: { importKey: string }): number | undefined {
  if ('file' in schema && schema.file && typeof schema.file === 'object' && 'maxRecords' in schema.file)
    return typeof schema.file.maxRecords === 'number' ? schema.file.maxRecords : undefined

  if ('source' in schema && schema.source && typeof schema.source === 'object' && 'maxRecords' in schema.source)
    return typeof schema.source.maxRecords === 'number' ? schema.source.maxRecords : undefined

  return undefined
}

const canGoNext = computed(() => {
  if (activeStep.value === 'upload') return hasWorkbook.value
  if (activeStep.value === 'structure') return hasWorkbook.value && hasHeaders.value
  if (activeStep.value === 'matching') return hasWorkbook.value && hasHeaders.value
  if (activeStep.value === 'references')
    return props.spreadsheet.unresolvedReferenceResolutions.value.length === 0
  return false
})
const fileName = computed(() => props.spreadsheet.workbook.value?.fileName)
const maxRecords = computed(() => getSchemaMaxRecords(props.spreadsheet.schema.value) ?? Infinity)
const importableRowCount = computed(() =>
  Math.min(props.spreadsheet.rowSummary.value.totalRows, maxRecords.value),
)
const overflowRowCount = computed(() =>
  Math.max(props.spreadsheet.rowSummary.value.totalRows - importableRowCount.value, 0),
)
const sidebarItems = computed(() =>
  steps.value.map((step, index) => ({
    ...step,
    disabled: step.value !== 'upload' && !hasWorkbook.value,
    status: index < activeStepIndex.value
      ? 'done' as const
      : step.value === activeStep.value
        ? 'active' as const
        : 'pending' as const,
  })),
)

function humanizeKey(value: string) {
  return (
    value
      .split('.')
      .at(-1)
      ?.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase()) ?? value
  )
}

const actionHint = computed(() => {
  if (activeStep.value === 'structure')
    return 'Click on a row to change the header position'

  if (activeStep.value === 'references')
    return 'Resolve all values in each column to continue'

  return undefined
})

const primaryActionLabel = computed(() => {
  if (activeStep.value === 'review')
    return `Import ${importableRowCount.value} rows`

  return 'Continue'
})

const primaryActionColor = computed(() =>
  activeStep.value === 'review' ? 'success' as const : 'primary' as const,
)
const primaryActionBusyLabel = computed(() => 'Preparing review...')

function getNextStepValue() {
  return steps.value[activeStepIndex.value + 1]?.value
}

function waitForPaint() {
  return new Promise<void>((resolve) =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve()),
    ),
  )
}

async function handlePrimaryAction() {
  if (activeStep.value === 'review') {
    void props.spreadsheet.refresh()
    return
  }

  if (!canGoNext.value) return
  const nextStep = getNextStepValue()

  if (nextStep === 'review') {
    isPreparingNextStep.value = true
    await nextTick()
    await waitForPaint()
  }

  goToNextStep()

  if (nextStep === 'review') {
    await nextTick()
    isPreparingNextStep.value = false
  }
}

watch(hasWorkbook, (nextHasWorkbook) => {
  if (!nextHasWorkbook) return
  if (activeStep.value !== 'upload') return
  goToNextStep()
})
</script>

<template>
  <div
    class="grid h-full overflow-hidden bg-default lg:grid-cols-[280px_minmax(0,1fr)]"
      :class="isFullscreen
      ? 'min-h-full'
      : 'min-h-[44rem] rounded-[var(--ui-radius)] border border-default/70 shadow-sm'"
  >
    <SpreadsheetImportSidebar
      :title="workspaceTitle"
      :description="workspaceDescription"
      :items="sidebarItems"
    />

    <div class="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] bg-default">
      <div
        class="relative min-h-0"
        :class="activeStep === 'matching' || activeStep === 'review' ? 'overflow-hidden' : 'overflow-y-auto'"
      >
        <div
          v-if="isPreparingNextStep"
          class="absolute inset-0 z-10 flex items-center justify-center bg-default/72 backdrop-blur-sm"
        >
          <div class="flex items-center gap-3 rounded-[var(--ui-radius)] border border-default/70 bg-default px-4 py-3 shadow-sm">
            <div class="size-4 animate-spin rounded-full border-2 border-default border-t-primary" />
            <div class="grid gap-0.5">
              <span class="text-sm font-medium text-highlighted">{{ primaryActionBusyLabel }}</span>
              <span class="text-xs text-muted">Validation and review data are being prepared.</span>
            </div>
          </div>
        </div>

        <div
          class="grid px-6 py-5 lg:px-10 lg:py-6"
          :class="activeStep === 'matching' || activeStep === 'review' ? 'h-full grid-rows-[auto_minmax(0,1fr)] gap-4' : 'gap-4'"
        >
          <div
            class="grid gap-3"
            :class="activeStep === 'upload' ? '' : 'pb-2'"
          >
            <SpreadsheetImportHeader
              :title="stageTitle"
              :description="stageDescription"
            />

            <SpreadsheetImportFileBar
              v-if="activeStep !== 'upload'"
              :file-name="fileName"
              :total-sheets="spreadsheet.workbook.value?.sheets.length ?? 0"
              :row-count="spreadsheet.rows.value.length"
              :has-workbook="hasWorkbook"
            />
          </div>

          <SpreadsheetImportUploadStep
            v-if="activeStep === 'upload'"
            :spreadsheet="spreadsheet"
            :on-download-template="onDownloadTemplate"
          />

          <SpreadsheetImportStructureStep
            v-else-if="activeStep === 'structure'"
            :spreadsheet="spreadsheet"
          />

          <SpreadsheetImportMatchingStep
            v-else-if="activeStep === 'matching'"
            :spreadsheet="spreadsheet"
          />

          <SpreadsheetImportReferencesStep
            v-else-if="activeStep === 'references'"
            :spreadsheet="spreadsheet"
          />

          <SpreadsheetImportReviewStep
            v-else
            :spreadsheet="spreadsheet"
          />
        </div>
      </div>

      <SpreadsheetImportFooter
        v-if="activeStep !== 'upload'"
        :hint="actionHint"
        :show-previous="activeStep !== 'upload'"
        :primary-label="primaryActionLabel"
        :primary-disabled="activeStep !== 'review' && !canGoNext"
        :primary-loading="isPreparingNextStep"
        :primary-color="primaryActionColor"
        :primary-icon="activeStep === 'review' ? 'i-lucide-check' : 'i-lucide-arrow-right'"
        :show-export="activeStep === 'review' && overflowRowCount > 0"
        :export-label="`Export ${overflowRowCount} discarded rows`"
        :meta-text="`${importableRowCount} of ${spreadsheet.rowSummary.value.totalRows} rows will be imported`"
        @previous="goToPrevStep"
        @primary="handlePrimaryAction"
      />
    </div>
  </div>
</template>
