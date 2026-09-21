<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { nextTick, shallowRef, watch } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import type { useTableFilterOptions } from '../../../composables/use-table-filter-options'
import type { DataListControlSize, DataListFilterEditorUi } from '../../../types'
import FilterOptionLoadingList from './filter-option-loading-list.vue'

/** Viewport heights ahead of the list end at which the next page starts loading by default. */
const PREFETCH_VIEWPORTS = 3

const props = defineProps<{
  remote: ReturnType<typeof useTableFilterOptions>['remote']
  indicator: 'checkbox' | 'radio'
  size?: DataListControlSize
  ui?: DataListFilterEditorUi
}>()

const { t } = useUiToolsLocale()
const sentinel = shallowRef<HTMLElement | null>(null)
const viewport = shallowRef<HTMLElement | null>(null)

watch(sentinel, (element) => {
  viewport.value = findScrollContainer(element)
})

useEventListener(viewport, 'scroll', loadAhead, { passive: true })

// A short first page, or a page that just arrived, may leave the list within reach of its end.
watch(
  () => [props.remote.hasMore.value, props.remote.loadingMore.value, viewport.value] as const,
  async () => {
    await nextTick()
    loadAhead()
  },
  { immediate: true },
)

/** Requests the next page once the scroll position comes within the prefetch distance of the end. */
function loadAhead() {
  const element = viewport.value
  const { failed, hasMore, loadingMore, prefetchDistance } = props.remote
  if (!element || element.clientHeight === 0) return
  if (!hasMore.value || loadingMore.value || failed.value) return
  const distance = prefetchDistance.value
  const threshold =
    distance === 'viewport' ? element.clientHeight * PREFETCH_VIEWPORTS : Math.max(0, distance)
  if (element.scrollHeight - element.scrollTop - element.clientHeight <= threshold) {
    props.remote.loadMore()
  }
}

function findScrollContainer(element: HTMLElement | null) {
  const marked = element?.closest('[data-filter-option-scroll]')
  if (marked instanceof HTMLElement) return marked
  for (let current = element?.parentElement; current; current = current.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(current).overflowY)) return current
  }
  return null
}
</script>

<template>
  <div data-filter-option-list-end>
    <FilterOptionLoadingList
      v-if="remote.loadingMore.value"
      :count="3"
      :indicator="indicator"
      :size="size"
      :ui="ui"
      data-filter-option-loading-more
    />
    <div
      v-else-if="remote.failed.value"
      class="flex items-center justify-between gap-2 px-2 py-1.5 text-xs text-error"
      data-filter-option-error
    >
      <span class="truncate">{{ t('table.filters.options.loadError') }}</span>
      <button
        type="button"
        class="shrink-0 font-medium underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
        data-filter-option-retry
        @click="remote.retry()"
      >
        {{ t('table.filters.options.retry') }}
      </button>
    </div>
    <span ref="sentinel" aria-hidden="true" class="block h-px w-full" />
  </div>
</template>
