<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'

const { t } = useI18n()

const variants = computed(() =>
  (['v1Assessments', 'onePage', 'optionsLab', 'identityLab', 'largeFile'] as const).map((id) => ({
    description: t(`playground.spreadsheetIndex.variants.${id}.description`),
    id,
    title: t(`playground.spreadsheetIndex.variants.${id}.title`),
    to: `/spreadsheet/${id.replaceAll(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`)}`,
  })),
)
</script>

<template>
  <PlaygroundContent mode="document">
    <section class="mx-auto grid max-w-4xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header class="grid gap-2">
        <p class="font-mono text-[11px] font-medium tracking-[0.18em] text-muted uppercase">
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
            <div class="text-sm font-medium text-highlighted">{{ variant.title }}</div>
            <div class="text-sm text-muted">{{ variant.description }}</div>
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
