<script setup lang="ts">
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { computed } from 'vue'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import type { DataListControlSize, DataListFilterEditorUi } from '../../../types'
import {
  mergeDataListUiClass,
  resolveDataListControlGeometry,
  resolveFilterEditorSizeClasses,
} from '../../../utils'

type TreeEntry = {
  id: string
  label: string
  value?: string | number | boolean
  count?: number
  icon?: string
  depth: number
  expandable: boolean
  expanded: boolean
  selectable: boolean
  branchSelectable?: boolean
  selected?: boolean
  indeterminate?: boolean
  truncate?: boolean
}

const props = defineProps<{
  entries: TreeEntry[]
  items: Array<{
    id: string
    label: string
    value: string
    count?: number
    icon?: string
    truncate?: boolean
    depth: number
    expandable: boolean
    expanded: boolean
    selectable: boolean
    disabled?: boolean
  }>
  multiple: boolean
  countLoading: boolean
  selectedIcon?: string
  size?: DataListControlSize
  ui?: DataListFilterEditorUi
}>()

const emit = defineEmits<{
  toggleEntry: [entryId: string]
  toggleExpanded: [entryId: string]
}>()

const dataListUi = useDataListUi()
const size = computed(
  () => props.size ?? dataListUi.ui.value.filterTags?.size ?? dataListUi.controlSize.value,
)
const ui = computed(() => props.ui ?? dataListUi.ui.value.filterTags?.ui)
const sizeClasses = computed(() => resolveFilterEditorSizeClasses(size.value))
const geometry = computed(() => resolveDataListControlGeometry(size.value))
const indentStep = computed(() => {
  if (size.value === 'xs' || size.value === 'sm') return 8
  if (size.value === 'md') return 10
  if (size.value === 'lg') return 12
  return 14
})

const modelValue = defineModel<string | undefined>({ default: undefined })

function getTreeIndentStyle(depth: number) {
  return { paddingInlineStart: `${depth * indentStep.value}px` }
}

function activateTreeEntry(entry: TreeEntry) {
  if (entry.selectable || entry.branchSelectable) {
    emit('toggleEntry', entry.id)
    return
  }
  if (entry.expandable) emit('toggleExpanded', entry.id)
}
</script>

<template>
  <div v-if="multiple" :class="mergeDataListUiClass('grid gap-0.5', undefined, ui?.list)">
    <div
      v-for="entry in entries"
      :key="entry.id"
      :class="
        mergeDataListUiClass(
          `flex items-center rounded-md text-left transition-colors hover:bg-elevated ${sizeClasses.option} ${entry.selected ? 'bg-elevated text-highlighted' : 'text-default'}`,
          undefined,
          ui?.option,
        )
      "
      :style="getTreeIndentStyle(entry.depth)"
    >
      <button
        v-if="entry.expandable"
        type="button"
        :aria-label="entry.expanded ? `Collapse ${entry.label}` : `Expand ${entry.label}`"
        :aria-expanded="entry.expanded"
        :class="
          mergeDataListUiClass(
            `flex ${sizeClasses.optionIcon} shrink-0 items-center justify-center rounded-sm text-muted transition-transform hover:bg-accented ${entry.expanded ? 'rotate-90' : ''}`,
            undefined,
            ui?.optionExpander,
          )
        "
        @click.stop="emit('toggleExpanded', entry.id)"
      >
        <UIcon name="i-lucide-chevron-right" :class="sizeClasses.optionIcon" />
      </button>
      <span
        v-else
        :class="
          mergeDataListUiClass(`${sizeClasses.optionIcon} shrink-0`, undefined, ui?.optionSpacer)
        "
      />

      <UCheckbox
        v-if="entry.selectable || entry.branchSelectable"
        :model-value="entry.indeterminate ? 'indeterminate' : entry.selected"
        color="neutral"
        :size="size"
        :aria-label="entry.label"
        :icon="selectedIcon"
        :ui="{ base: ui?.optionCheckbox }"
        @click.stop
        @update:model-value="emit('toggleEntry', entry.id)"
      />
      <span
        v-else
        :class="mergeDataListUiClass(`${geometry.icon} shrink-0`, undefined, ui?.optionSpacer)"
      />

      <button
        type="button"
        class="flex min-w-0 flex-1 items-center text-left"
        :class="geometry.toolbarGap"
        @click="activateTreeEntry(entry)"
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
              `min-w-0 flex-1 ${sizeClasses.optionLabel} ${entry.truncate ? 'truncate' : ''}`,
              undefined,
              ui?.optionLabel,
            )
          "
        >
          {{ entry.label }}
        </span>
      </button>

      <USkeleton
        v-if="countLoading"
        :class="[sizeClasses.skeletonCount, 'shrink-0 rounded-full']"
      />
      <span
        v-else-if="entry.count != null"
        :class="mergeDataListUiClass('shrink-0 text-muted', undefined, ui?.optionCount)"
      >
        {{ entry.count }}
      </span>
    </div>
  </div>

  <URadioGroup
    v-else-if="items.length"
    v-model="modelValue"
    :items="items"
    color="neutral"
    variant="list"
    :size="size"
    :ui="{
      root: 'w-full',
      fieldset: mergeDataListUiClass('grid gap-0.5', undefined, ui?.list),
      item: mergeDataListUiClass(
        `flex items-center rounded-md transition-colors hover:bg-elevated data-[state=checked]:bg-elevated ${sizeClasses.option}`,
        undefined,
        ui?.option,
      ),
      container: 'self-center',
      base: 'cursor-pointer',
      wrapper: 'min-w-0 flex-1',
      label: mergeDataListUiClass(
        `w-full cursor-pointer text-default ${sizeClasses.optionLabel}`,
        undefined,
        ui?.optionLabel,
      ),
    }"
  >
    <template #label="{ item }">
      <div
        :class="['flex min-w-0 items-center', geometry.toolbarGap]"
        :style="getTreeIndentStyle(item.depth)"
      >
        <span
          v-if="item.expandable"
          role="button"
          tabindex="0"
          :aria-label="item.expanded ? `Collapse ${item.label}` : `Expand ${item.label}`"
          :aria-expanded="item.expanded"
          :class="[
            'flex shrink-0 items-center justify-center rounded-sm text-muted transition-transform hover:bg-accented',
            sizeClasses.optionIcon,
            item.expanded ? 'rotate-90' : '',
          ]"
          @pointerdown.stop.prevent
          @click.stop.prevent="emit('toggleExpanded', item.id)"
          @keydown.enter.stop.prevent="emit('toggleExpanded', item.id)"
          @keydown.space.stop.prevent="emit('toggleExpanded', item.id)"
        >
          <UIcon name="i-lucide-chevron-right" :class="sizeClasses.optionIcon" />
        </span>
        <span v-else :class="[sizeClasses.optionIcon, 'shrink-0']" />

        <UIcon
          v-if="typeof item.icon === 'string'"
          :name="item.icon"
          :class="[sizeClasses.optionIcon, 'shrink-0 text-muted']"
        />

        <span class="min-w-0 flex-1" :class="item.truncate ? 'truncate' : ''">
          {{ item.label }}
        </span>
        <USkeleton
          v-if="countLoading"
          :class="[sizeClasses.skeletonCount, 'shrink-0 rounded-full']"
        />
        <span v-else-if="item.count != null" class="shrink-0 text-muted">
          {{ item.count }}
        </span>
      </div>
    </template>
  </URadioGroup>
</template>
