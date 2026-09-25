<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UScrollArea from '@nuxt/ui/components/ScrollArea.vue'
import { computed } from 'vue'

import type { DataListControlSize, DataListFilterEditorUi } from '../../../types'
import { mergeDataListUiClass, resolveFilterEditorSizeClasses } from '../../../utils'

const {
  searchable = false,
  autofocus = false,
  searchPlaceholder = 'Search...',
  searchLoading = false,
  showEmpty = false,
  emptyLabel = 'No matching options.',
  maxHeightClass = 'max-h-80',
  size,
  ui,
} = defineProps<{
  searchable?: boolean
  autofocus?: boolean
  searchPlaceholder?: string
  searchLoading?: boolean
  showEmpty?: boolean
  emptyLabel?: string
  maxHeightClass?: string
  size?: DataListControlSize
  ui?: DataListFilterEditorUi
}>()

const searchQuery = defineModel<string>('searchQuery', {
  default: '',
})
const sizeClasses = computed(() => resolveFilterEditorSizeClasses(size))
</script>

<template>
  <div :class="mergeDataListUiClass('w-full min-w-0 max-w-full bg-default', undefined, ui?.editor)">
    <div
      v-if="searchable"
      :class="
        mergeDataListUiClass(
          `w-full border-b border-default ${sizeClasses.searchHeader}`,
          undefined,
          ui?.searchHeader,
        )
      "
    >
      <UInput
        v-model="searchQuery"
        icon="i-lucide-search"
        :placeholder="searchPlaceholder"
        class="w-full"
        :loading="searchLoading"
        variant="none"
        :autofocus="autofocus"
        :size="size"
        :ui="{
          root: ui?.search,
          base: mergeDataListUiClass('h-8', undefined, ui?.searchInput),
        }"
      />
    </div>

    <UScrollArea
      data-filter-option-scroll
      type="hover"
      :class="
        mergeDataListUiClass(
          `${sizeClasses.scrollArea} ${maxHeightClass}`,
          undefined,
          ui?.scrollArea,
        )
      "
      :ui="{
        root: mergeDataListUiClass(maxHeightClass, undefined, ui?.scrollArea),
        viewport: mergeDataListUiClass(maxHeightClass, undefined, ui?.scrollViewport),
      }"
    >
      <slot />

      <div
        v-if="showEmpty"
        :class="
          mergeDataListUiClass(
            `nut-dl-editor__empty ${sizeClasses.empty} text-center text-muted`,
            undefined,
            ui?.empty,
          )
        "
      >
        <slot name="empty">
          <div class="grid justify-items-center gap-1.5">
            <UIcon name="i-lucide-search-x" class="size-4 text-dimmed" aria-hidden="true" />
            <span class="text-[12.5px] leading-[18px]">{{ emptyLabel }}</span>
            <span
              v-if="searchQuery.trim()"
              class="max-w-full truncate text-[12px] leading-[16px] text-dimmed"
              >« {{ searchQuery.trim() }} »</span
            >
          </div>
        </slot>
      </div>
    </UScrollArea>
  </div>
</template>
