<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed, TransitionGroup } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../../composables/use-data-list-ui'
import { useTableInternals } from '../../../composables/use-table-internals'
import type { DataListButtonProps, TableUiFilterDefinition } from '../../../types'
import { getFilterLabelText, mergeDataListProps, mergeDataListUiClass } from '../../../utils'
import DynamicFilterPicker from '../shared/dynamic-filter-picker.vue'
import { resolveFilterTagComponent } from './registry'

const internals = useTableInternals()
const dataListUi = useDataListUi()
const { t } = useUiToolsLocale()
const props = withDefaults(defineProps<{ showAdd?: boolean; showClear?: boolean }>(), {
  showAdd: true,
  showClear: true,
})

const visibleDefinitions = computed(() => [
  ...internals.filterPresentation.tagDefinitions.value,
  ...internals.filterPresentation.activeDynamicDefinitions.value,
])
const dynamicSessionDefinition = computed(
  () => internals.filterPresentation.dynamicSessionDefinition.value,
)

function clearAll() {
  internals.filters.clearAllFilters()
  internals.filters.searchQuery.value = ''
}

function getFilterLabel(definition: TableUiFilterDefinition) {
  return getFilterLabelText({ label: definition.label })
}
</script>

<template>
  <TransitionGroup
    v-if="
      visibleDefinitions.length ||
      internals.filterPresentation.dormantDynamicDefinitions.value.length ||
      internals.filters.hasActiveUiFilters.value
    "
    tag="div"
    :class="
      mergeDataListUiClass(
        'nut-dl-tags relative flex min-w-0 flex-wrap items-center gap-2',
        undefined,
        dataListUi.ui.value.filterTags?.ui?.root,
      )
    "
    move-class="nut-dl-tag--moving"
    enter-active-class="nut-dl-tag--entering"
    enter-from-class="nut-dl-tag--hidden"
    leave-active-class="nut-dl-tag--leaving"
    leave-to-class="nut-dl-tag--hidden"
  >
    <component
      :is="resolveFilterTagComponent(definition)"
      v-for="definition in visibleDefinitions"
      :key="definition.key"
      :definition="definition"
      :dynamic="
        internals.filterPresentation.activeDynamicDefinitions.value.some(
          (item) => item.key === definition.key,
        )
      "
      @dismiss="
        internals.filterPresentation.releaseDynamicSession({
          key: definition.key,
        })
      "
    >
      <template v-if="$slots.filter" #trigger="scope">
        <slot name="filter" v-bind="scope" :filter="definition" />
      </template>
    </component>

    <DynamicFilterPicker
      key="__add"
      v-if="
        props.showAdd &&
        (internals.filterPresentation.dormantDynamicDefinitions.value.length ||
          dynamicSessionDefinition)
      "
      :definitions="internals.filterPresentation.dormantDynamicDefinitions.value"
      :session-definition="dynamicSessionDefinition"
      :get-label="getFilterLabel"
      :size="
        dataListUi.ui.value.addFilter?.size ??
        dataListUi.ui.value.filterTags?.size ??
        dataListUi.controlSize.value
      "
      :ui="{
        ...dataListUi.ui.value.addFilter?.ui,
        trigger: dataListUi.ui.value.filterTags?.ui?.addTrigger,
      }"
      @select="internals.filterPresentation.activateDynamicFilter({ key: $event })"
      @release="internals.filterPresentation.releaseDynamicSession({ key: $event })"
    >
      <template v-if="$slots['add-filter-trigger']" #trigger="scope">
        <slot name="add-filter-trigger" v-bind="scope" />
      </template>
    </DynamicFilterPicker>

    <UButton
      v-if="
        props.showClear &&
        (internals.filters.hasActiveUiFilters.value || internals.filters.searchQuery.value)
      "
      key="__clear"
      v-bind="
        mergeDataListProps<DataListButtonProps>(
          {
            color: 'neutral',
            variant: 'ghost',
            size: dataListUi.ui.value.filterTags?.size ?? dataListUi.controlSize.value,
          },
          dataListUi.ui.value.filterTags?.props?.clearTrigger,
        )
      "
      icon="i-lucide-rotate-ccw"
      :ui="{
        base: mergeDataListUiClass(
          'nut-dl-tag nut-dl-tag--clear shrink-0 text-muted hover:text-default',
          undefined,
          dataListUi.ui.value.filterTags?.ui?.clearTrigger,
        ),
      }"
      @click="clearAll"
    >
      <slot name="clear-filter-label">{{ t('table.controls.resetFilters') }}</slot>
    </UButton>
  </TransitionGroup>
</template>

<style>
.nut-dl-tag--moving {
  transition: transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1);
}
.nut-dl-tag--entering {
  transition:
    opacity 0.16s ease,
    transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1);
}
.nut-dl-tag--leaving {
  position: absolute;
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}
.nut-dl-tag--hidden {
  opacity: 0;
  transform: translateY(3px) scale(0.98);
}
@media (prefers-reduced-motion: reduce) {
  .nut-dl-tag--moving,
  .nut-dl-tag--entering,
  .nut-dl-tag--leaving {
    transition: none;
  }
}
</style>
