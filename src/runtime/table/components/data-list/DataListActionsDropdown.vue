<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import type { DropdownMenuItem } from '@nuxt/ui/components/DropdownMenu.vue'
import { computed, type VNodeChild } from 'vue'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListControlSize } from '../../types'
import { resolveTableActionLabel } from '../../utils/actions'

const props = withDefaults(
  defineProps<{
    size?: DataListControlSize
    label?: string
    icon?: string
  }>(),
  {
    label: 'Actions',
    icon: 'i-lucide-zap',
  },
)

const internals = useTableInternals()
const dataListUi = useDataListUi()
const size = computed(() => props.size ?? dataListUi.controlSize.value)
const actions = computed(() => internals.actions.toolbarActions.value)
const items = computed<DropdownMenuItem[][]>(() => [
  actions.value.map((action) => {
    const item: DropdownMenuItem = {
      ...action.definition,
      label: resolveTableActionLabel(action.definition.label),
      disabled: action.state.disabled,
      loading: action.state.loading || action.running,
      onSelect: () => void action.execute(),
    }

    delete item.condition
    delete item.action
    delete item.requiresSelection
    return item
  }),
])

defineSlots<{
  trigger?: (props: { triggerProps: { type: 'button'; 'aria-expanded': boolean } }) => VNodeChild
}>()
</script>

<template>
  <UDropdownMenu
    v-if="actions.length"
    :items="items"
    :size="size"
    :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
    :ui="{ content: 'w-fit min-w-48 p-1' }"
  >
    <template #default="{ open }">
      <slot name="trigger" :trigger-props="{ type: 'button', 'aria-expanded': open }">
        <UButton
          color="neutral"
          variant="outline"
          :size="size"
          :icon="props.icon"
          :label="props.label"
          trailing-icon="i-lucide-chevron-down"
          :aria-expanded="open"
        />
      </slot>
    </template>
  </UDropdownMenu>
</template>
