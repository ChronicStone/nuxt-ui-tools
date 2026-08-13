<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { provideDataListViewport } from '../../composables/use-data-list-viewport'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListContentFit, DataListContentUi } from '../../types'
import { mergeDataListUiClass } from '../../utils'
import DataListGrid from './DataListGrid.vue'
import DataListTable from './DataListTable.vue'

const props = withDefaults(
  defineProps<{
    fit?: DataListContentFit
    height?: string | number
    transition?: boolean
    ui?: DataListContentUi
  }>(),
  { fit: 'content', transition: true },
)
const internals = useTableInternals()
const dataListUi = useDataListUi()
const { t } = useUiToolsLocale()
const viewport = ref<HTMLElement | null>(null)
provideDataListViewport(viewport)

const rows = computed(() => internals.queryContent.data.value.rows)
const loading = computed(
  () =>
    internals.queryContent.status.value.isBooting ||
    (internals.queryContent.status.value.isPending && rows.value.length === 0),
)
const error = computed(() => (rows.value.length ? null : internals.queryContent.error.value))
const empty = computed(() => !loading.value && !error.value && rows.value.length === 0)
const refreshing = computed(
  () =>
    rows.value.length > 0 &&
    (internals.queryContent.status.value.isRefreshing ||
      internals.queryContent.status.value.isRevalidating),
)
const normalizedHeight = computed(() =>
  typeof props.height === 'number' ? `${props.height}px` : props.height,
)
const viewportStyle = computed(() => {
  if (props.fit === 'fill') return { minHeight: 0 }
  if (props.fit === 'height' && normalizedHeight.value) return { height: normalizedHeight.value }
  return undefined
})
const rootUi = computed(() => dataListUi.ui.value.content?.ui)
const shellClass = computed(() =>
  internals.controls.tableLayout.value === 'grid'
    ? 'grid gap-5'
    : 'overflow-hidden rounded-md border border-default bg-default',
)

function refresh() {
  void internals.queryContent.refreshData()()
}

watch(
  () => internals.controls.tableLayout.value,
  () => {
    nextTick(() => viewport.value?.scrollTo({ top: 0, left: 0 }))
  },
)

watch(
  () => internals.pagination.currentPage.value,
  () => {
    if (internals.pagination.mode.value !== 'offset') return
    nextTick(() => viewport.value?.scrollTo({ top: 0, left: 0 }))
  },
)
</script>

<template>
  <div
    ref="viewport"
    data-data-list-viewport
    :class="
      mergeDataListUiClass(
        `relative min-h-0 ${shellClass} ${fit === 'content' ? '' : 'overflow-auto'}`,
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
    <slot v-else-if="error" name="error" :error="error" :retry="refresh">
      <div
        :class="
          mergeDataListUiClass(
            'grid min-h-64 place-items-center px-4 py-10 text-center',
            rootUi?.error,
            ui?.error,
          )
        "
      >
        <div :class="mergeDataListUiClass('grid max-w-sm gap-3', rootUi?.errorBody, ui?.errorBody)">
          <div
            :class="
              mergeDataListUiClass(
                'font-medium text-highlighted',
                rootUi?.errorTitle,
                ui?.errorTitle,
              )
            "
          >
            {{ t('table.states.gridError.title') }}
          </div>
          <button
            type="button"
            :class="
              mergeDataListUiClass(
                'mx-auto rounded-md border border-default px-3 py-1.5 text-sm text-default hover:bg-elevated',
                rootUi?.retry,
                ui?.retry,
              )
            "
            @click="refresh"
          >
            {{ t('table.states.gridError.action') }}
          </button>
        </div>
      </div>
    </slot>
    <slot
      v-else-if="empty && $slots.empty"
      name="empty"
      :layout="internals.controls.tableLayout.value"
      :refresh="refresh"
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
          <DataListTable>
            <template #empty>
              <slot name="empty-table">
                <slot name="empty" :layout="'table'" :refresh="refresh" />
              </slot>
            </template>
          </DataListTable>
        </slot>
        <slot v-else name="grid" :rows="rows">
          <DataListGrid>
            <template #empty>
              <slot name="empty-grid">
                <slot name="empty" :layout="'grid'" :refresh="refresh" />
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
