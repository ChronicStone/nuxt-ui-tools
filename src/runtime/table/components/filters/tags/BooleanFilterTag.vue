<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, ref } from 'vue'

import { useTableFilterOptions } from '../../../composables/use-table-filter-options'
import { useTableInternals } from '../../../composables/use-table-internals'
import type { TableBooleanFilterDefinition, TableBooleanFilterOperator } from '../../../types'
import { resolveBooleanFilterUi } from '../../../utils'
import TableFilterTrigger from '../shared/FilterTriggerTag.vue'

const props = defineProps<{
  definition: TableBooleanFilterDefinition
}>()

const internals = useTableInternals()
const searchQuery = ref<string>('')
const isOpen = ref<boolean>(false)
const localValue = ref<boolean | null>(null)

const optionSource = useTableFilterOptions({
  definition: props.definition,
  searchQuery,
  filters: internals.filters,
  queryContent: internals.queryContent,
  schema: internals.schema,
})

const preview = computed(() =>
  internals.filters.getFilterPreview({
    key: props.definition.key,
    entries: optionSource.sourceEntries.value,
  }),
)

const operator = computed<TableBooleanFilterOperator>(() => {
  const value = internals.filters.getFilterOperator({
    key: props.definition.key,
  })

  return value === 'isNot' ? 'isNot' : 'is'
})

const filterUi = computed(() => resolveBooleanFilterUi(props.definition, operator.value))

const triggerIcon = computed(() =>
  preview.value.active ? 'i-lucide-circle-x' : 'i-lucide-circle-plus',
)

const entries = computed(() =>
  optionSource.filteredEntries.value
    .filter(entry => typeof entry.value === 'boolean')
    .map((entry) => ({
      ...entry,
      label: entry.value === true ? filterUi.value.labels.true : filterUi.value.labels.false,
      icon: entry.value === true ? filterUi.value.icons.true : filterUi.value.icons.false,
      selected: localValue.value === entry.value,
    })),
)

const radioItems = computed(() =>
  entries.value.map(entry => ({
    label: entry.label,
    value: String(entry.value),
    count: entry.count,
    icon: entry.icon,
  })),
)

const radioValue = computed({
  get: () => localValue.value == null ? undefined : String(localValue.value),
  set: (value: string | undefined) => {
    if (value === 'true') localValue.value = true
    else if (value === 'false') localValue.value = false
    else return

    if (filterUi.value.commitMode === 'auto') applyFilter()
  },
})

function initLocalState() {
  const committedRule = internals.filters.getFilterState({ key: props.definition.key })

  if (committedRule?.value === true || committedRule?.value === false) {
    localValue.value = committedRule.value
    return
  }

  localValue.value = null
}

function handleOpenChange(open: boolean) {
  isOpen.value = open
  if (open) initLocalState()
}

function applyFilter() {
  if (localValue.value == null) {
    internals.filters.clearFilter({ key: props.definition.key })
  } else {
    internals.filters.setScalarFilterValue({
      key: props.definition.key,
      value: localValue.value,
    })
  }

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
    :ui="{ content: 'w-fit overflow-hidden p-0 shadow-none' }"
    @update:open="handleOpenChange"
  >
    <TableFilterTrigger
      :label="internals.filters.getFilterLabelText({ label: definition.label })"
      :leading-icon="triggerIcon"
      operator-label="is"
      :operator-items="[]"
      :preview-tags="preview.tags"
      :preview-summary="preview.summary"
      :active="preview.active"
      @clear="clearFilter"
    />

    <template #content>
      <div class="w-fit max-w-[calc(100vw-1rem)] bg-default">
        <div class="p-2">
          <URadioGroup
            v-model="radioValue"
            :items="radioItems"
            color="neutral"
            variant="list"
            :ui="{
              root: 'w-full',
              fieldset: 'grid gap-0.5',
              item: 'flex items-center rounded-md transition-colors hover:bg-elevated data-[state=checked]:bg-elevated',
              container: 'self-center pl-3',
              base: 'cursor-pointer',
              wrapper: 'min-w-0 flex-1 py-2 pr-3',
              label: 'w-full cursor-pointer text-sm text-default',
            }"
          >
            <template #label="{ item }">
              <div class="flex min-w-0 items-center gap-3">
                <UIcon
                  v-if="typeof item.icon === 'string'"
                  :name="item.icon"
                  class="size-4 shrink-0 text-muted"
                />

                <span class="min-w-0 flex-1 truncate">
                  {{ item.label }}
                </span>
                <span v-if="item.count != null" class="ml-3 shrink-0 text-muted">
                  {{ item.count }}
                </span>
              </div>
            </template>
          </URadioGroup>
        </div>

        <div
          v-if="filterUi.commitMode === 'manual'"
          class="flex items-center justify-between border-t border-default p-2"
        >
          <UButton color="neutral" variant="ghost" size="sm" :label="filterUi.actions.clear" @click="clearFilter" />
          <UButton color="neutral" variant="subtle" size="sm" :label="filterUi.actions.apply" @click="applyFilter" />
        </div>
      </div>
    </template>
  </UPopover>
</template>
