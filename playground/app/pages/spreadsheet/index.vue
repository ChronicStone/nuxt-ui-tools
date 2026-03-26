<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import SpreadsheetVariantCard from '../../components/spreadsheet/SpreadsheetVariantCard.vue'

const variants = [
  {
    id: 'happy-path',
    title: 'Happy Path Import',
    description: 'A clean workbook that should flow through structure, matching, references, and review with almost no intervention.',
    summary: 'Use this as the baseline smoke test for the end-to-end engine. Seed workbook: 2 rows on Assessments.',
    icon: 'i-lucide-badge-check',
    tags: ['auto matching', 'reference autofill', 'pipeline payloads', 'baseline regression'],
    to: '/spreadsheet/happy-path',
  },
  {
    id: 'manual-matching',
    title: 'Manual Matching Lab',
    description: 'A workbook with noisy intro rows and deliberately renamed headers so header selection and manual column mapping are easy to debug.',
    summary: 'Best route for iterating on structure detection and the matching UI. Seed workbook: 3 rows on Candidate import.',
    icon: 'i-lucide-columns-3',
    tags: ['header selection', 'sheet structure', 'manual column assignment', 'debugging'],
    to: '/spreadsheet/manual-matching',
  },
  {
    id: 'reference-reconciliation',
    title: 'Reference Reconciliation',
    description: 'A workbook that keeps unresolved product labels visible so the reconciliation step stays active and realistic.',
    summary: 'Focused on reference suggestions, manual selections, and resolved row output. Seed workbook: 3 rows on Assessments.',
    icon: 'i-lucide-link-2',
    tags: ['references', 'manual resolution', 'query suggestions', 'row output'],
    to: '/spreadsheet/reference-reconciliation',
  },
  {
    id: 'structure-stress',
    title: 'Structure Stress Test',
    description: 'A larger workbook with multiple sheets, offset headers, noisy rows, and validation edge cases.',
    summary: 'Use this to exercise layout, virtualization, row issues, and general resilience. Seed workbook: 22 rows on Assessment import raw.',
    icon: 'i-lucide-file-stack',
    tags: ['large workbook', 'offset headers', 'row issues', 'stress test'],
    to: '/spreadsheet/structure-stress',
  },
  {
    id: 'large-validation-lab',
    title: 'Large Validation Lab',
    description: 'A seeded high-volume workbook focused on the new rule system with a controlled 20% invalid slice.',
    summary: 'Best route for validating review scalability, error grouping, and mixed rule failures. Seed workbook: 250 rows with 50 invalid rows on Bulk import.',
    icon: 'i-lucide-bug-play',
    tags: ['sheet rules', 'large dataset', '20% invalid', 'review stress'],
    to: '/spreadsheet/large-validation-lab',
  },
] as const
</script>

<template>
  <section class="grid gap-8 px-6 py-8 lg:px-10 lg:py-10">
    <div class="grid gap-5 rounded-2xl border border-default/70 bg-gradient-to-br from-primary/8 via-default to-info/5 px-6 py-7 shadow-sm">
      <div class="flex flex-wrap items-center gap-2">
        <UBadge color="primary" variant="soft" size="sm" class="font-mono">
          Spreadsheet engine
        </UBadge>
        <UBadge color="neutral" variant="subtle" size="sm" class="font-mono">
          Focused playground catalog
        </UBadge>
      </div>

      <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div class="grid gap-3">
          <div class="flex items-center gap-3">
            <div class="flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <UIcon name="i-lucide-file-spreadsheet" class="size-6" />
            </div>
            <div>
              <h1 class="text-2xl font-semibold tracking-tight text-highlighted">
                Spreadsheet Playground Variants
              </h1>
              <p class="text-sm text-toned">
                Open a focused route for the exact engine behavior you want to validate instead of debugging everything inside one giant page.
              </p>
            </div>
          </div>

          <p class="max-w-4xl text-sm leading-6 text-muted">
            Each variant is designed around a distinct concern: happy-path flow, manual matching, reference reconciliation, or larger structural stress. Open a variant to land directly in a fullscreen spreadsheet surface with no extra wrapper UI.
          </p>
        </div>

        <UButton
          to="/spreadsheet/happy-path"
          color="primary"
          variant="solid"
          icon="i-lucide-play"
          label="Open baseline variant"
        />
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      <SpreadsheetVariantCard
        v-for="variant in variants"
        :key="variant.id"
        :title="variant.title"
        :description="variant.description"
        :summary="variant.summary"
        :icon="variant.icon"
        :tags="variant.tags"
        :to="variant.to"
      />
    </div>
  </section>
</template>
