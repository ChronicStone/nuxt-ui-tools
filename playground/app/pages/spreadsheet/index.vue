<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'

const variants = [
  {
    id: 'happy-path',
    title: 'Happy Path Import',
    description: 'Baseline end-to-end flow.',
    to: '/spreadsheet/happy-path',
  },
  {
    id: 'manual-matching',
    title: 'Manual Matching Lab',
    description: 'Header selection and manual column assignment.',
    to: '/spreadsheet/manual-matching',
  },
  {
    id: 'reference-reconciliation',
    title: 'Reference Reconciliation',
    description: 'Single-value reference suggestions and manual resolution.',
    to: '/spreadsheet/reference-reconciliation',
  },
  {
    id: 'multi-reference-lab',
    title: 'Multi Reference Lab',
    description: 'References resolving from a multi-value source field into an array output.',
    to: '/spreadsheet/multi-reference-lab',
  },
  {
    id: 'structure-stress',
    title: 'Structure Stress Test',
    description: 'Large workbook and structural edge cases.',
    to: '/spreadsheet/structure-stress',
  },
  {
    id: 'large-validation-lab',
    title: 'Large Validation Lab',
    description: 'Large dataset with mixed validation failures.',
    to: '/spreadsheet/large-validation-lab',
  },
  {
    id: 'refine-relations-lab',
    title: 'Refine Relations Lab',
    description: 'Tiny deterministic cross-field validation scenario.',
    to: '/spreadsheet/refine-relations-lab',
  },
  {
    id: 'multi-value-lab',
    title: 'Multi Value Lab',
    description: 'Built-in multiple columns without references.',
    to: '/spreadsheet/multi-value-lab',
  },
] as const
</script>

<template>
  <section class="mx-auto grid max-w-4xl gap-5 px-6 py-8 lg:px-10">
    <div class="grid gap-2">
      <h1 class="text-2xl font-semibold text-highlighted">
        Spreadsheet playgrounds
      </h1>
      <p class="text-sm text-muted">
        Open the route that matches the behavior you want to inspect.
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
          label="Open"
        />
      </div>
    </div>
  </section>
</template>
