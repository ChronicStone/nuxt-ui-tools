<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UCard from '@nuxt/ui/components/Card.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

defineProps<{
  title: string
  description: string
  summary: string
  icon: string
  tags: readonly string[]
  to: string
}>()

const { t } = useI18n()
</script>

<template>
  <UCard
    :ui="{
      body: 'grid gap-5 p-5 sm:p-6',
      root: 'h-full border-default/70 bg-default/95 shadow-sm ring-1 ring-default/40 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5',
    }"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="grid gap-2">
        <div
          class="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted"
        >
          <span class="size-2 rounded-full bg-primary/70" />
          {{ t('playground.spreadsheetIndex.variantLabel') }}
        </div>
        <div class="flex items-center gap-3">
          <div
            class="flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/8 text-primary"
          >
            <UIcon :name="icon" class="size-5" />
          </div>
          <div class="grid gap-1">
            <h2 class="text-lg font-semibold text-highlighted">
              {{ title }}
            </h2>
            <p class="text-sm text-toned">
              {{ description }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <p class="text-sm leading-6 text-muted">
      {{ summary }}
    </p>

    <div class="flex flex-wrap gap-2">
      <UBadge
        v-for="tag in tags"
        :key="tag"
        color="neutral"
        variant="subtle"
        size="sm"
        class="font-mono"
      >
        {{ tag }}
      </UBadge>
    </div>

    <div class="flex items-center justify-between gap-3 border-t border-default/70 pt-4">
      <span class="font-mono text-xs text-muted">
        {{ t('playground.spreadsheetIndex.fullscreenScenario') }}
      </span>
      <UButton
        :to="to"
        color="primary"
        variant="solid"
        trailing-icon="i-lucide-arrow-right"
        :label="t('playground.spreadsheetIndex.openVariant')"
      />
    </div>
  </UCard>
</template>
