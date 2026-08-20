<script setup lang="ts">
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { computed } from 'vue'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import type {
  DataListControlSize,
  DataListFilterEditorUi,
  TableResolvedFilterOptionEntry,
} from '../../../types'
import {
  mergeDataListUiClass,
  resolveDataListControlGeometry,
  resolveFilterEditorSizeClasses,
} from '../../../utils'

interface FilterOptionMultipleListSection {
  key: string
  entries: Array<TableResolvedFilterOptionEntry & { selected?: boolean; icon?: string }>
  dividerBefore?: boolean
}

const props = defineProps<{
  sections: FilterOptionMultipleListSection[]
  showCounts: boolean
  countLoading: boolean
  selectedIcon?: string
  truncate?: boolean
  size?: DataListControlSize
  ui?: DataListFilterEditorUi
}>()

const emit = defineEmits<{
  select: [
    options: {
      event: MouseEvent
      entry: TableResolvedFilterOptionEntry & { selected?: boolean; icon?: string }
      index: number
      sectionKey: string
    },
  ]
}>()

const dataListUi = useDataListUi()
const size = computed(
  () => props.size ?? dataListUi.ui.value.filterTags?.size ?? dataListUi.controlSize.value,
)
const ui = computed(() => props.ui ?? dataListUi.ui.value.filterTags?.ui)
const sizeClasses = computed(() => resolveFilterEditorSizeClasses(size.value))
const geometry = computed(() => resolveDataListControlGeometry(size.value))
</script>

<template>
  <div :class="mergeDataListUiClass('grid gap-0.5', undefined, ui?.list)">
    <template v-for="section in props.sections" :key="section.key">
      <div
        v-if="section.dividerBefore && section.entries.length"
        :class="mergeDataListUiClass('my-1 border-t border-default', undefined, ui?.listDivider)"
      />

      <div
        v-for="(entry, index) in section.entries"
        :key="entry.value == null ? entry.label : String(entry.value)"
        :class="
          mergeDataListUiClass(
            `flex items-center rounded-md text-left transition-colors hover:bg-elevated ${sizeClasses.option} ${entry.selected ? 'bg-elevated text-highlighted' : 'text-default'}`,
            undefined,
            ui?.option,
          )
        "
      >
        <UCheckbox
          :model-value="entry.selected ?? false"
          color="neutral"
          :size="size"
          :aria-label="entry.label"
          :icon="props.selectedIcon"
          :ui="{ base: ui?.optionCheckbox }"
          @click.stop="emit('select', { event: $event, entry, index, sectionKey: section.key })"
        />

        <button
          type="button"
          :class="['flex min-w-0 flex-1 items-center text-left', geometry.toolbarGap]"
          @click="emit('select', { event: $event, entry, index, sectionKey: section.key })"
        >
          <UIcon
            v-if="entry.icon"
            :name="entry.icon"
            :class="
              mergeDataListUiClass(
                `${sizeClasses.optionIcon} shrink-0 text-muted`,
                undefined,
                ui?.optionIcon,
              )
            "
          />
          <span
            :class="
              mergeDataListUiClass(
                `min-w-0 flex-1 ${sizeClasses.optionLabel} ${(props.truncate ?? true) ? 'truncate' : ''}`,
                undefined,
                ui?.optionLabel,
              )
            "
          >
            {{ entry.label }}
          </span>
        </button>

        <USkeleton
          v-if="props.showCounts && props.countLoading"
          :class="[sizeClasses.skeletonCount, 'shrink-0 rounded-full']"
        />
        <span
          v-else-if="props.showCounts && entry.count != null"
          :class="mergeDataListUiClass('shrink-0 text-muted', undefined, ui?.optionCount)"
        >
          {{ entry.count }}
        </span>
      </div>
    </template>
  </div>
</template>
