<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'

const { t } = useI18n()

const variants = computed(() => [
  {
    description: t('playground.spreadsheetIndex.variants.happyPath.description'),
    id: 'happy-path',
    title: t('playground.spreadsheetIndex.variants.happyPath.title'),
    to: '/spreadsheet/happy-path',
  },
  {
    description: t('playground.spreadsheetIndex.variants.manualMatching.description'),
    id: 'manual-matching',
    title: t('playground.spreadsheetIndex.variants.manualMatching.title'),
    to: '/spreadsheet/manual-matching',
  },
  {
    description: t('playground.spreadsheetIndex.variants.columnResolve.description'),
    id: 'column-resolve-lab',
    title: t('playground.spreadsheetIndex.variants.columnResolve.title'),
    to: '/spreadsheet/column-resolve-lab',
  },
  {
    description: t('playground.spreadsheetIndex.variants.derivedReferences.description'),
    id: 'derived-references-lab',
    title: t('playground.spreadsheetIndex.variants.derivedReferences.title'),
    to: '/spreadsheet/derived-references-lab',
  },
  {
    description: t('playground.spreadsheetIndex.variants.referenceReconciliation.description'),
    id: 'reference-reconciliation',
    title: t('playground.spreadsheetIndex.variants.referenceReconciliation.title'),
    to: '/spreadsheet/reference-reconciliation',
  },
  {
    description: t('playground.spreadsheetIndex.variants.multiReference.description'),
    id: 'multi-reference-lab',
    title: t('playground.spreadsheetIndex.variants.multiReference.title'),
    to: '/spreadsheet/multi-reference-lab',
  },
  {
    description: t('playground.spreadsheetIndex.variants.referenceRules.description'),
    id: 'reference-rules-lab',
    title: t('playground.spreadsheetIndex.variants.referenceRules.title'),
    to: '/spreadsheet/reference-rules-lab',
  },
  {
    description: t('playground.spreadsheetIndex.variants.structureStress.description'),
    id: 'structure-stress',
    title: t('playground.spreadsheetIndex.variants.structureStress.title'),
    to: '/spreadsheet/structure-stress',
  },
  {
    description: t('playground.spreadsheetIndex.variants.largeValidation.description'),
    id: 'large-validation-lab',
    title: t('playground.spreadsheetIndex.variants.largeValidation.title'),
    to: '/spreadsheet/large-validation-lab',
  },
  {
    description: t('playground.spreadsheetIndex.variants.refineRelations.description'),
    id: 'refine-relations-lab',
    title: t('playground.spreadsheetIndex.variants.refineRelations.title'),
    to: '/spreadsheet/refine-relations-lab',
  },
  {
    description: t('playground.spreadsheetIndex.variants.multiValue.description'),
    id: 'multi-value-lab',
    title: t('playground.spreadsheetIndex.variants.multiValue.title'),
    to: '/spreadsheet/multi-value-lab',
  },
])
</script>

<template>
  <PlaygroundContent mode="document">
    <section class="mx-auto grid max-w-4xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header class="grid gap-2">
        <p class="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          Spreadsheet / variants
        </p>
        <h1 class="text-2xl font-semibold tracking-tight text-highlighted">
          {{ t('playground.spreadsheetIndex.title') }}
        </h1>
        <p class="max-w-2xl text-sm leading-6 text-muted">
          {{ t('playground.spreadsheetIndex.description') }}
        </p>
      </header>

      <div class="grid border-y border-default">
        <div
          v-for="variant in variants"
          :key="variant.id"
          class="flex flex-col gap-3 border-b border-default px-1 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-3"
        >
          <div class="min-w-0">
            <div class="text-sm font-medium text-highlighted">
              {{ variant.title }}
            </div>
            <div class="text-sm text-muted">
              {{ variant.description }}
            </div>
          </div>

          <UButton
            :to="variant.to"
            color="neutral"
            variant="soft"
            icon="i-lucide-arrow-right"
            trailing
            :label="t('playground.common.open')"
          />
        </div>
      </div>
    </section>
  </PlaygroundContent>
</template>
