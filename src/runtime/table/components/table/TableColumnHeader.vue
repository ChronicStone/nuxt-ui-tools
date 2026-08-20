<script setup lang="ts">
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import type { DropdownMenuItem } from '@nuxt/ui/components/DropdownMenu.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useDataListUi } from '../../composables/use-data-list-ui'
import TableCellEllipsis from './TableCellEllipsis'

const props = defineProps<{
  label: string
  icon?: string
  headerIcon: string
  pinned?: boolean
  items: DropdownMenuItem[][]
  resizable?: boolean
  resizing?: boolean
  resetSize?: () => void
  resize?: (event: Event) => void
}>()

const dataListUi = useDataListUi()
const triggerClass = computed(() => {
  const size = dataListUi.controlSize.value
  if (size === 'xs') return 'h-6 -ml-1.5 gap-1 px-1.5 text-xs'
  if (size === 'sm') return 'h-7 -ml-1.5 gap-1.5 px-1.5 text-xs'
  if (size === 'md') return 'h-8 -ml-2 gap-1.5 px-2 text-sm'
  if (size === 'lg') return 'h-9 -ml-2 gap-2 px-2 text-sm'
  return 'h-10 -ml-2.5 gap-2 px-2.5 text-sm'
})

function reset(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  props.resetSize?.()
}

function startResize(event: MouseEvent | TouchEvent) {
  event.preventDefault()
  event.stopPropagation()
  props.resize?.(event)
}
</script>

<template>
  <div class="group/column-header relative flex h-full w-full items-center">
    <UDropdownMenu
      :size="dataListUi.controlSize.value"
      :items="items"
      :content="{ align: 'start', side: 'bottom', sideOffset: 10 }"
      :modal="false"
      :ui="{ content: 'w-fit p-1 shadow-none' }"
    >
      <button
        type="button"
        :class="[
          'inline-flex min-w-0 max-w-full items-center rounded-md text-left text-default transition-colors hover:bg-elevated focus-visible:outline-2 focus-visible:outline-primary/30',
          triggerClass,
        ]"
      >
        <div class="flex min-w-0 items-center gap-2">
          <UIcon v-if="icon" :name="icon" class="size-4 shrink-0 text-muted" />
          <TableCellEllipsis :title="label" wrapper-class="min-w-0 max-w-full">
            <span data-column-label="true" class="block min-w-0 truncate">
              {{ label }}
            </span>
          </TableCellEllipsis>
        </div>
        <UIcon :name="headerIcon" class="size-4 shrink-0 text-muted" />
        <UIcon v-if="pinned" name="i-lucide-pin" class="size-3.5 shrink-0 text-muted" />
      </button>
    </UDropdownMenu>

    <div
      v-if="resizable"
      :aria-label="`Resize ${label} column`"
      role="separator"
      :class="[
        'absolute inset-y-1 -right-1 z-20 w-3 cursor-col-resize touch-none select-none opacity-0',
        `transition-opacity duration-150 after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:rounded-full after:content-['']`,
        resizing
          ? 'opacity-100 after:bg-primary'
          : 'group-hover/table-head:opacity-100 hover:opacity-100 after:bg-accented/70',
      ]"
      @dblclick="reset"
      @mousedown="startResize"
      @touchstart="startResize"
    />
  </div>
</template>
