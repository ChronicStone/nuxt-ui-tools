<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import { isNumber } from '../../../shared/utils/predicate'
import { useDataListUi } from '../../composables/use-data-list-ui'
import { provideDataListViewport } from '../../composables/use-data-list-viewport'
import { useTableInternals } from '../../composables/use-table-internals'
import type {
  DataListContentFit,
  DataListContentSurface,
  DataListContentUi,
  DataListControlSize,
} from '../../types'
import { mergeDataListUiClass, resolveDataListContentShellClass } from '../../utils'
import DataListErrorState from './data-list-error-state.vue'
import DataListGrid from './data-list-grid.vue'
import DataListTable from './data-list-table.vue'

const props = withDefaults(
  defineProps<{
    fit?: DataListContentFit
    height?: string | number
    surface?: DataListContentSurface
    transition?: boolean
    size?: DataListControlSize
    ui?: DataListContentUi
  }>(),
  { fit: 'content', surface: 'plain', transition: true },
)
const internals = useTableInternals()
const dataListUi = useDataListUi()
const viewport = ref<HTMLElement | null>(null)
provideDataListViewport(viewport)

const rows = computed(() => internals.queryContent.data.value.rows)
const loading = computed(
  () =>
    internals.queryContent.status.value.isBooting ||
    ((internals.queryContent.status.value.isPending ||
      internals.queryContent.status.value.isFetching) &&
      rows.value.length === 0),
)
const error = computed(() => internals.queryContent.error.value)
const empty = computed(() => !loading.value && !error.value && rows.value.length === 0)
const hasActiveQuery = computed(
  () => internals.filters.hasActiveSearch.value || internals.filters.hasActiveUiFilters.value,
)
const refreshing = computed(
  () =>
    rows.value.length > 0 &&
    (internals.queryContent.status.value.isRefreshing ||
      internals.queryContent.status.value.isRevalidating),
)
const normalizedHeight = computed(() =>
  isNumber(props.height) ? `${props.height}px` : props.height,
)
const viewportStyle = computed(() => {
  if (props.fit === 'fill') {
    return { minHeight: 0 }
  }
  if (props.fit === 'height' && normalizedHeight.value) {
    return { height: normalizedHeight.value }
  }
  return undefined
})
const rootUi = computed(() => dataListUi.ui.value.content?.ui)
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.content?.size ?? dataListUi.controlSize.value,
)
const shellClass = computed(() =>
  resolveDataListContentShellClass({
    layout: internals.controls.tableLayout.value,
    surface: props.surface,
  }),
)

function refresh() {
  void internals.queryContent.refreshData()()
}

function clearQuery() {
  internals.filters.searchQuery.value = ''
  internals.filters.clearAllFilters()
}

watch(
  () => internals.controls.tableLayout.value,
  () => {
    nextTick().then(() => viewport.value?.scrollTo({ left: 0, top: 0 }))
  },
)

watch(
  () => internals.pagination.currentPage.value,
  () => {
    if (internals.pagination.mode.value !== 'offset') {
      return
    }
    nextTick().then(() => viewport.value?.scrollTo({ left: 0, top: 0 }))
  },
)
</script>

<template>
  <div
    ref="viewport"
    data-data-list-viewport
    :class="
      mergeDataListUiClass(
        `relative min-h-0 ${shellClass} ${fit === 'content' ? '' : 'flex flex-col overflow-hidden'}`,
        rootUi?.root,
        ui?.root,
      )
    "
    :style="viewportStyle"
  >
    <slot name="before" />

    <slot
      v-if="loading && ($slots['initial-loading'] || $slots.loading)"
      :name="$slots['initial-loading'] ? 'initial-loading' : 'loading'"
      :layout="internals.controls.tableLayout.value"
    />
    <slot
      v-else-if="error && internals.controls.tableLayout.value === 'grid'"
      name="error"
      :error="error"
      :retry="refresh"
    >
      <DataListErrorState
        :min-height="fit === 'content' ? '16rem' : undefined"
        :class="fit === 'content' ? '' : 'min-h-0 flex-1'"
        :size="resolvedSize"
        :ui="ui"
        @retry="refresh"
      />
    </slot>
    <slot
      v-else-if="empty && $slots.empty"
      name="empty"
      :layout="internals.controls.tableLayout.value"
      :refresh="refresh"
      :has-active-query="hasActiveQuery"
      :clear-query="clearQuery"
    />
    <slot
      v-else
      name="content"
      :layout="internals.controls.tableLayout.value"
      :rows="rows"
      :loading="loading"
      :empty="empty"
      :error="error"
    >
      <Transition
        :name="
          transition
            ? internals.controls.tableLayout.value === 'grid'
              ? 'data-list-slide'
              : 'data-list-slide-reverse'
            : undefined
        "
        mode="out-in"
      >
        <slot v-if="internals.controls.tableLayout.value === 'table'" name="table" :rows="rows">
          <DataListTable :size="resolvedSize" :fill="fit !== 'content'" class="min-h-0 flex-1">
            <template v-if="$slots.error" #error="scope">
              <slot name="error" v-bind="scope" />
            </template>
            <template #empty>
              <slot name="empty-table">
                <slot
                  name="empty"
                  :layout="'table'"
                  :refresh="refresh"
                  :has-active-query="hasActiveQuery"
                  :clear-query="clearQuery"
                />
              </slot>
            </template>
          </DataListTable>
        </slot>
        <slot v-else name="grid" :rows="rows">
          <DataListGrid :size="resolvedSize" :fill="fit !== 'content'" class="min-h-0 flex-1">
            <template #empty>
              <slot name="empty-grid">
                <slot
                  name="empty"
                  :layout="'grid'"
                  :refresh="refresh"
                  :has-active-query="hasActiveQuery"
                  :clear-query="clearQuery"
                />
              </slot>
            </template>
          </DataListGrid>
        </slot>
      </Transition>
    </slot>

    <slot v-if="refreshing" name="refreshing" />
    <slot name="after" />
  </div>
</template>

<style scoped>
.data-list-slide-enter-active,
.data-list-slide-leave-active,
.data-list-slide-reverse-enter-active,
.data-list-slide-reverse-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.data-list-slide-enter-from,
.data-list-slide-reverse-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.data-list-slide-leave-to,
.data-list-slide-reverse-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .data-list-slide-enter-active,
  .data-list-slide-leave-active,
  .data-list-slide-reverse-enter-active,
  .data-list-slide-reverse-leave-active {
    transition-duration: 0.01ms;
  }
}
</style>
