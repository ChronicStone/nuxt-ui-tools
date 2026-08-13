<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed, ref, toRef } from 'vue'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import { useFilterTagSession } from '../../../composables/use-filter-tag-session'
import { useTableInternals } from '../../../composables/use-table-internals'
import type {
  TableFilterOperator,
  TableTextFilterDefinition,
  TableTextFilterOperator,
} from '../../../types'
import { mergeDataListUiClass, resolveFilterTriggerIcon, resolveTextFilterUi } from '../../../utils'
import TableFilterTrigger from '../shared/FilterTriggerTag.vue'

const props = defineProps<{
  definition: TableTextFilterDefinition
  dynamic?: boolean
  session?: boolean
  activationToken?: number
}>()
const emit = defineEmits<{
  dismiss: []
  sessionClosed: []
}>()

const internals = useTableInternals()
const dataListUi = useDataListUi()
const dataListFilterUi = computed(() => dataListUi.ui.value.filterTags?.ui)
const size = computed(() => dataListUi.ui.value.filterTags?.size ?? dataListUi.controlSize.value)
const pendingOperator = ref<TableFilterOperator>()
const localValue = ref<string>('')

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
  const value = internals.filters.getFilterState({ key: props.definition.key })?.value
  localValue.value = value == null ? '' : String(value)
}

const session = useFilterTagSession({
  activationToken: toRef(props, 'activationToken'),
  session: props.session,
  dynamic: props.dynamic,
  hasCommittedState: () => internals.filters.getFilterState({ key: props.definition.key }) != null,
  onActivated: () => handleActivate(operator.value),
  onOpen: initLocalState,
  onClose: () => {
    pendingOperator.value = undefined
  },
  onSessionClosed: () => emit('sessionClosed'),
  onDismiss: () => emit('dismiss'),
})

function handleActivate(op: TableFilterOperator) {
  pendingOperator.value = op
  session.openWithLock()
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
  if (filterUi.value.clearOnOperatorChange) {
    internals.filters.clearFilter({ key: props.definition.key })
  }
  localValue.value = ''
  if (filterUi.value.reopenOnOperatorChange) handleActivate(op)
  else pendingOperator.value = op
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
  <UPopover
    :open="session.isOpen.value"
    :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
    :ui="{
      content: mergeDataListUiClass(
        'w-fit overflow-hidden p-0',
        undefined,
        dataListFilterUi?.popoverContent,
      ),
    }"
    @update:open="session.handleOpenChange"
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
        :operator-label="operatorLabel"
        :operator-items="operatorItems"
        :preview-summary="preview.summary"
        :active="preview.active"
        @select-operator="handleOperatorChange"
        @activate="handleActivate"
        @clear="clearFilter"
      />
    </slot>

    <template #content>
      <div
        :class="
          mergeDataListUiClass(
            'w-fit max-w-[calc(100vw-1rem)] bg-default',
            undefined,
            dataListFilterUi?.editor,
          )
        "
      >
        <div
          :class="
            mergeDataListUiClass('border-b border-default p-2', undefined, dataListFilterUi?.inputs)
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
            class="w-[min(13rem,calc(100vw-3rem))] max-w-full"
            :ui="{ root: dataListFilterUi?.search, base: dataListFilterUi?.searchInput }"
            @update:model-value="handleValueUpdate"
            @keydown.enter.prevent="applyFilter"
          />
        </div>

        <div
          v-if="filterUi.commitMode === 'manual'"
          :class="
            mergeDataListUiClass(
              'flex items-center justify-between border-t border-default p-2',
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
    </template>
  </UPopover>
</template>
