<script setup lang="ts">
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed, ref } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { isBoolean, isNumber, isString, isNullish } from '../../../../shared/utils/predicate'
import { useDataListUi } from '../../../composables/use-data-list-ui'
import { useOptionFilterEditorState } from '../../../composables/use-option-filter-editor-state'
import { useTableInternals } from '../../../composables/use-table-internals'
import type {
  DataListControlSize,
  DataListFilterPanelUi,
  TableFilterOperator,
  TableOptionFilterDefinition,
  TableOptionFilterOperator,
} from '../../../types'
import { resolveDataListPopoverContentClass } from '../../../utils'
import FilterMatchModeButton from '../shared/FilterMatchModeButton.vue'
import FilterOptionPickerContent from '../shared/FilterOptionPickerContent.vue'
import FilterPanelChips from './FilterPanelChips.vue'
import FilterPanelFieldShell from './FilterPanelFieldShell.vue'
import FilterPanelInputTrigger from './FilterPanelInputTrigger.vue'

const props = defineProps<{
  definition: TableOptionFilterDefinition
  size: DataListControlSize
  ui?: DataListFilterPanelUi
}>()

const internals = useTableInternals()
const dataListUi = useDataListUi()
const { t } = useUiToolsLocale()
const searchQuery = ref<string>('')
const pendingOperator = ref<TableOptionFilterOperator>(resolveInitialOperator())
const isOpen = ref<boolean>(false)

const selectedValues = computed(() => {
  const value = internals.filterPresentation.getPanelDraftFilterState({
    key: props.definition.key,
  })?.value
  if (Array.isArray(value)) {
    return value.filter(isPrimitiveValue)
  }
  return isPrimitiveValue(value) ? [value] : []
})

const state = useOptionFilterEditorState({
  active: internals.filterPresentation.panelOpen,
  definition: props.definition,
  filters: internals.filters,
  operator: pendingOperator,
  queryContent: internals.queryContent,
  schema: internals.schema,
  searchQuery,
  selectedValues,
  setSelectedValues,
})

const isActive = computed(
  () =>
    !isNullish(
      internals.filterPresentation.getPanelDraftFilterState({ key: props.definition.key }),
    ),
)
const operatorItems = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }),
)
const chipLimit = computed(() => dataListUi.ui.value.filterPanel?.props?.chips ?? 8)
const staticCount = computed(() =>
  Array.isArray(props.definition.source?.options)
    ? props.definition.source.options.length
    : Number.POSITIVE_INFINITY,
)
const chips = computed(
  () =>
    chipLimit.value !== false &&
    state.filterUi.value.presentation !== 'tree' &&
    staticCount.value <= chipLimit.value,
)
const chipEntries = computed(() =>
  state.displayEntries.value
    .filter((entry) => !isNullish(entry.value))
    .map((entry) => ({
      color: entry.color,
      count: entry.count,
      icon: entry.icon,
      label: entry.label,
      selected: Boolean(entry.selected),
      value: entry.value as string | number | boolean,
    })),
)
const meta = computed(() =>
  selectedValues.value.length
    ? t('table.filters.preview.selected', { count: selectedValues.value.length })
    : '',
)

function resolveInitialOperator() {
  const operator = internals.filterPresentation.getPanelFilterOperator({
    key: props.definition.key,
  })
  return operator === 'is' || operator === 'isNot' ? operator : 'isAnyOf'
}

function handleOperatorChange(operator: TableFilterOperator) {
  pendingOperator.value = operator === 'is' || operator === 'isNot' ? operator : 'isAnyOf'

  if (state.filterUi.value.clearOnOperatorChange) {
    internals.filterPresentation.clearPanelFilter({ key: props.definition.key })
    return
  }

  if (!selectedValues.value.length) {
    return
  }

  internals.filterPresentation.setPanelOptionFilterValues({
    key: props.definition.key,
    operator: pendingOperator.value,
    values: selectedValues.value,
  })
}

function setSelectedValues(values: (string | number | boolean)[]) {
  internals.filterPresentation.setPanelOptionFilterValues({
    key: props.definition.key,
    operator: pendingOperator.value,
    values,
  })
}

function handleSelectEntry(options: { value: string | number | boolean }) {
  state.toggleValue(options.value)
}

function handleToggleTreeEntry(entryId: string) {
  const entry = state.visibleTreeEntries.value.find((item) => item.id === entryId)
  if (!entry) {
    return
  }
  state.toggleTreeEntry(entry)
}

function isPrimitiveValue<TValue>(value: TValue): value is TValue & (string | number | boolean) {
  return isString(value) || isNumber(value) || isBoolean(value)
}
</script>

<template>
  <FilterPanelFieldShell
    :label="internals.filters.getFilterLabelText({ label: definition.label })"
    :meta="meta"
    :active="isActive"
    :size="size"
    :ui="ui"
  >
    <template #actions>
      <FilterMatchModeButton
        v-if="operatorItems.length > 1"
        :label="operatorItems.find((item) => item.value === pendingOperator)?.label ?? 'is any of'"
        :items="operatorItems"
        :selected="pendingOperator"
        :size="size"
        variant="compact"
        @select="handleOperatorChange"
      />
    </template>

    <FilterPanelChips
      v-if="chips"
      :entries="chipEntries"
      :loading="state.optionSource.isLoading.value"
      :count-loading="state.optionSource.isCountLoading.value"
      :show-counts="state.filterUi.value.row.showCounts"
      :ui="ui"
      @toggle="state.toggleValue"
    />

    <UPopover
      v-else
      v-model:open="isOpen"
      mode="click"
      :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
      :ui="{
        content: resolveDataListPopoverContentClass('trigger', 'p-0 shadow-none'),
      }"
    >
      <FilterPanelInputTrigger
        :value="state.triggerSummary.value"
        :placeholder="t('table.filters.preview.empty')"
        :size="size"
      />

      <template #content>
        <FilterOptionPickerContent
          v-model:search-query="searchQuery"
          :flat-radio-value="state.flatRadioValue.value"
          :tree-radio-value="state.treeRadioValue.value"
          :state="state"
          :size="size"
          @update:flat-radio-value="state.flatRadioValue.value = $event"
          @update:tree-radio-value="state.treeRadioValue.value = $event"
          @select-entry="handleSelectEntry"
          @toggle-tree-entry="handleToggleTreeEntry"
          @toggle-expanded="state.toggleExpanded"
        />
      </template>
    </UPopover>
  </FilterPanelFieldShell>
</template>
