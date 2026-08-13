<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed, ref } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import type {
  DataListAddFilterUi,
  DataListControlSize,
  TableUiFilterDefinition,
} from '../../../types'
import { mergeDataListUiClass, resolveFilterTriggerIcon } from '../../../utils'
import FilterSearchablePanel from './FilterSearchablePanel.vue'

const props = defineProps<{
  definitions: TableUiFilterDefinition[]
  getLabel: (definition: TableUiFilterDefinition) => string
  size?: DataListControlSize
  ui?: DataListAddFilterUi
}>()

const emit = defineEmits<{
  select: [key: string]
}>()

const { t } = useUiToolsLocale()
const dataListUi = useDataListUi()
const isOpen = ref<boolean>(false)
const searchQuery = ref<string>('')

const filteredDefinitions = computed(() => {
  const search = searchQuery.value.trim().toLowerCase()
  if (!search) return props.definitions

  return props.definitions.filter((definition) =>
    props.getLabel(definition).toLowerCase().includes(search),
  )
})

function handleSelect(key: string) {
  emit('select', key)
  isOpen.value = false
  searchQuery.value = ''
}

function open() {
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

function toggle() {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <UPopover
    :open="isOpen"
    mode="click"
    :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
    :ui="{
      content: mergeDataListUiClass(
        'w-fit max-w-[calc(100vw-1rem)] overflow-hidden p-0',
        undefined,
        ui?.popoverContent,
      ),
    }"
    @update:open="isOpen = $event"
  >
    <slot
      name="trigger"
      :open="open"
      :close="close"
      :toggle="toggle"
      :open-state="isOpen"
      :trigger-props="{ type: 'button', 'aria-expanded': isOpen }"
    >
      <UButton
        color="neutral"
        variant="outline"
        :size="props.size ?? dataListUi.ui.value.filterTags?.size ?? dataListUi.controlSize.value"
        icon="i-lucide-plus"
        :label="t('table.controls.addFilter')"
        :ui="{
          base: mergeDataListUiClass('shrink-0 border-dashed', undefined, ui?.trigger),
        }"
      />
    </slot>

    <template #content>
      <div
        :class="
          mergeDataListUiClass(
            'w-fit min-w-[18rem] max-w-[min(24rem,calc(100vw-1rem))]',
            undefined,
            ui?.panel,
          )
        "
      >
        <FilterSearchablePanel
          v-model:search-query="searchQuery"
          searchable
          autofocus
          :search-placeholder="t('table.controls.searchFilters')"
          :show-empty="!filteredDefinitions.length"
          :empty-label="t('table.controls.noMatchingFilters')"
          max-height-class="max-h-72"
          :size="props.size"
          :ui="ui"
        >
          <button
            v-for="definition in filteredDefinitions"
            :key="definition.key"
            type="button"
            :class="
              mergeDataListUiClass(
                'flex min-w-0 items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-elevated/70',
                undefined,
                ui?.option,
              )
            "
            @click="handleSelect(definition.key)"
          >
            <UIcon
              :name="resolveFilterTriggerIcon(definition)"
              :class="mergeDataListUiClass('size-4 shrink-0 text-muted', undefined, ui?.optionIcon)"
            />
            <span
              :class="
                mergeDataListUiClass(
                  'min-w-0 flex-1 truncate text-sm text-default',
                  undefined,
                  ui?.optionLabel,
                )
              "
            >
              {{ getLabel(definition) }}
            </span>
            <span :class="mergeDataListUiClass('text-muted', undefined, ui?.optionTrailingIcon)">
              <UIcon name="i-lucide-arrow-right" class="size-4" />
            </span>
          </button>
        </FilterSearchablePanel>
      </div>
    </template>
  </UPopover>
</template>
