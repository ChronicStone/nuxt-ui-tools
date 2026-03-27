<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'

const { t } = useI18n()

const variants = computed(() => [
  {
    id: 'happy-path',
    title: t('playground.spreadsheetIndex.variants.happyPath.title'),
    description: t('playground.spreadsheetIndex.variants.happyPath.description'),
    to: '/spreadsheet/happy-path',
  },
  {
    id: 'manual-matching',
    title: t('playground.spreadsheetIndex.variants.manualMatching.title'),
    description: t('playground.spreadsheetIndex.variants.manualMatching.description'),
    to: '/spreadsheet/manual-matching',
  },
  {
    id: 'column-resolve-lab',
    title: t('playground.spreadsheetIndex.variants.columnResolve.title'),
    description: t('playground.spreadsheetIndex.variants.columnResolve.description'),
    to: '/spreadsheet/column-resolve-lab',
  },
  {
    id: 'derived-references-lab',
    title: t('playground.spreadsheetIndex.variants.derivedReferences.title'),
    description: t('playground.spreadsheetIndex.variants.derivedReferences.description'),
    to: '/spreadsheet/derived-references-lab',
  },
  {
    id: 'reference-reconciliation',
    title: t('playground.spreadsheetIndex.variants.referenceReconciliation.title'),
    description: t('playground.spreadsheetIndex.variants.referenceReconciliation.description'),
    to: '/spreadsheet/reference-reconciliation',
  },
  {
    id: 'multi-reference-lab',
    title: t('playground.spreadsheetIndex.variants.multiReference.title'),
    description: t('playground.spreadsheetIndex.variants.multiReference.description'),
    to: '/spreadsheet/multi-reference-lab',
  },
  {
    id: 'reference-rules-lab',
    title: t('playground.spreadsheetIndex.variants.referenceRules.title'),
    description: t('playground.spreadsheetIndex.variants.referenceRules.description'),
    to: '/spreadsheet/reference-rules-lab',
  },
  {
    id: 'structure-stress',
    title: t('playground.spreadsheetIndex.variants.structureStress.title'),
    description: t('playground.spreadsheetIndex.variants.structureStress.description'),
    to: '/spreadsheet/structure-stress',
  },
  {
    id: 'large-validation-lab',
    title: t('playground.spreadsheetIndex.variants.largeValidation.title'),
    description: t('playground.spreadsheetIndex.variants.largeValidation.description'),
    to: '/spreadsheet/large-validation-lab',
  },
  {
    id: 'refine-relations-lab',
    title: t('playground.spreadsheetIndex.variants.refineRelations.title'),
    description: t('playground.spreadsheetIndex.variants.refineRelations.description'),
    to: '/spreadsheet/refine-relations-lab',
  },
  {
    id: 'multi-value-lab',
    title: t('playground.spreadsheetIndex.variants.multiValue.title'),
    description: t('playground.spreadsheetIndex.variants.multiValue.description'),
    to: '/spreadsheet/multi-value-lab',
  },
])
</script>

<template>
  <section class="mx-auto grid max-w-4xl gap-5 px-6 py-8 lg:px-10">
    <div class="grid gap-2">
      <h1 class="text-2xl font-semibold text-highlighted">
        {{ t('playground.spreadsheetIndex.title') }}
      </h1>
      <p class="text-sm text-muted">
        {{ t('playground.spreadsheetIndex.description') }}
      </p>
    </div>

    <div class="grid gap-3">
      <div
        v-for="variant in variants"
        :key="variant.id"
        class="flex flex-col gap-3 rounded-xl border border-default/70 bg-default px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
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
</template>
