<script setup lang="ts" generic="TValue extends string | number">
import UTabs from '@nuxt/ui/components/Tabs.vue'
import type { TabsItem } from '@nuxt/ui/components/Tabs.vue'
import { computed } from 'vue'

import { resolveTextValue } from '#ui-tools/shared/utils/render'

import type { DashboardTab } from '../types'

/**
 * Tab strip for dashboard cards, bound with `v-model`. Bind it to a widget param to switch what a
 * block fetches (the tab lands in the URL, and the block refreshes in place), or to a local ref to
 * switch between blocks: render only the active one, so the others' deferred queries stay idle.
 */
const model = defineModel<TValue>({ required: true })

const {
  items,
  variant = 'pill',
  size = 'xs',
  full = false,
} = defineProps<{
  items: readonly DashboardTab<TValue>[]
  /** `pill`: a segmented control. `link`: underlined tabs. */
  variant?: 'pill' | 'link'
  size?: 'xs' | 'sm' | 'md'
  /** Stretches the tabs over the full width. */
  full?: boolean
}>()

const tabs = computed<TabsItem[]>(() =>
  items.map((item) => ({
    badge:
      item.count === null || item.count === undefined
        ? undefined
        : { color: 'neutral', label: item.count, size: 'sm', variant: 'soft' },
    disabled: item.disabled,
    icon: item.icon,
    label: resolveTextValue(item.label),
    value: item.value,
  })),
)

// A segmented control: the active tab is a raised surface, not an inverted pill, so the strip
// stays quiet inside a card.
const ui = computed(() => ({
  indicator: variant === 'pill' ? 'rounded-[5px] bg-default shadow-xs ring ring-default' : '',
  list: [full ? 'w-full' : 'w-auto', variant === 'pill' && 'rounded-md p-0.5'],
  trigger: [
    full ? 'flex-1' : 'grow-0',
    variant === 'pill' && 'text-muted data-[state=active]:text-highlighted',
  ],
}))

// Tabs hand back `string | number`: map it to the typed item value.
const selected = computed({
  get: () => model.value,
  set(next: string | number) {
    const item = items.find((entry) => entry.value === next)
    if (item) model.value = item.value
  },
})
</script>

<template>
  <UTabs
    v-model="selected"
    :items="tabs"
    :content="false"
    :variant
    :size
    color="neutral"
    :class="full ? 'w-full' : 'w-auto'"
    :ui
    data-dashboard-tabs
  />
</template>
