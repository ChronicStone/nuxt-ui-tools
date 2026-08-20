<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { computed, ref } from 'vue'

import { isBoolean, isString } from '../../../../shared/utils/predicate'
import { useTableFilterOptions } from '../../../composables/use-table-filter-options'
import { useTableInternals } from '../../../composables/use-table-internals'
import type { DataListControlSize, TableBooleanFilterDefinition } from '../../../types'
import {
  resolveBooleanFilterUi,
  resolveDataListControlGeometry,
  resolveFilterEditorSizeClasses,
} from '../../../utils'
import FilterPanelFieldShell from './FilterPanelFieldShell.vue'

const props = defineProps<{
  definition: TableBooleanFilterDefinition
  size: DataListControlSize
}>()

const internals = useTableInternals()
const geometry = computed(() => resolveDataListControlGeometry(props.size))
const sizeClasses = computed(() => resolveFilterEditorSizeClasses(props.size))
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
const isActive = computed(
  () =>
    internals.filterPresentation.getPanelDraftFilterState({ key: props.definition.key }) != null,
)

const entries = computed(() =>
  optionSource.filteredEntries.value
    .filter((entry) => isBoolean(entry.value))
    .map((entry) => ({
      ...entry,
      label: entry.value === true ? filterUi.value.labels.true : filterUi.value.labels.false,
      icon: entry.value === true ? filterUi.value.icons.true : filterUi.value.icons.false,
    })),
)

const radioItems = computed(() =>
  entries.value.map((entry) => ({
    label: entry.label,
    value: String(entry.value),
    count: entry.count,
    icon: entry.icon,
  })),
)

const radioValue = computed({
  get: () => {
    const value = internals.filterPresentation.getPanelDraftFilterState({
      key: props.definition.key,
    })?.value
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
    :size="size"
  >
    <URadioGroup
      v-model="radioValue"
      :items="radioItems"
      :size="size"
      color="neutral"
      variant="list"
      :ui="{
        root: 'w-full',
        fieldset: 'grid gap-0.5',
        item: `flex items-center rounded-md transition-colors hover:bg-elevated data-[state=checked]:bg-elevated ${sizeClasses.option}`,
        container: 'self-center',
        base: 'cursor-pointer',
        wrapper: 'min-w-0 flex-1',
        label: `w-full cursor-pointer text-default ${sizeClasses.optionLabel}`,
      }"
    >
      <template #label="{ item }">
        <div :class="['flex min-w-0 items-center', geometry.toolbarGap]">
          <UIcon
            v-if="isString(item.icon)"
            :name="item.icon"
            :class="[sizeClasses.optionIcon, 'shrink-0 text-muted']"
          />

          <span class="min-w-0 flex-1 truncate">
            {{ item.label }}
          </span>
          <USkeleton v-if="optionSource.isCountLoading.value" class="h-3.5 w-6 shrink-0" />
          <span v-else-if="item.count != null" class="shrink-0 text-muted">
            {{ item.count }}
          </span>
        </div>
      </template>
    </URadioGroup>
  </FilterPanelFieldShell>
</template>
