<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed, ref } from 'vue'

import { useRangeSelect } from '../../../../shared'
import { isBoolean, isNumber, isString } from '../../../../shared/utils/predicate'
import { useDataListUi } from '../../../composables/use-data-list-ui'
import { useFilterTagSession } from '../../../composables/use-filter-tag-session'
import { useOptionFilterEditorState } from '../../../composables/use-option-filter-editor-state'
import { useTableInternals } from '../../../composables/use-table-internals'
import type {
  TableFilterOperator,
  TableOptionFilterDefinition,
  TableOptionFilterOperator,
} from '../../../types'
import {
  mergeDataListUiClass,
  resolveFilterEditorSizeClasses,
  resolveFilterTriggerIcon,
} from '../../../utils'
import FilterMatchModePanel from '../shared/FilterMatchModePanel.vue'
import FilterOptionPickerContent from '../shared/FilterOptionPickerContent.vue'
import FilterPopoverShell from '../shared/FilterPopoverShell.vue'
import FilterStageTransition from '../shared/FilterStageTransition.vue'
import TableFilterTrigger from '../shared/FilterTriggerTag.vue'

const props = defineProps<{
  definition: TableOptionFilterDefinition
  dynamic?: boolean
  session?: boolean
  embedded?: boolean
  initialOperator?: TableFilterOperator
}>()
const emit = defineEmits<{
  dismiss: []
  sessionClosed: []
}>()

const internals = useTableInternals()
const dataListUi = useDataListUi()
const dataListFilterUi = computed(() => dataListUi.ui.value.filterTags?.ui)
const size = computed(() => dataListUi.ui.value.filterTags?.size ?? dataListUi.controlSize.value)
const sizeClasses = computed(() => resolveFilterEditorSizeClasses(size.value))
const searchQuery = ref<string>('')
const isSessionOpen = ref<boolean>(false)
const isContentReady = ref<boolean>(false)
const pendingOperator = ref<TableFilterOperator | undefined>(props.initialOperator)
const localSelectedValues = ref<(string | number | boolean)[]>([])
const pinnedValues = ref<Set<string>>(new Set())
const stage = ref<'editor' | 'match-mode'>('editor')
const stageDirection = ref<'forward' | 'backward'>('forward')
const stageTransitioning = ref<boolean>(false)

const operator = computed<TableOptionFilterOperator>(() => {
  const next =
    pendingOperator.value ??
    internals.filters.getFilterOperator({
      key: props.definition.key,
    })

  return next === 'isAnyOf' || next === 'isNot' ? next : 'is'
})

const state = useOptionFilterEditorState({
  definition: props.definition,
  operator,
  selectedValues: localSelectedValues,
  searchQuery,
  active: computed(() => isSessionOpen.value),
  ready: isContentReady,
  filters: internals.filters,
  queryContent: internals.queryContent,
  schema: internals.schema,
  setSelectedValues,
})

const session = useFilterTagSession({
  isOpen: isSessionOpen,
  session: props.session,
  dynamic: props.dynamic,
  embedded: props.embedded,
  hasCommittedState: () =>
    internals.filters.getActiveFilterState({ key: props.definition.key }) != null,
  onOpen: () => {
    isContentReady.value = false
    initLocalState()
  },
  onClose: () => {
    isContentReady.value = false
    pendingOperator.value = undefined
    searchQuery.value = ''
    state.resetExpandedIds()
    pinnedRangeSelect.reset()
    restRangeSelect.reset()
  },
  onSessionClosed: () => emit('sessionClosed'),
  onDismiss: () => emit('dismiss'),
})

const preview = computed(() =>
  internals.filters.getFilterPreview({
    key: props.definition.key,
    entries: state.optionSource.sourceEntries.value,
  }),
)

const operatorLabel = computed(
  () =>
    internals.filters
      .getFilterOperatorOptions({
        key: props.definition.key,
      })
      .find((item) => item.value === operator.value)?.label ?? 'is',
)

const operatorItems = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }),
)

const pinnedEntries = computed(() =>
  state.displayEntries.value.filter((entry) => pinnedValues.value.has(String(entry.value))),
)

const restEntries = computed(() =>
  state.displayEntries.value.filter((entry) => !pinnedValues.value.has(String(entry.value))),
)

const listSections = computed(() => {
  const sections = []

  if (pinnedEntries.value.length) {
    sections.push({
      key: 'pinned',
      entries: pinnedEntries.value,
    })
  }

  sections.push({
    key: 'rest',
    entries: restEntries.value,
    dividerBefore: pinnedEntries.value.length > 0,
  })

  return sections
})

const pinnedRangeSelect = useRangeSelect({
  entries: pinnedEntries,
  onToggle: state.toggleValue,
})

const restRangeSelect = useRangeSelect({
  entries: restEntries,
  onToggle: state.toggleValue,
})

function initLocalState() {
  const committedRule = internals.filters.getFilterState({
    key: props.definition.key,
  })
  const values: (string | number | boolean)[] = Array.isArray(committedRule?.value)
    ? committedRule.value.filter(
        <TValue>(value: TValue): value is TValue & (string | number | boolean) =>
          isString(value) || isNumber(value) || isBoolean(value),
      )
    : committedRule?.value != null &&
        (isString(committedRule.value) ||
          isNumber(committedRule.value) ||
          isBoolean(committedRule.value))
      ? [committedRule.value]
      : []

  localSelectedValues.value = values
  pinnedValues.value = new Set(values.map(String))
  state.resetExpandedIds()
}

function handleActivate(op: TableFilterOperator) {
  pendingOperator.value = op
  stage.value = 'editor'
  stageDirection.value = 'backward'
  session.open()
}

function handleRequestMatchMode() {
  stageDirection.value = 'forward'
  stageTransitioning.value = true
  stage.value = 'match-mode'
  session.open()
}

function handleOperatorChange(op: TableFilterOperator) {
  localSelectedValues.value = []
  pinnedValues.value = new Set()
  state.resetExpandedIds()
  searchQuery.value = ''
  pinnedRangeSelect.reset()
  restRangeSelect.reset()

  pendingOperator.value = op
  stageDirection.value = 'forward'
  stageTransitioning.value = true
  stage.value = 'editor'
}

function setSelectedValues(values: Array<string | number | boolean>) {
  localSelectedValues.value = values
  pinnedValues.value = new Set(values.map(String))
  if (state.filterUi.value.commitMode === 'auto') commitSelection()
}

function commitSelection() {
  if (state.filterUi.value.commitMode !== 'auto') return

  internals.filters.setOptionFilterValues({
    key: props.definition.key,
    values: localSelectedValues.value,
    operator: pendingOperator.value,
  })

  if (state.filterUi.value.closeOnSelect) session.close()
}

function applyFilter() {
  internals.filters.setOptionFilterValues({
    key: props.definition.key,
    values: localSelectedValues.value,
    operator: pendingOperator.value,
  })
  pendingOperator.value = undefined
  session.close()
}

function clearFilter() {
  internals.filters.clearFilter({ key: props.definition.key })
  localSelectedValues.value = []
  session.close()
}

function handleSelectEntry(options: {
  event: MouseEvent
  value: string | number | boolean
  index: number
  sectionKey: string
}) {
  if (options.sectionKey === 'pinned') {
    const entry = pinnedEntries.value.find((item) => String(item.value) === String(options.value))
    if (!entry) return
    pinnedRangeSelect.handleClick(options.event, entry, options.index)
    return
  }

  const entry = restEntries.value.find((item) => String(item.value) === String(options.value))
  if (!entry) return
  restRangeSelect.handleClick(options.event, entry, options.index)
}

function handleToggleTreeEntry(entryId: string) {
  const entry = state.visibleTreeEntries.value.find((item) => item.id === entryId)
  if (!entry) return
  state.toggleTreeEntry(entry)
}

function handleContentMounted() {
  isContentReady.value = true
}
</script>

<template>
  <FilterPopoverShell
    :open="session.isOpen.value"
    :embedded="embedded"
    :transitioning="stageTransitioning"
    :content-class="
      mergeDataListUiClass(
        `${sizeClasses.editor} overflow-hidden p-0`,
        undefined,
        dataListFilterUi?.popoverContent,
      )
    "
    @update-open="session.handleOpenChange"
  >
    <slot
      name="trigger"
      :preview="preview"
      :active="preview.active"
      :open="session.isOpen.value"
      :trigger-props="{
        type: 'button',
        'aria-haspopup': 'dialog',
        'aria-expanded': session.isOpen.value,
      }"
    >
      <TableFilterTrigger
        :label="internals.filters.getFilterLabelText({ label: definition.label })"
        :leading-icon="resolveFilterTriggerIcon(definition)"
        :operator="operator"
        :operator-label="operatorLabel"
        :operator-items="operatorItems"
        :preview-tags="preview.tags"
        :preview-summary="preview.summary"
        :active="preview.active"
        @activate="handleActivate"
        @request-match-mode="handleRequestMatchMode"
        @clear="clearFilter"
      />
    </slot>

    <template #content>
      <FilterStageTransition
        :stage-key="stage"
        :direction="stageDirection"
        @settled="stageTransitioning = false"
      >
        <FilterMatchModePanel
          v-if="stage === 'match-mode'"
          :items="operatorItems"
          :selected="operator"
          :size="size"
          :ui="dataListFilterUi"
          @select="handleOperatorChange"
        />
        <div
          v-else
          :class="
            mergeDataListUiClass(
              `${sizeClasses.editor} w-full min-w-0 max-w-full bg-default`,
              undefined,
              dataListFilterUi?.editor,
            )
          "
          @vue:mounted="handleContentMounted"
        >
          <FilterOptionPickerContent
            v-model:search-query="searchQuery"
            :flat-radio-value="state.flatRadioValue.value"
            :tree-radio-value="state.treeRadioValue.value"
            :state="state"
            :sections="listSections"
            :size="size"
            :ui="dataListFilterUi"
            @update:flat-radio-value="state.flatRadioValue.value = $event"
            @update:tree-radio-value="state.treeRadioValue.value = $event"
            @select-entry="handleSelectEntry"
            @toggle-tree-entry="handleToggleTreeEntry"
            @toggle-expanded="state.toggleExpanded"
          />

          <div
            v-if="state.filterUi.value.commitMode === 'manual'"
            :class="
              mergeDataListUiClass(
                `flex items-center justify-between border-t border-default ${sizeClasses.footer}`,
                undefined,
                dataListFilterUi?.footer,
              )
            "
          >
            <UButton
              color="neutral"
              variant="ghost"
              :size="size"
              :label="state.filterUi.value.actions.clear"
              :ui="{ base: dataListFilterUi?.clear }"
              @click="clearFilter"
            />
            <UButton
              color="neutral"
              variant="subtle"
              :size="size"
              :label="state.filterUi.value.actions.apply"
              :ui="{ base: dataListFilterUi?.apply }"
              @click="applyFilter"
            />
          </div>
        </div>
      </FilterStageTransition>
    </template>
  </FilterPopoverShell>
</template>
