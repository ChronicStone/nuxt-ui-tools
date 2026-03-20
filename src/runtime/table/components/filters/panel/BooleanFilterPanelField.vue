<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { computed, ref } from 'vue'

import { useTableFilterOptions } from '../../../composables/use-table-filter-options'
import { useTableInternals } from '../../../composables/use-table-internals'
import type { TableBooleanFilterDefinition } from '../../../types'
import { resolveBooleanFilterUi } from '../../../utils'
import FilterPanelFieldShell from './FilterPanelFieldShell.vue'

const props = defineProps<{
  definition: TableBooleanFilterDefinition
}>()

const internals = useTableInternals()
const searchQuery = ref<string>('')

const optionSource = useTableFilterOptions({
  definition: props.definition,
  searchQuery,
  active: internals.filterPresentation.panelOpen,
  filters: internals.filters,
  queryContent: internals.queryContent,
  schema: internals.schema,
})

const filterUi = computed(() => resolveBooleanFilterUi(props.definition, 'is'))
const isActive = computed(() =>
  internals.filterPresentation.getPanelDraftFilterState({ key: props.definition.key }) != null,
)

const entries = computed(() =>
  optionSource.filteredEntries.value
    .filter(entry => typeof entry.value === 'boolean')
    .map((entry) => ({
      ...entry,
      label: entry.value === true ? filterUi.value.labels.true : filterUi.value.labels.false,
      icon: entry.value === true ? filterUi.value.icons.true : filterUi.value.icons.false,
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
  get: () => {
    const value = internals.filterPresentation.getPanelDraftFilterState({ key: props.definition.key })?.value
    return value === true || value === false ? String(value) : undefined
  },
  set: (value: string | undefined) => {
    if (value === 'true') {
      internals.filterPresentation.setPanelScalarFilterValue({
        key: props.definition.key,
        value: true,
      })
      return
    }

    if (value === 'false') {
      internals.filterPresentation.setPanelScalarFilterValue({
        key: props.definition.key,
        value: false,
      })
      return
    }

    internals.filterPresentation.clearPanelFilter({ key: props.definition.key })
  },
})
</script>

<template>
  <FilterPanelFieldShell
    :label="internals.filters.getFilterLabelText({ label: definition.label })"
    :active="isActive"
  >
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
          <USkeleton v-if="optionSource.isCountLoading.value" class="ml-3 h-3.5 w-6 shrink-0" />
          <span v-else-if="item.count != null" class="ml-3 shrink-0 text-muted">
            {{ item.count }}
          </span>
        </div>
      </template>
    </URadioGroup>
  </FilterPanelFieldShell>
</template>
