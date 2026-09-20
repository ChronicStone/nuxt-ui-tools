<script setup lang="ts">
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import type { DropdownMenuItem } from '@nuxt/ui/components/DropdownMenu.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import { useDataListUi } from '../../composables/use-data-list-ui'

const props = defineProps<{
  label: string
  icon?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  sortState?: 'asc' | 'desc' | null
  pinned?: boolean
  items: DropdownMenuItem[][]
  resizable?: boolean
  resizing?: boolean
  resetSize?: () => void
  resize?: (event: Event) => void
}>()

const open = defineModel<boolean>('open', { default: false })
const dataListUi = useDataListUi()

function reset(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  props.resetSize?.()
}

function startResize(event: MouseEvent | TouchEvent) {
  event.stopPropagation()
  props.resize?.(event)
}
</script>

<template>
  <div class="nut-dl-thc group/th relative flex h-full w-full min-w-0 items-stretch">
    <UDropdownMenu
      v-model:open="open"
      :size="dataListUi.controlSize.value"
      :items="items"
      :content="{ align: align === 'right' ? 'end' : 'start', side: 'bottom', sideOffset: 6 }"
      :modal="false"
      :ui="{ content: 'nut-dl-colmenu min-w-52 p-1.5' }"
    >
      <button
        type="button"
        class="nut-dl-th__btn flex h-full w-full min-w-0 items-center gap-1 bg-transparent text-left transition-colors duration-100 outline-none hover:text-highlighted focus-visible:text-highlighted"
        :class="[
          align === 'right'
            ? 'flex-row-reverse text-right'
            : align === 'center'
              ? 'justify-center text-center'
              : '',
          open ? 'nut-dl-th__btn--open text-highlighted' : '',
          sortState ? 'nut-dl-th__btn--sorted text-highlighted' : '',
        ]"
      >
        <UIcon v-if="icon" :name="icon" class="size-3.5 shrink-0 text-muted" />
        <span class="nut-dl-th__label min-w-0 truncate">{{ label }}</span>
        <UIcon
          v-if="sortable"
          class="nut-dl-th__sort size-3 shrink-0 transition-opacity duration-100 [&_svg]:stroke-[2.2]"
          :class="
            sortState
              ? 'text-primary opacity-100'
              : 'text-dimmed opacity-55 group-hover/th:opacity-90'
          "
          :name="
            sortState === 'asc'
              ? 'i-lucide-arrow-up'
              : sortState === 'desc'
                ? 'i-lucide-arrow-down'
                : 'i-lucide-chevrons-up-down'
          "
        />
      </button>
    </UDropdownMenu>
    <span
      v-if="resizable"
      class="nut-dl-rz absolute top-0 right-0 bottom-0 z-[5] w-[7px] cursor-col-resize touch-none select-none"
      :class="{ 'nut-dl-rz--active': resizing }"
      role="separator"
      aria-orientation="vertical"
      @click.stop
      @dblclick="reset"
      @mousedown="startResize"
      @touchstart.passive="startResize"
    />
  </div>
</template>

<style>
.nut-dl-colmenu {
  min-width: 13.5rem;
}
.nut-dl-colmenu .nut-dl-colmenu__title {
  padding: 0.35rem 0.5rem 0.25rem;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
}
.nut-dl-colmenu .nut-dl-colmenu__item--active {
  font-weight: 600;
  color: var(--ui-text-highlighted);
}
.nut-dl-colmenu .nut-dl-colmenu__item--active::after {
  content: '';
  margin-left: auto;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--ui-primary);
  flex: none;
}
</style>
