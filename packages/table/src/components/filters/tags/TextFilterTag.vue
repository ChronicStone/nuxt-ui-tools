<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import UButton from '@nuxt/ui/components/Button.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UInputNumber from '@nuxt/ui/components/InputNumber.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'

import TableFilterTrigger from '../shared/FilterTriggerTag.vue'
import { useTableInternals } from '../../../composables/use-table-internals'
import type { TableNumberFilterDefinition, TableTextFilterDefinition } from '../../../types'

const props = defineProps<{
  definition: TableTextFilterDefinition | TableNumberFilterDefinition
}>()

const internals = useTableInternals()
const isOpen = ref<boolean>(false)
const pendingOperator = ref<string>()
const localValue = ref<string>('')
const rangeValue = ref<{
  from: string
  to: string
}>({
  from: '',
  to: '',
})

const preview = computed(() =>
  internals.filters.getFilterPreview({
    key: props.definition.key,
  }),
)

const operator = computed(() =>
  pendingOperator.value ??
  internals.filters.getFilterOperator({
    key: props.definition.key,
  }),
)

const operatorLabel = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }).find((item: { label: string; value: string }) => item.value === operator.value)?.label ?? 'contains',
)

const operatorItems = computed(() =>
  internals.filters.getFilterOperatorOptions({
    key: props.definition.key,
  }),
)

const numericValue = computed({
  get() {
    if (props.definition.kind !== 'number') {
      return undefined
    }

    return localValue.value === '' ? undefined : Number(localValue.value)
  },
  set(value?: number) {
    localValue.value = value == null || Number.isNaN(value) ? '' : String(value)
  },
})

watch(
  [
    () => internals.filters.getFilterState({ key: props.definition.key })?.value,
    () => operator.value,
  ],
  ([value]) => {
    if (props.definition.kind === 'number' && operator.value === 'between') {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        rangeValue.value = {
          from: value.from == null ? '' : String(value.from),
          to: value.to == null ? '' : String(value.to),
        }
      }
      else {
        rangeValue.value = {
          from: '',
          to: '',
        }
      }

      return
    }

    localValue.value = value == null ? '' : String(value)
  },
  {
    immediate: true,
  },
)

let dismissLocked = false

function handleActivate(op: string) {
  pendingOperator.value = op
  dismissLocked = true
  setTimeout(() => {
    isOpen.value = true
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { dismissLocked = false })
    })
  })
}

function handleOpenChange(open: boolean) {
  if (!open && dismissLocked) return
  isOpen.value = open
  if (!open) {
    pendingOperator.value = undefined
  }
}

function applyValue() {
  const op = pendingOperator.value
  pendingOperator.value = undefined

  if (props.definition.kind === 'number' && operator.value === 'between') {
    internals.filters.setScalarFilterValue({
      key: props.definition.key,
      value: ({
        from: rangeValue.value.from === '' ? undefined : Number(rangeValue.value.from),
        to: rangeValue.value.to === '' ? undefined : Number(rangeValue.value.to),
      }) as { from?: number; to?: number },
      operator: op,
    })
    return
  }

  const normalizedValue = props.definition.kind === 'number'
    ? Number(localValue.value)
    : localValue.value.trim()

  internals.filters.setScalarFilterValue({
    key: props.definition.key,
    value: localValue.value === ''
      ? undefined
      : normalizedValue,
    operator: op,
  })
}
</script>

<template>
  <UPopover
    :open="isOpen"
    :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
    :ui="{
      content: 'w-80 rounded-xl p-0 shadow-xl'
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
      @select-operator="internals.filters.setFilterOperator({ key: definition.key, operator: $event })"
      @activate="handleActivate"
      @clear="internals.filters.clearFilter({ key: definition.key }); isOpen = false"
    />

    <template #content>
      <div class="overflow-hidden rounded-xl border border-default bg-default">
        <div
          v-if="definition.kind === 'number' && operator === 'between'"
          class="grid grid-cols-2 gap-2 border-b border-default p-2.5"
        >
          <UInputNumber
            :model-value="rangeValue.from === '' ? undefined : Number(rangeValue.from)"
            size="sm"
            color="neutral"
            variant="ghost"
            placeholder="Min"
            :increment="{ variant: 'ghost' }"
            :decrement="{ variant: 'ghost' }"
            class="w-full rounded-lg border border-default px-2"
            :ui="{
              base: 'h-8 px-2',
              increment: 'size-7 rounded-md',
              decrement: 'size-7 rounded-md'
            }"
            @update:model-value="rangeValue.from = $event == null ? '' : String($event)"
            @keydown.enter.prevent="applyValue"
          />

          <UInputNumber
            :model-value="rangeValue.to === '' ? undefined : Number(rangeValue.to)"
            size="sm"
            color="neutral"
            variant="ghost"
            placeholder="Max"
            :increment="{ variant: 'ghost' }"
            :decrement="{ variant: 'ghost' }"
            class="w-full rounded-lg border border-default px-2"
            :ui="{
              base: 'h-8 px-2',
              increment: 'size-7 rounded-md',
              decrement: 'size-7 rounded-md'
            }"
            @update:model-value="rangeValue.to = $event == null ? '' : String($event)"
            @keydown.enter.prevent="applyValue"
          />
        </div>

        <UInputNumber
          v-else-if="definition.kind === 'number'"
          v-model="numericValue"
          size="sm"
          color="neutral"
          variant="ghost"
          :placeholder="internals.filters.getFilterLabelText({ label: definition.label })"
          class="w-full border-b border-default px-2.5 py-2"
          :increment="{ variant: 'ghost' }"
          :decrement="{ variant: 'ghost' }"
          :ui="{
            base: 'h-8 px-2',
            increment: 'size-7 rounded-md',
            decrement: 'size-7 rounded-md'
          }"
          @keydown.enter.prevent="applyValue"
        />

        <UInput
          v-else
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
            leadingIcon: 'size-4 text-muted'
          }"
          @keydown.enter.prevent="applyValue"
        />

        <div class="grid gap-3 p-3">
          <div class="flex items-center justify-between gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              size="lg"
              label="Clear"
              @click="internals.filters.clearFilter({ key: definition.key })"
            />
            <UButton
              color="neutral"
              variant="subtle"
              size="lg"
              label="Apply"
              @click="applyValue"
            />
          </div>
        </div>

        <div class="border-t border-default p-2">
          <UButton
            color="neutral"
            variant="ghost"
            size="lg"
            block
            label="Clear filters"
            @click="internals.filters.clearFilter({ key: definition.key })"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
