<script setup lang="ts">
import type { DropdownMenuProps } from '@nuxt/ui'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import { computed, useAttrs } from 'vue'

import { useTableInternals } from '../../composables/use-table-internals'
import { useTableRowActionScope } from '../../composables/use-table-row-actions'
import { createRowActionDropdownItems, resolveVisibleTableRowActions } from '../../utils'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  content?: DropdownMenuProps['content']
  modal?: DropdownMenuProps['modal']
  portal?: DropdownMenuProps['portal']
  arrow?: DropdownMenuProps['arrow']
  disabled?: DropdownMenuProps['disabled']
  ui?: DropdownMenuProps['ui']
}>()

const attrs = useAttrs()
const internals = useTableInternals()
const scope = useTableRowActionScope()
const portal = computed(() => props.portal ?? true)
const visibleActions = computed(() => {
  if (!scope?.value) return []

  return resolveVisibleTableRowActions({
    schema: internals.schema.value,
    scope: scope.value,
  })
})

const items = computed(() => {
  if (!scope?.value) return []

  return createRowActionDropdownItems({
    actions: visibleActions.value,
    scope: scope.value,
  })
})
</script>

<template>
  <UDropdownMenu
    v-if="scope && visibleActions.length && items.length"
    :items="items"
    :content="props.content"
    :modal="props.modal"
    :portal="portal"
    :arrow="props.arrow"
    :disabled="props.disabled"
    :ui="props.ui"
    v-bind="attrs"
  >
    <template #default="slotProps">
      <slot v-bind="slotProps" :items="items" />
    </template>
  </UDropdownMenu>
</template>
