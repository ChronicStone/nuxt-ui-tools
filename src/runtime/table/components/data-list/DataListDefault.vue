<script setup lang="ts">
import { computed } from 'vue'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListDefaultUi } from '../../types'
import { mergeDataListUiClass, resolveDataListControlGeometry } from '../../utils'
import DataListActionsDropdown from './DataListActionsDropdown.vue'
import DataListColumnPanel from './DataListColumnPanel.vue'
import DataListContent from './DataListContent.vue'
import DataListFilterPanel from './DataListFilterPanel.vue'
import DataListFilterTags from './DataListFilterTags.vue'
import DataListInfiniteLoader from './DataListInfiniteLoader.vue'
import DataListLayoutSwitch from './DataListLayoutSwitch.vue'
import DataListPagination from './DataListPagination.vue'
import DataListRefresh from './DataListRefresh.vue'
import DataListSearch from './DataListSearch.vue'
import DataListSelectionActions from './DataListSelectionActions.vue'

const props = defineProps<{
  title?: string
  description?: string
  height?: string | number
  ui?: DataListDefaultUi
}>()
const internals = useTableInternals()
const dataListUi = useDataListUi()
const titleText = computed(() => props.title ?? humanizeKey(internals.schema.value.tableKey))
const contentHeight = computed(() => props.height ?? '36rem')
const rootUi = computed(() => dataListUi.ui.value.default?.ui)
const geometry = computed(() => resolveDataListControlGeometry(dataListUi.controlSize.value))

function humanizeKey(value: string) {
  return (
    value
      .split('.')
      .at(-1)
      ?.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase()) ?? value
  )
}
</script>

<template>
  <div :class="mergeDataListUiClass(`grid ${geometry.panelGap}`, rootUi?.root, ui?.root)">
    <header :class="mergeDataListUiClass(`grid ${geometry.fieldGap}`, rootUi?.header, ui?.header)">
      <div
        v-if="$slots.title || titleText || description"
        :class="mergeDataListUiClass('grid gap-1', rootUi?.heading, ui?.heading)"
      >
        <slot name="title">
          <h2
            :class="
              mergeDataListUiClass(
                'text-lg font-semibold tracking-tight text-highlighted',
                rootUi?.title,
                ui?.title,
              )
            "
          >
            {{ titleText }}
          </h2>
        </slot>
        <p
          v-if="description"
          :class="mergeDataListUiClass('text-sm text-muted', rootUi?.description, ui?.description)"
        >
          {{ description }}
        </p>
      </div>

      <div
        :class="
          mergeDataListUiClass(
            `flex flex-col lg:flex-row lg:items-start lg:justify-between ${geometry.fieldGap}`,
            rootUi?.toolbar,
            ui?.toolbar,
          )
        "
      >
        <div
          :class="
            mergeDataListUiClass(
              `flex min-w-0 flex-1 flex-wrap items-center ${geometry.toolbarGap}`,
              rootUi?.primaryActions,
              ui?.primaryActions,
            )
          "
        >
          <DataListSearch />
          <DataListFilterTags show-add show-clear />
          <DataListActionsDropdown v-if="!$slots.actions" />
          <slot name="actions" />
        </div>
        <div
          :class="
            mergeDataListUiClass(
              `flex shrink-0 self-start items-start justify-end ${geometry.toolbarGap}`,
              rootUi?.secondaryActions,
              ui?.secondaryActions,
            )
          "
        >
          <DataListFilterPanel />
          <DataListColumnPanel />
          <DataListRefresh />
          <DataListLayoutSwitch />
        </div>
      </div>
    </header>

    <DataListContent fit="height" surface="contained" :height="contentHeight">
      <template v-if="$slots['initial-loading']" #initial-loading="scope">
        <slot name="initial-loading" v-bind="scope" />
      </template>
      <template v-if="$slots.loading" #loading="scope"
        ><slot name="loading" v-bind="scope"
      /></template>
      <template v-if="$slots.error" #error="scope"><slot name="error" v-bind="scope" /></template>
      <template v-if="$slots.empty" #empty="scope"><slot name="empty" v-bind="scope" /></template>
      <template v-if="$slots['empty-table']" #empty-table><slot name="empty-table" /></template>
      <template v-if="$slots['empty-grid']" #empty-grid><slot name="empty-grid" /></template>
      <template v-if="$slots.refreshing" #refreshing><slot name="refreshing" /></template>
      <template #after>
        <DataListInfiniteLoader>
          <template v-if="$slots['loading-more']" #loading="scope"
            ><slot name="loading-more" v-bind="scope"
          /></template>
          <template v-if="$slots['load-more-error']" #error="scope"
            ><slot name="load-more-error" v-bind="scope"
          /></template>
          <template v-if="$slots.end" #end="scope"><slot name="end" v-bind="scope" /></template>
        </DataListInfiniteLoader>
      </template>
    </DataListContent>

    <DataListSelectionActions />

    <DataListPagination />
  </div>
</template>
