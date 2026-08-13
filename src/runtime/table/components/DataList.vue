<script setup lang="ts">
import type { ComputedRef } from 'vue'

import type { UiToolsLocale, UiToolsMessages } from '#ui-tools/i18n'

import type { TableInternals } from '../composables/use-table-internals'
import type { DataListDensity, DataListUiConfig } from '../types'
import DataListDefault from './data-list/DataListDefault.vue'
import DataListRoot from './data-list/DataListRoot.vue'

type DataListTable = {
  schema: ComputedRef<{ tableKey: string }>
  __internals: TableInternals
}

defineProps<{
  table: DataListTable
  title?: string
  description?: string
  height?: string | number
  locale?: UiToolsLocale<UiToolsMessages>
  density?: DataListDensity
  ui?: DataListUiConfig
}>()
</script>

<template>
  <DataListRoot :table="table" :locale="locale" :density="density" :ui="ui">
    <DataListDefault :title="title" :description="description" :height="height">
      <template v-if="$slots.title" #title>
        <slot name="title" />
      </template>
      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>
      <template v-if="$slots.empty" #empty="scope">
        <slot name="empty" v-bind="scope" />
      </template>
      <template v-if="$slots['empty-table']" #empty-table>
        <slot name="empty-table" />
      </template>
      <template v-if="$slots['empty-grid']" #empty-grid>
        <slot name="empty-grid" />
      </template>
      <template v-if="$slots.loading" #loading="scope">
        <slot name="loading" v-bind="scope" />
      </template>
      <template v-if="$slots['initial-loading']" #initial-loading="scope">
        <slot name="initial-loading" v-bind="scope" />
      </template>
      <template v-if="$slots.error" #error="scope">
        <slot name="error" v-bind="scope" />
      </template>
      <template v-if="$slots['loading-more']" #loading-more="scope">
        <slot name="loading-more" v-bind="scope" />
      </template>
      <template v-if="$slots['load-more-error']" #load-more-error="scope">
        <slot name="load-more-error" v-bind="scope" />
      </template>
      <template v-if="$slots.end" #end="scope">
        <slot name="end" v-bind="scope" />
      </template>
      <template v-if="$slots.refreshing" #refreshing>
        <slot name="refreshing" />
      </template>
    </DataListDefault>
  </DataListRoot>
</template>
