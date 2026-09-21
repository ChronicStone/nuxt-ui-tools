<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import type { DropdownMenuItem } from '@nuxt/ui/components/DropdownMenu.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import type { DashboardRowAction } from '../../types'

/**
 * Actions of one row: `inline` actions as icon buttons, the others in a `⋮` menu. Sits above the
 * row's stretched select button, so both stay clickable.
 */
const props = defineProps<{
  actions: readonly DashboardRowAction[]
  /** Accessible name of the `⋮` button, naming the row. */
  label: string
}>()

const { t } = useUiToolsLocale()

const inline = computed(() => props.actions.filter((action) => action.inline && action.icon))
const items = computed<DropdownMenuItem[]>(() =>
  props.actions.flatMap(({ inline: isInline, ...item }) => (isInline && item.icon ? [] : [item])),
)
</script>

<template>
  <div class="relative z-[1] -me-1 flex shrink-0 items-center gap-0.5" data-row-actions>
    <UButton
      v-for="(action, index) in inline"
      :key="index"
      color="neutral"
      variant="ghost"
      size="xs"
      square
      :icon="action.icon"
      :to="action.to"
      :disabled="action.disabled"
      :aria-label="action.label"
      class="text-dimmed hover:text-default"
      @click="action.onSelect?.($event)"
    />
    <UDropdownMenu
      v-if="items.length"
      :items
      :content="{ align: 'end', side: 'bottom', sideOffset: 4 }"
    >
      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        square
        icon="i-lucide-ellipsis-vertical"
        :aria-label="t('dashboard.rowActions', { label })"
        class="text-dimmed hover:text-default"
      />
    </UDropdownMenu>
  </div>
</template>
