<script setup lang="ts">
import UDrawer from '@nuxt/ui/components/Drawer.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import type { DropdownMenuProps } from '@nuxt/ui/components/DropdownMenu.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, ref, useAttrs } from 'vue'

import { useDataListBreakpoint } from '../../composables/use-data-list-breakpoint'
import { useTableInternals } from '../../composables/use-table-internals'
import { useTableRowActionScope } from '../../composables/use-table-row-actions'
import type { DataListControlSize } from '../../types'
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
  size?: DataListControlSize
  ui?: DropdownMenuProps['ui']
}>()

const attrs = useAttrs()
const internals = useTableInternals()
const { isMobile } = useDataListBreakpoint()
const sheetOpen = ref<boolean>(false)
interface SheetItem {
  label?: string
  icon?: string
  color?: string
  disabled?: boolean
  onSelect?: (event: Event) => void
  dividerBefore: boolean
}
const sheetItems = computed<SheetItem[]>(() => {
  const groups = (Array.isArray(items.value[0]) ? items.value : [items.value]) as Array<
    Omit<SheetItem, 'dividerBefore'>
  >[]
  return groups.flatMap((group, index) =>
    group.map((item, itemIndex) => ({ ...item, dividerBefore: index > 0 && itemIndex === 0 })),
  )
})
function runSheetItem(item: SheetItem) {
  sheetOpen.value = false
  item.onSelect?.(new Event('select'))
}
const scope = useTableRowActionScope()
const portal = computed(() => props.portal ?? true)
const visibleActions = computed(() => {
  if (!scope?.value) {
    return []
  }

  return resolveVisibleTableRowActions({
    schema: internals.schema.value,
    scope: scope.value,
  })
})

const items = computed(() => {
  if (!scope?.value) {
    return []
  }

  return createRowActionDropdownItems({
    actions: visibleActions.value,
    scope: scope.value,
  })
})
</script>

<template>
  <UDrawer
    v-if="scope && visibleActions.length && items.length && isMobile"
    v-model:open="sheetOpen"
    direction="bottom"
    title="Actions"
    :ui="{
      header: 'sr-only',
      content: 'nut-dl-sheet rounded-t-[16px]',
      container: 'gap-0 p-0',
      body: 'p-0 pb-4',
    }"
  >
    <slot :items="items" :open="sheetOpen" />
    <template #body>
      <div class="px-[10px] pt-2">
        <template v-for="(item, index) in sheetItems" :key="index">
          <div v-if="item.dividerBefore" class="my-1 border-t border-default" />
          <button
            type="button"
            class="nut-dl-sheet__row flex h-[46px] w-full items-center gap-[10px] rounded-lg px-[10px] text-left text-[15px] text-highlighted active:bg-elevated disabled:opacity-40"
            :class="item.color === 'error' ? 'text-error' : ''"
            :disabled="Boolean(item.disabled)"
            @click="runSheetItem(item)"
          >
            <UIcon
              v-if="item.icon"
              :name="item.icon"
              class="size-4 shrink-0 text-muted"
              :class="item.color === 'error' ? 'text-error' : ''"
            />
            <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
          </button>
        </template>
      </div>
    </template>
  </UDrawer>
  <UDropdownMenu
    v-else-if="scope && visibleActions.length && items.length"
    :items="items"
    :content="props.content"
    :modal="props.modal"
    :portal="portal"
    :arrow="props.arrow"
    :disabled="props.disabled"
    :size="props.size"
    :ui="props.ui"
    v-bind="attrs"
  >
    <template #default="slotProps">
      <slot v-bind="slotProps" :items="items" />
    </template>
  </UDropdownMenu>
</template>
