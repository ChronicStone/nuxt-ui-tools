import { computed, ref, watch } from 'vue'

import type { SpreadsheetStepItem } from '../components/types'

export function useSpreadsheetView(params: {
  hasReferences: () => boolean
}) {
  const activeStep = ref<string>('upload')
  const steps = computed<SpreadsheetStepItem[]>(() => [
    {
      value: 'upload',
      title: 'Upload file',
      description: 'Drag and drop or select an Excel / CSV file to begin the import process.',
      icon: 'i-lucide-upload',
    },
    {
      value: 'structure',
      title: 'Structure',
      description: 'Select the correct sheet and verify the header row detected by the system.',
      icon: 'i-lucide-table-properties',
    },
    {
      value: 'matching',
      title: 'Column matching',
      description: 'Review how file columns map to system fields. Fix any missing or ambiguous matches.',
      icon: 'i-lucide-columns-3',
    },
    ...(
      params.hasReferences()
        ? [{
            value: 'references',
            title: 'Reconciliation',
            description: 'Match imported values to internal products. Resolve once, apply to all matching rows.',
            icon: 'i-lucide-link-2',
          }]
        : []
    ),
    {
      value: 'review',
      title: 'Review & import',
      description: 'Review rows, discard overflow, and confirm the final import payload.',
      icon: 'i-lucide-clipboard-check',
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
    if (!canGoNext.value) return
    activeStep.value = steps.value[activeStepIndex.value + 1]?.value ?? activeStep.value
  }

  function goToPrevStep() {
    if (!canGoPrev.value) return
    activeStep.value = steps.value[activeStepIndex.value - 1]?.value ?? activeStep.value
  }

  watch(
    steps,
    (nextSteps) => {
      if (nextSteps.some((step) => step.value === activeStep.value)) return
      activeStep.value = nextSteps[0]?.value ?? 'upload'
    },
    {
      immediate: true,
    },
  )

  return {
    steps,
    activeStep,
    activeStepIndex,
    canGoPrev,
    canGoNext,
    goToNextStep,
    goToPrevStep,
  }
}
