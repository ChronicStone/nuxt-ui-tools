import { computed, ref, watch } from 'vue'

import { resolveTextValue } from '#ui-tools/shared/utils/render'

import type { SpreadsheetStepItem } from '../components/types'
import type { SpreadsheetStepsDefinition } from '../types'

export function useSpreadsheetView(params: {
  hasReferences: () => boolean
  stepConfig?: () => SpreadsheetStepsDefinition | undefined
  t: (path: string, option?: Record<string, string | number>) => string
}) {
  const activeStep = ref<string>('upload')
  const steps = computed<SpreadsheetStepItem[]>(() => [
    {
      description: resolveTextValue(
        params.stepConfig?.()?.upload?.description,
        params.t('spreadsheet.steps.upload.description'),
      ),
      icon: 'i-lucide-upload',
      title: resolveTextValue(
        params.stepConfig?.()?.upload?.title,
        params.t('spreadsheet.steps.upload.title'),
      ),
      value: 'upload',
    },
    {
      description: resolveTextValue(
        params.stepConfig?.()?.structure?.description,
        params.t('spreadsheet.steps.structure.description'),
      ),
      icon: 'i-lucide-table-properties',
      title: resolveTextValue(
        params.stepConfig?.()?.structure?.title,
        params.t('spreadsheet.steps.structure.title'),
      ),
      value: 'structure',
    },
    {
      description: resolveTextValue(
        params.stepConfig?.()?.matching?.description,
        params.t('spreadsheet.steps.matching.description'),
      ),
      icon: 'i-lucide-columns-3',
      title: resolveTextValue(
        params.stepConfig?.()?.matching?.title,
        params.t('spreadsheet.steps.matching.title'),
      ),
      value: 'matching',
    },
    ...(params.hasReferences()
      ? [
          {
            description: resolveTextValue(
              params.stepConfig?.()?.references?.description,
              params.t('spreadsheet.steps.references.description'),
            ),
            icon: 'i-lucide-link-2',
            title: resolveTextValue(
              params.stepConfig?.()?.references?.title,
              params.t('spreadsheet.steps.references.title'),
            ),
            value: 'references',
          },
        ]
      : []),
    {
      description: resolveTextValue(
        params.stepConfig?.()?.review?.description,
        params.t('spreadsheet.steps.review.description'),
      ),
      icon: 'i-lucide-clipboard-check',
      title: resolveTextValue(
        params.stepConfig?.()?.review?.title,
        params.t('spreadsheet.steps.review.title'),
      ),
      value: 'review',
    },
  ])
  const activeStepIndex = computed(() =>
    steps.value.findIndex((step) => step.value === activeStep.value),
  )
  const canGoPrev = computed(() => activeStepIndex.value > 0)
  const canGoNext = computed(
    () => activeStepIndex.value >= 0 && activeStepIndex.value < steps.value.length - 1,
  )

  function goToNextStep() {
    if (!canGoNext.value) {
      return
    }
    activeStep.value = steps.value[activeStepIndex.value + 1]?.value ?? activeStep.value
  }

  function goToPrevStep() {
    if (!canGoPrev.value) {
      return
    }
    activeStep.value = steps.value[activeStepIndex.value - 1]?.value ?? activeStep.value
  }

  watch(
    steps,
    (nextSteps) => {
      if (nextSteps.some((step) => step.value === activeStep.value)) {
        return
      }
      activeStep.value = nextSteps[0]?.value ?? 'upload'
    },
    {
      immediate: true,
    },
  )

  return {
    activeStep,
    activeStepIndex,
    canGoNext,
    canGoPrev,
    goToNextStep,
    goToPrevStep,
    steps,
  }
}
