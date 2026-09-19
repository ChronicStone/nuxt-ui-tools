<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed, nextTick, ref } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { isNumber } from '../../../../shared/utils/predicate'
import { useDataListUi } from '../../../composables/use-data-list-ui'
import { useTableInternals } from '../../../composables/use-table-internals'
import type {
  DataListAddFilterUi,
  DataListButtonProps,
  DataListControlSize,
  TableFilterOperator,
  TableUiFilterDefinition,
} from '../../../types'
import {
  mergeDataListProps,
  mergeDataListUiClass,
  resolveDataListControlGeometry,
  resolveFilterEditorSizeClasses,
  resolveDataListPopoverContentClass,
  resolveFilterTriggerIcon,
} from '../../../utils'
import { resolveFilterTagComponent } from '../tags/registry'
import FilterMatchModePanel from './FilterMatchModePanel.vue'
import FilterSearchablePanel from './FilterSearchablePanel.vue'
import FilterStageTransition from './FilterStageTransition.vue'

const props = defineProps<{
  definitions: TableUiFilterDefinition[]
  sessionDefinition?: TableUiFilterDefinition
  getLabel: (definition: TableUiFilterDefinition) => string
  size?: DataListControlSize
  ui?: DataListAddFilterUi
}>()

const emit = defineEmits<{
  select: [key: string]
  release: [key: string]
}>()

const { t } = useUiToolsLocale()
const internals = useTableInternals()
const dataListUi = useDataListUi()
const isOpen = ref<boolean>(false)
const searchQuery = ref<string>('')
const selectedKey = ref<string | null>(null)
const pendingOperator = ref<TableFilterOperator>()
const stage = ref<'picker' | 'match-mode' | 'editor'>('picker')
const stageDirection = ref<'forward' | 'backward'>('forward')
const stageTransitioning = ref<boolean>(false)
let releaseAfterCommit = false
const size = computed(
  () => props.size ?? dataListUi.ui.value.filterTags?.size ?? dataListUi.controlSize.value,
)
const sizeClasses = computed(() => resolveFilterEditorSizeClasses(size.value))
const geometry = computed(() => resolveDataListControlGeometry(size.value))
const pickerProps = computed(() => dataListUi.ui.value.addFilter?.props)
const searchable = computed(() => {
  const search = pickerProps.value?.search ?? 8
  return isNumber(search) ? props.definitions.length > search : search
})
const triggerProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    { color: 'neutral', size: size.value, variant: 'ghost' },
    dataListUi.ui.value.filterTags?.props?.addTrigger,
    dataListUi.ui.value.addFilter?.props?.trigger,
  ),
)

const selectedDefinition = computed(() => {
  if (selectedKey.value == null) {
    return undefined
  }
  if (props.sessionDefinition?.key === selectedKey.value) {
    return props.sessionDefinition
  }
  return props.definitions.find((definition) => definition.key === selectedKey.value)
})

const operatorItems = computed(() =>
  selectedKey.value == null
    ? []
    : internals.filters.getFilterOperatorOptions({ key: selectedKey.value }),
)

const filteredDefinitions = computed(() => {
  const search = searchQuery.value.trim().toLowerCase()
  if (!search) {
    return props.definitions
  }

  return props.definitions.filter((definition) =>
    props.getLabel(definition).toLowerCase().includes(search),
  )
})

async function handleSelect(key: string) {
  selectedKey.value = key
  searchQuery.value = ''
  const items = internals.filters.getFilterOperatorOptions({ key })

  if (items.length > 1) {
    pendingOperator.value = internals.filters.getFilterOperator({ key })
    stageDirection.value = 'forward'
    stageTransitioning.value = true
    stage.value = 'match-mode'
    return
  }

  const defaultOperator = items[0]?.value
  if (!defaultOperator) {
    return
  }
  await openEditor(defaultOperator)
}

async function openEditor(operator: TableFilterOperator) {
  const key = selectedKey.value
  if (!key) {
    return
  }
  pendingOperator.value = operator
  emit('select', key)
  await nextTick()
  stageDirection.value = 'forward'
  stageTransitioning.value = true
  stage.value = 'editor'
}

function handleFocusOutside(event: Event) {
  if (stageTransitioning.value) {
    event.preventDefault()
  }
}

function handleOpenChange(nextOpen: boolean) {
  isOpen.value = nextOpen
  if (!nextOpen && !releaseAfterCommit) {
    releaseSession()
  }
}

function handleSessionClosed() {
  isOpen.value = false
  releaseAfterCommit = true
  queueMicrotask(() => {
    releaseSession()
    releaseAfterCommit = false
  })
}

function goBack() {
  stageTransitioning.value = true
  releaseSession()
}

function releaseSession() {
  const key = selectedKey.value
  selectedKey.value = null
  pendingOperator.value = undefined
  searchQuery.value = ''
  stage.value = 'picker'
  stageDirection.value = 'backward'
  if (key) {
    emit('release', key)
  }
}

function open() {
  isOpen.value = true
}

function close() {
  isOpen.value = false
  releaseSession()
}

function toggle() {
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}
</script>

<template>
  <UPopover
    :open="isOpen"
    mode="click"
    :content="{
      side: 'bottom',
      align: 'start',
      sideOffset: 8,
      onFocusOutside: handleFocusOutside,
    }"
    :ui="{
      content: resolveDataListPopoverContentClass(
        'fit',
        mergeDataListUiClass(
          `${sizeClasses.editor} overflow-hidden p-0`,
          undefined,
          ui?.popoverContent,
        ),
      ),
    }"
    @update:open="handleOpenChange"
  >
    <slot
      v-if="$slots.trigger"
      name="trigger"
      :open="open"
      :close="close"
      :toggle="toggle"
      :open-state="isOpen"
      :stage="stage"
      :definition="selectedDefinition"
      :trigger-props="{
        type: 'button',
        'aria-expanded': isOpen,
      }"
    />
    <UButton
      v-else
      v-bind="triggerProps"
      :icon="
        selectedDefinition
          ? dataListUi.ui.value.filterTags?.props?.icon === false
            ? undefined
            : resolveFilterTriggerIcon(selectedDefinition)
          : 'i-lucide-plus'
      "
      :label="
        selectedDefinition
          ? getLabel(selectedDefinition)
          : (triggerProps.label ?? t('table.controls.addFilter'))
      "
      :ui="{
        base: mergeDataListUiClass(
          `nut-dl-tag nut-dl-tag--add shrink-0 ${selectedDefinition ? '' : 'border border-dashed border-[var(--ui-border-accented)] text-muted hover:text-default hover:border-[var(--ui-text-dimmed)]'}`,
          undefined,
          ui?.trigger,
        ),
        leadingIcon: 'size-[13px]',
      }"
    />

    <template #content>
      <FilterStageTransition
        :stage-key="`${stage}:${selectedKey ?? ''}:${pendingOperator ?? ''}`"
        :direction="stageDirection"
        @settled="stageTransitioning = false"
      >
        <div
          v-if="stage === 'picker'"
          :class="mergeDataListUiClass(sizeClasses.editor, undefined, ui?.panel)"
        >
          <div
            v-if="pickerProps?.title !== false"
            :class="
              mergeDataListUiClass(
                'nut-dl-picker__title px-3 pt-2.5 pb-1 text-[12.5px] font-semibold text-muted',
                undefined,
                ui?.title,
              )
            "
          >
            {{ t('table.controls.addFilter') }}
          </div>
          <FilterSearchablePanel
            v-model:search-query="searchQuery"
            :searchable="searchable"
            :autofocus="searchable"
            :search-placeholder="t('table.controls.searchFilters')"
            :show-empty="!filteredDefinitions.length"
            :empty-label="t('table.controls.noMatchingFilters')"
            max-height-class="max-h-72"
            :size="size"
            :ui="ui"
          >
            <button
              v-for="definition in filteredDefinitions"
              :key="definition.key"
              type="button"
              :class="
                mergeDataListUiClass(
                  `flex min-w-0 items-center rounded-md text-left outline-none transition-colors hover:bg-elevated/70 focus-visible:ring-2 focus-visible:ring-primary/40 ${sizeClasses.option}`,
                  undefined,
                  ui?.option,
                )
              "
              @click="handleSelect(definition.key)"
            >
              <UIcon
                :name="
                  pickerProps?.icon === 'kind'
                    ? resolveFilterTriggerIcon(definition)
                    : 'i-lucide-plus'
                "
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
                    `min-w-0 flex-1 truncate text-default ${sizeClasses.optionLabel}`,
                    undefined,
                    ui?.optionLabel,
                  )
                "
              >
                {{ getLabel(definition) }}
              </span>
              <span
                :class="
                  mergeDataListUiClass(
                    'inline-flex shrink-0 items-center text-dimmed',
                    undefined,
                    ui?.optionTrailingIcon,
                  )
                "
              >
                <UIcon name="i-lucide-chevron-right" :class="geometry.icon" />
              </span>
            </button>
          </FilterSearchablePanel>
        </div>

        <div
          v-else-if="stage === 'match-mode'"
          :class="mergeDataListUiClass(sizeClasses.editor, undefined, ui?.panel)"
        >
          <FilterMatchModePanel
            :items="operatorItems"
            :selected="pendingOperator"
            :size="size"
            :ui="ui"
            @select="openEditor"
          />
        </div>

        <component
          :is="resolveFilterTagComponent(sessionDefinition)"
          v-else-if="stage === 'editor' && sessionDefinition"
          :definition="sessionDefinition"
          dynamic
          session
          embedded
          :initial-operator="pendingOperator"
          @dismiss="handleSessionClosed"
          @session-closed="handleSessionClosed"
          @back="goBack"
        />
      </FilterStageTransition>
    </template>
  </UPopover>
</template>
