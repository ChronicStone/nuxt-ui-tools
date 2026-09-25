<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import { computed, ref } from 'vue'

import { isNullish } from '../../../../shared/utils/predicate'
import { useDataListUi } from '../../../composables/use-data-list-ui'
import { useDeferredCommit } from '../../../composables/use-deferred-commit'
import { useFilterTagSession } from '../../../composables/use-filter-tag-session'
import { useTableInternals } from '../../../composables/use-table-internals'
import type {
  TableFilterOperator,
  TableTextFilterDefinition,
  TableTextFilterOperator,
} from '../../../types'
import {
  mergeDataListUiClass,
  resolveFilterEditorSizeClasses,
  resolveFilterTriggerIcon,
  resolveTextFilterUi,
} from '../../../utils'
import FilterEditorHeader from '../shared/filter-editor-header.vue'
import FilterMatchModePanel from '../shared/filter-match-mode-panel.vue'
import FilterPopoverShell from '../shared/filter-popover-shell.vue'
import FilterStageTransition from '../shared/filter-stage-transition.vue'
import TableFilterTrigger from '../shared/filter-trigger-tag.vue'

const props = withDefaults(
  defineProps<{
    definition: TableTextFilterDefinition
    dynamic?: boolean
    session?: boolean
    embedded?: boolean
    header?: boolean
    initialOperator?: TableFilterOperator
  }>(),
  { header: true },
)
const emit = defineEmits<{
  back: []
  dismiss: []
  sessionClosed: []
}>()

const internals = useTableInternals()
const dataListUi = useDataListUi()
const dataListFilterUi = computed(() => dataListUi.ui.value.filterTags?.ui)
const size = computed(() => dataListUi.ui.value.filterTags?.size ?? dataListUi.controlSize.value)
const sizeClasses = computed(() => resolveFilterEditorSizeClasses(size.value))
const showHeader = computed(
  () => props.header && dataListUi.ui.value.filterTags?.props?.editorHeader !== false,
)
const pendingOperator = ref<TableFilterOperator | undefined>(props.initialOperator)
const localValue = ref<string>('')
const stage = ref<'editor' | 'match-mode'>('editor')
const stageDirection = ref<'forward' | 'backward'>('forward')
const stageTransitioning = ref<boolean>(false)

const preview = computed(() =>
  internals.filters.getFilterPreview({
    key: props.definition.key,
  }),
)

const operator = computed<TableTextFilterOperator>(() => {
  const value =
    pendingOperator.value ??
    internals.filters.getFilterOperator({
      key: props.definition.key,
    })

  return value === 'is' || value === 'isNot' ? value : 'contains'
})

const operatorLabel = computed(
  () =>
    internals.filters
      .getFilterOperatorOptions({
        key: props.definition.key,
      })
      .find((item) => item.value === operator.value)?.label ?? 'contains',
)

const operatorItems = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }),
)
const filterUi = computed(() => resolveTextFilterUi(props.definition, operator.value))
const autoCommit = computed(() => filterUi.value.commitMode === 'auto')
const deferred = useDeferredCommit({ commit: commitValue, flushOnDispose: props.embedded })

function initLocalState() {
  const value = internals.filters.getFilterState({
    key: props.definition.key,
  })?.value
  localValue.value = isNullish(value) ? '' : String(value)
}

const session = useFilterTagSession({
  dynamic: props.dynamic,
  embedded: props.embedded,
  hasCommittedState: () =>
    !isNullish(internals.filters.getActiveFilterState({ key: props.definition.key })),
  onClose: () => {
    if (autoCommit.value) {
      deferred.flush()
    } else {
      deferred.cancel()
    }
    pendingOperator.value = undefined
  },
  onDismiss: () => emit('dismiss'),
  onOpen: initLocalState,
  onSessionClosed: () => emit('sessionClosed'),
  session: props.session,
})

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

function commitValue() {
  internals.filters.setScalarFilterValue({
    key: props.definition.key,
    operator: pendingOperator.value,
    value: localValue.value.trim() || undefined,
  })
}

function applyFilter() {
  deferred.cancel()
  commitValue()
  pendingOperator.value = undefined
  session.close()
}

function clearFilter() {
  deferred.cancel()
  internals.filters.clearFilter({ key: props.definition.key })
  localValue.value = ''
  session.close()
}

function handleOperatorChange(op: TableFilterOperator) {
  deferred.cancel()
  localValue.value = ''
  pendingOperator.value = op
  stageDirection.value = 'forward'
  stageTransitioning.value = true
  stage.value = 'editor'
}

function handleValueUpdate(value: string | number | undefined) {
  localValue.value = isNullish(value) ? '' : String(value)

  if (autoCommit.value) {
    deferred.schedule()
  }
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
        :preview-summary="preview.summary"
        :dynamic="dynamic"
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
        >
          <FilterEditorHeader
            v-if="showHeader"
            :label="internals.filters.getFilterLabelText({ label: definition.label })"
            :active="preview.active"
            :embedded="embedded"
            :ui="dataListFilterUi"
            @back="emit('back')"
            @clear="clearFilter"
          />
          <div
            :class="
              mergeDataListUiClass(
                `nut-dl-editor__input ${sizeClasses.searchHeader} ${autoCommit ? '' : 'border-b border-default'}`,
                undefined,
                dataListFilterUi?.inputs,
              )
            "
          >
            <UInput
              :model-value="localValue"
              :type="filterUi.inputType"
              :icon="filterUi.leadingIcon"
              :placeholder="filterUi.placeholder"
              :autocomplete="filterUi.autocomplete"
              :autofocus="filterUi.input.autofocus"
              :highlight="filterUi.input.highlight"
              :fixed="filterUi.input.fixed"
              :size="size"
              variant="none"
              class="w-full min-w-0 max-w-full"
              :ui="{
                root: dataListFilterUi?.search,
                base: mergeDataListUiClass('h-8', undefined, dataListFilterUi?.searchInput),
              }"
              @update:model-value="handleValueUpdate"
              @keydown.enter.prevent="applyFilter"
            />
          </div>

          <div
            v-if="!autoCommit"
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
              :label="filterUi.actions.clear"
              :ui="{ base: dataListFilterUi?.clear }"
              @click="clearFilter"
            />
            <UButton
              color="neutral"
              variant="subtle"
              :size="size"
              :label="filterUi.actions.apply"
              :ui="{ base: dataListFilterUi?.apply }"
              @click="applyFilter"
            />
          </div>
        </div>
      </FilterStageTransition>
    </template>
  </FilterPopoverShell>
</template>
