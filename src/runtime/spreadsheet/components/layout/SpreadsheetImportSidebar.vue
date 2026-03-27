<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import type { SpreadsheetStepItem } from '../types'

defineProps<{
  title: string
  description?: string
  items: SpreadsheetStepItem[]
}>()

const { t } = useUiToolsLocale()
</script>

<template>
  <aside class="flex h-full flex-col gap-8 border-b border-default/70 bg-default px-7 py-8 lg:border-b-0 lg:border-r">
    <div class="grid gap-2">
      <h2 class="text-base font-semibold tracking-[-0.04em] text-highlighted">
        {{ title }}
      </h2>
      <p v-if="description" class="max-w-[30ch] text-sm leading-6 text-toned">
        {{ description }}
      </p>
    </div>

    <div class="grid gap-3">
      <p class="px-3 text-[11px] uppercase tracking-[0.18em] text-muted">
        {{ t('spreadsheet.common.steps') }}
      </p>

      <div v-for="(item, index) in items" :key="item.value" :class="item.disabled ? 'opacity-50' : ''">
        <div
          class="flex w-full items-start gap-4 px-4 py-3 text-left"
          :class="item.status === 'active'
            ? 'bg-elevated/80 text-default'
            : item.status === 'pending'
              ? 'text-toned'
              : 'text-default'"
        >
          <div
            class="flex size-6 shrink-0 items-center justify-center font-mono text-[11px] font-semibold"
            :class="item.status === 'done'
              ? 'bg-success text-inverted'
              : item.status === 'active'
                ? 'bg-warning/20 text-warning'
                : 'border border-default/70 bg-default text-muted'"
          >
            <UIcon v-if="item.status === 'done'" name="i-lucide-check" class="size-3" />
            <span v-else>{{ index + 1 }}</span>
          </div>

          <span
            class="min-w-0 text-sm leading-6"
            :class="item.status === 'active'
              ? 'font-medium text-highlighted'
              : item.status === 'pending'
                ? 'text-toned'
                : 'text-highlighted'"
          >
            {{ item.title }}
          </span>
        </div>
      </div>
    </div>
  </aside>
</template>
