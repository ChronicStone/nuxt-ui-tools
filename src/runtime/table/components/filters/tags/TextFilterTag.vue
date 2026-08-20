<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import { computed, ref } from 'vue'

import { useDataListUi } from '../../../composables/use-data-list-ui'
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
import FilterMatchModePanel from '../shared/FilterMatchModePanel.vue'
import FilterPopoverShell from '../shared/FilterPopoverShell.vue'
import FilterStageTransition from '../shared/FilterStageTransition.vue'
import TableFilterTrigger from '../shared/FilterTriggerTag.vue'

const props = defineProps<{
  definition: TableTextFilterDefinition
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

function initLocalState() {
  const value = internals.filters.getFilterState({
    key: props.definition.key,
  })?.value
  localValue.value = value == null ? '' : String(value)
}

const session = useFilterTagSession({
  session: props.session,
  dynamic: props.dynamic,
  embedded: props.embedded,
  hasCommittedState: () =>
    internals.filters.getActiveFilterState({ key: props.definition.key }) != null,
  onOpen: initLocalState,
  onClose: () => {
    pendingOperator.value = undefined
  },
  onSessionClosed: () => emit('sessionClosed'),
  onDismiss: () => emit('dismiss'),
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

function applyFilter() {
  const op = pendingOperator.value
  pendingOperator.value = undefined

  internals.filters.setScalarFilterValue({
    key: props.definition.key,
    value: localValue.value.trim() || undefined,
    operator: op,
  })
  session.close()
}

function clearFilter() {
  internals.filters.clearFilter({ key: props.definition.key })
  session.close()
}

function handleOperatorChange(op: TableFilterOperator) {
  localValue.value = ''
  pendingOperator.value = op
  stageDirection.value = 'forward'
  stageTransitioning.value = true
  stage.value = 'editor'
}

function handleValueUpdate(value: string | number | undefined) {
  localValue.value = value == null ? '' : String(value)

  if (filterUi.value.commitMode === 'auto') {
    internals.filters.setScalarFilterValue({
      key: props.definition.key,
      value: localValue.value.trim() || undefined,
      operator: pendingOperator.value,
    })
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
          <div
            :class="
              mergeDataListUiClass(
                `border-b border-default ${sizeClasses.searchHeader}`,
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
              class="w-full min-w-0 max-w-full"
              :ui="{
                root: dataListFilterUi?.search,
                base: dataListFilterUi?.searchInput,
              }"
              @update:model-value="handleValueUpdate"
              @keydown.enter.prevent="applyFilter"
            />
          </div>

          <div
            v-if="filterUi.commitMode === 'manual'"
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
