<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

const props = withDefaults(
  defineProps<{
    keys: string[]
    labels: Map<string, string>
    activeKey?: string
    activeDirection?: 'asc' | 'desc'
    compact?: boolean
  }>(),
  { compact: false },
)
const emit = defineEmits<{
  selectKey: [key: string]
  selectDirection: [direction: 'asc' | 'desc']
}>()
const { t } = useUiToolsLocale()

function labelFor(key: string) {
  return props.labels.get(key) ?? humanize(key)
}

function humanize(value: string) {
  return (
    value
      .split('.')
      .at(-1)
      ?.replace(/[_-]+/gu, ' ')
      .replace(/\b\w/gu, (char) => char.toUpperCase()) ?? value
  )
}
</script>

<template>
  <div class="nut-dl-sort" :data-compact="compact">
    <div
      class="nut-dl-sort__caption font-semibold tracking-[0.06em] text-dimmed uppercase"
      :class="compact ? 'px-2.5 pt-2 pb-1 text-[10.5px]' : 'px-5 pt-3 pb-2 text-[11px]'"
    >
      {{ t('table.filters.sheet.sortBy') }}
    </div>
    <div :class="compact ? 'px-1' : 'px-[10px]'">
      <button
        v-for="key in keys"
        :key="key"
        type="button"
        class="nut-dl-sort__row flex w-full items-center gap-[10px] rounded-lg text-left transition-colors hover:bg-elevated active:bg-elevated"
        :class="[
          compact ? 'h-8 px-2.5 text-[13px]' : 'h-[46px] px-[10px] text-[15px]',
          activeKey === key
            ? 'nut-dl-sort__row--active font-semibold text-highlighted'
            : 'text-default',
        ]"
        @click="emit('selectKey', key)"
      >
        <span
          class="size-[7px] shrink-0 rounded-full transition-colors"
          :class="
            activeKey === key
              ? 'bg-primary shadow-[0_0_0_3px_color-mix(in_srgb,var(--ui-primary)_18%,transparent)]'
              : 'bg-accented'
          "
        />
        <span class="min-w-0 flex-1 truncate">{{ labelFor(key) }}</span>
        <UIcon
          v-if="activeKey === key"
          :name="activeDirection === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
          class="size-3.5 text-muted"
        />
      </button>
    </div>
    <div
      class="nut-dl-sort__caption border-t border-default font-semibold tracking-[0.06em] text-dimmed uppercase"
      :class="
        compact ? 'mx-1 mt-1.5 px-1.5 pt-2 pb-1 text-[10.5px]' : 'mt-2 px-5 pt-4 pb-2 text-[11px]'
      "
    >
      {{ t('table.filters.sheet.order') }}
    </div>
    <div
      class="nut-dl-sort__dir grid grid-cols-[repeat(2,minmax(0,1fr))] gap-0.5 overflow-hidden rounded-md bg-elevated p-0.5"
      :class="compact ? 'mx-2.5 mb-2.5' : 'mx-4 mb-5'"
    >
      <button
        v-for="dir in ['asc', 'desc'] as const"
        :key="dir"
        type="button"
        class="flex min-w-0 items-center justify-center gap-1.5 rounded-[5px] px-1 font-medium whitespace-nowrap"
        :class="[
          compact ? 'h-7 text-[12px]' : 'h-8 text-[12.5px]',
          activeDirection === dir
            ? 'nut-dl-sort__dir--active bg-default text-highlighted shadow-[0_0_0_1px_var(--ui-border)]'
            : 'text-muted',
        ]"
        @click="emit('selectDirection', dir)"
      >
        <UIcon
          :name="dir === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
          class="size-3.5"
        />
        {{ dir === 'asc' ? 'A → Z' : 'Z → A' }}
      </button>
    </div>
  </div>
</template>
