<script setup lang="ts">
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { computed } from 'vue'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import type { DataListControlSize, DataListFilterEditorUi } from '../../../types'
import { mergeDataListUiClass, resolveFilterEditorSizeClasses } from '../../../utils'

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

const modelValue = defineModel<string | undefined>({
  default: undefined,
})

function getTreeIndentStyle(depth: number) {
  return {
    paddingInlineStart: `${depth * 10}px`,
  }
}
</script>

<template>
  <div v-if="multiple" :class="mergeDataListUiClass('grid gap-0.5', undefined, ui?.list)">
    <button
      v-for="entry in entries"
      :key="entry.id"
      type="button"
      class="block w-full"
      @click="emit('toggleEntry', entry.id)"
    >
      <div
        :class="
          mergeDataListUiClass(
            `flex items-center rounded-md text-left transition-colors hover:bg-elevated ${sizeClasses.option} ${entry.selected ? 'bg-elevated text-highlighted' : 'text-default'}`,
            undefined,
            ui?.option,
          )
        "
      >
        <div
          class="flex min-w-0 flex-1 items-center gap-2"
          :style="getTreeIndentStyle(entry.depth)"
        >
          <button
            v-if="entry.expandable"
            type="button"
            :class="
              mergeDataListUiClass(
                `flex size-4 shrink-0 items-center justify-center text-muted transition-transform ${entry.expanded ? 'rotate-90' : ''}`,
                undefined,
                ui?.optionExpander,
              )
            "
            @click.stop="emit('toggleExpanded', entry.id)"
          >
            <UIcon name="i-lucide-chevron-right" class="size-4" />
          </button>
          <span
            v-else
            :class="mergeDataListUiClass('size-4 shrink-0', undefined, ui?.optionSpacer)"
          />

          <UCheckbox
            v-if="entry.selectable || entry.branchSelectable"
            :model-value="entry.indeterminate ? 'indeterminate' : entry.selected"
            color="neutral"
            :size="size"
            tabindex="-1"
            :icon="selectedIcon"
            :ui="{ base: ui?.optionCheckbox }"
          />
          <span
            v-else
            :class="mergeDataListUiClass('size-5 shrink-0', undefined, ui?.optionSpacer)"
          />

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
        </div>

        <USkeleton v-if="countLoading" class="ml-3 h-3.5 w-6 shrink-0" />
        <span
          v-else-if="entry.count != null"
          :class="mergeDataListUiClass('ml-3 shrink-0 text-muted', undefined, ui?.optionCount)"
        >
          {{ entry.count }}
        </span>
      </div>
    </button>
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
      <div class="flex min-w-0 items-center gap-3" :style="getTreeIndentStyle(item.depth)">
        <button
          v-if="item.expandable"
          type="button"
          class="flex size-4 shrink-0 items-center justify-center text-muted transition-transform"
          :class="item.expanded ? 'rotate-90' : ''"
          @click.stop.prevent="emit('toggleExpanded', item.id)"
        >
          <UIcon name="i-lucide-chevron-right" class="size-4" />
        </button>
        <span v-else class="size-4 shrink-0" />

        <UIcon
          v-if="typeof item.icon === 'string'"
          :name="item.icon"
          class="size-4 shrink-0 text-muted"
        />

        <span class="min-w-0 flex-1" :class="item.truncate ? 'truncate' : ''">
          {{ item.label }}
        </span>
        <USkeleton v-if="countLoading" class="ml-3 h-3.5 w-6 shrink-0" />
        <span v-else-if="item.count != null" class="ml-3 shrink-0 text-muted">
          {{ item.count }}
        </span>
      </div>
    </template>
  </URadioGroup>
</template>
