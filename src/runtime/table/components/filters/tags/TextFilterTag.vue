<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed, ref } from 'vue'

import { useTableInternals } from '../../../composables/use-table-internals'
import type { TableFilterOperator, TableTextFilterDefinition } from '../../../types'
import TableFilterTrigger from '../shared/FilterTriggerTag.vue'

const props = defineProps<{
  definition: TableTextFilterDefinition
}>()

const internals = useTableInternals()
const isOpen = ref<boolean>(false)
const pendingOperator = ref<TableFilterOperator>()
const localValue = ref<string>('')

const preview = computed(() =>
  internals.filters.getFilterPreview({
    key: props.definition.key,
  }),
)

const operator = computed(
  () =>
    pendingOperator.value ??
    internals.filters.getFilterOperator({
      key: props.definition.key,
    }),
)

const operatorLabel = computed(
  () =>
    internals.filters
      .getFilterOperatorOptions({
        key: props.definition.key,
      })
      .find((item) => item.value === operator.value)?.label ??
    'contains',
)

const operatorItems = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }),
)

function initLocalState() {
  const value = internals.filters.getFilterState({ key: props.definition.key })?.value
  localValue.value = value == null ? '' : String(value)
}

let dismissLocked = false

function handleActivate(op: TableFilterOperator) {
  pendingOperator.value = op
  dismissLocked = true
  setTimeout(() => {
    isOpen.value = true
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dismissLocked = false
      })
    })
  })
}

function handleOpenChange(open: boolean) {
  if (!open && dismissLocked) return
  isOpen.value = open
  if (open) {
    initLocalState()
  } else {
    pendingOperator.value = undefined
  }
}

function applyFilter() {
  const op = pendingOperator.value
  pendingOperator.value = undefined

  internals.filters.setScalarFilterValue({
    key: props.definition.key,
    value: localValue.value.trim() || undefined,
    operator: op,
  })
  isOpen.value = false
}

function clearFilter() {
  internals.filters.clearFilter({ key: props.definition.key })
  isOpen.value = false
}
</script>

<template>
  <UPopover
    :open="isOpen"
    :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
    :ui="{
      content: 'w-80 rounded-xl p-0 shadow-xl',
    }"
    @update:open="handleOpenChange"
  >
    <TableFilterTrigger
      :label="internals.filters.getFilterLabelText({ label: definition.label })"
      leading-icon="i-lucide-circle-plus"
      :operator-label="operatorLabel"
      :operator-items="operatorItems"
      :preview-summary="preview.summary"
      :active="preview.active"
      @select-operator="
        internals.filters.setFilterOperator({ key: definition.key, operator: $event })
      "
      @activate="handleActivate"
      @clear="clearFilter"
    />

    <template #content>
      <div class="overflow-hidden rounded-xl border border-default bg-default">
        <UInput
          v-model="localValue"
          size="sm"
          variant="ghost"
          color="neutral"
          icon="i-lucide-search"
          :placeholder="internals.filters.getFilterLabelText({ label: definition.label })"
          class="w-full border-b border-default px-2.5 py-2"
          :ui="{
            base: 'h-8 ps-8',
            leading: 'start-2',
            leadingIcon: 'size-4 text-muted',
          }"
          @keydown.enter.prevent="applyFilter"
        />

        <div class="flex items-center justify-between border-t border-default p-2">
          <UButton color="neutral" variant="ghost" size="sm" label="Clear" @click="clearFilter" />
          <UButton color="neutral" variant="subtle" size="sm" label="Apply" @click="applyFilter" />
        </div>
      </div>
    </template>
  </UPopover>
</template>
