<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useIntersectionObserver } from '@vueuse/core'
import { computed, ref } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useDataListViewport } from '../../composables/use-data-list-viewport'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListControlSize, DataListInfiniteLoaderUi } from '../../types'
import { mergeDataListUiClass } from '../../utils'

const props = withDefaults(
  defineProps<{
    auto?: boolean
    rootMargin?: string
    label?: string
    size?: DataListControlSize
    ui?: DataListInfiniteLoaderUi
  }>(),
  { auto: true, rootMargin: '320px 0px' },
)
const internals = useTableInternals()
const dataListUi = useDataListUi()
const viewport = useDataListViewport()
const sentinel = ref<HTMLElement | null>(null)
const state = internals.pagination.state
const { t } = useUiToolsLocale()
const rootUi = computed(() => dataListUi.ui.value.infiniteLoader)
const resolvedUi = computed<DataListInfiniteLoaderUi>(() => ({
  ...rootUi.value?.ui,
  ...props.ui,
}))
const resolvedSize = computed(
  () => props.size ?? rootUi.value?.size ?? dataListUi.controlSize.value,
)

function loadMore() {
  void internals.pagination.loadMore()
}

useIntersectionObserver(
  sentinel,
  ([entry]) => {
    if (!props.auto || !entry?.isIntersecting || !state.value.hasNextPage) return
    loadMore()
  },
  { root: viewport.element, rootMargin: props.rootMargin },
)
</script>

<template>
  <div
    v-if="internals.pagination.mode.value === 'cursor'"
    ref="sentinel"
    data-data-list-infinite-loader
    :class="
      mergeDataListUiClass(
        'flex min-h-12 items-center justify-center py-3',
        rootUi?.ui?.root,
        ui?.root,
      )
    "
  >
    <slot v-if="state.isLoadingMore" name="loading" :loaded-count="state.loadedCount">
      <span
        :class="
          mergeDataListUiClass(
            'inline-flex items-center gap-2 text-sm text-muted',
            rootUi?.ui?.loading,
            ui?.loading,
          )
        "
      >
        <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
        {{ t('table.states.loadingMore') }}
      </span>
    </slot>
    <slot
      v-else-if="state.loadMoreError"
      name="error"
      :error="state.loadMoreError"
      :retry="internals.pagination.loadMore"
    >
      <UButton
        color="neutral"
        variant="soft"
        :size="resolvedSize"
        :label="t('table.states.gridError.action')"
        :ui="{ base: resolvedUi.retry }"
        @click="loadMore"
      />
    </slot>
    <div
      v-else-if="!state.hasNextPage"
      :class="mergeDataListUiClass(undefined, rootUi?.ui?.end, ui?.end)"
    >
      <slot name="end" :loaded-count="state.loadedCount" :total-count="state.totalCount" />
    </div>
    <slot v-else-if="!auto" :load-more="internals.pagination.loadMore" :state="state">
      <UButton
        color="neutral"
        variant="outline"
        :size="resolvedSize"
        :label="label ?? t('table.controls.loadMore')"
        :ui="{ base: resolvedUi.loadMore }"
        @click="loadMore"
      />
    </slot>
  </div>
</template>
