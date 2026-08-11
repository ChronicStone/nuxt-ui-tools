<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed, ref, toRef } from 'vue'

import { useRangeSelect } from '../../../../shared'
import { useFilterTagSession } from '../../../composables/use-filter-tag-session'
import { useOptionFilterEditorState } from '../../../composables/use-option-filter-editor-state'
import { useTableInternals } from '../../../composables/use-table-internals'
import type {
  TableFilterOperator,
  TableOptionFilterDefinition,
  TableOptionFilterOperator,
} from '../../../types'
import { resolveFilterTriggerIcon } from '../../../utils'
import FilterOptionPickerContent from '../shared/FilterOptionPickerContent.vue'
import TableFilterTrigger from '../shared/FilterTriggerTag.vue'

const props = defineProps<{
  definition: TableOptionFilterDefinition
  dynamic?: boolean
  session?: boolean
  activationToken?: number
}>()
const emit = defineEmits<{
  dismiss: []
  sessionClosed: []
}>()

const internals = useTableInternals()
const searchQuery = ref<string>('')
const isSessionOpen = ref<boolean>(false)
const isContentReady = ref<boolean>(false)
const pendingOperator = ref<TableFilterOperator>()
const localSelectedValues = ref<(string | number | boolean)[]>([])
const pinnedValues = ref<Set<string>>(new Set())

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
  activationToken: toRef(props, 'activationToken'),
  session: props.session,
  dynamic: props.dynamic,
  hasCommittedState: () => internals.filters.getFilterState({ key: props.definition.key }) != null,
  onActivated: () => handleActivate(operator.value),
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
  const committedRule = internals.filters.getFilterState({ key: props.definition.key })
  const values: (string | number | boolean)[] = Array.isArray(committedRule?.value)
    ? committedRule.value.filter(
        (value: unknown): value is string | number | boolean =>
          typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean',
      )
    : committedRule?.value != null &&
        (typeof committedRule.value === 'string' ||
          typeof committedRule.value === 'number' ||
          typeof committedRule.value === 'boolean')
      ? [committedRule.value]
      : []

  localSelectedValues.value = values
  pinnedValues.value = new Set(values.map(String))
  state.resetExpandedIds()
}

function handleActivate(op: TableFilterOperator) {
  pendingOperator.value = op
  session.openWithLock()
}

function handleOperatorChange(op: TableFilterOperator) {
  if (state.filterUi.value.clearOnOperatorChange)
    internals.filters.clearFilter({ key: props.definition.key })

  localSelectedValues.value = []
  pinnedValues.value = new Set()
  state.resetExpandedIds()
  searchQuery.value = ''
  pinnedRangeSelect.reset()
  restRangeSelect.reset()

  if (state.filterUi.value.reopenOnOperatorChange) handleActivate(op)
  else pendingOperator.value = op
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
  <UPopover
    :open="session.isOpen.value"
    :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
    :ui="{ content: 'w-fit overflow-hidden p-0 shadow-none' }"
    @update:open="session.handleOpenChange"
  >
    <TableFilterTrigger
      :label="internals.filters.getFilterLabelText({ label: definition.label })"
      :leading-icon="resolveFilterTriggerIcon(definition)"
      :operator-label="operatorLabel"
      :operator-items="operatorItems"
      :preview-tags="preview.tags"
      :preview-summary="preview.summary"
      :active="preview.active"
      @select-operator="handleOperatorChange"
      @activate="handleActivate"
      @clear="clearFilter"
    />

    <template #content>
      <div class="w-fit max-w-[calc(100vw-1rem)] bg-default" @vue:mounted="handleContentMounted">
        <FilterOptionPickerContent
          v-model:search-query="searchQuery"
          :flat-radio-value="state.flatRadioValue.value"
          :tree-radio-value="state.treeRadioValue.value"
          :state="state"
          :sections="listSections"
          @update:flat-radio-value="state.flatRadioValue.value = $event"
          @update:tree-radio-value="state.treeRadioValue.value = $event"
          @select-entry="handleSelectEntry"
          @toggle-tree-entry="handleToggleTreeEntry"
          @toggle-expanded="state.toggleExpanded"
        />

        <div
          v-if="state.filterUi.value.commitMode === 'manual'"
          class="flex items-center justify-between border-t border-default p-2"
        >
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            :label="state.filterUi.value.actions.clear"
            @click="clearFilter"
          />
          <UButton
            color="neutral"
            variant="subtle"
            size="sm"
            :label="state.filterUi.value.actions.apply"
            @click="applyFilter"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
