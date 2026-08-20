<script setup lang="ts">
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
        :ui="{ root: ui?.search, base: ui?.searchInput }"
      />
    </div>

    <UScrollArea
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
          mergeDataListUiClass(`${sizeClasses.empty} text-center text-muted`, undefined, ui?.empty)
        "
      >
        <slot name="empty">
          {{ emptyLabel }}
        </slot>
      </div>
    </UScrollArea>
  </div>
</template>
