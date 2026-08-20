<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { AnimatePresence, motion } from 'motion-v'
import { computed, nextTick, onMounted, ref, watch, type ComponentPublicInstance } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import { GRID_DEFAULTS } from '../../constants/grid'
import type { DataListControlSize, DataListGridUi } from '../../types'
import { mergeDataListUiClass, resolveTableRowId } from '../../utils'
import GridCard from './GridCard.vue'
import GridSkeleton from './GridSkeleton.vue'

const props = defineProps<{
  height?: string
  size?: DataListControlSize
  ui?: DataListGridUi
}>()

const internals = useTableInternals()
const dataListUi = useDataListUi()
const { t } = useUiToolsLocale()
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.grid?.size ?? dataListUi.controlSize.value,
)
const viewportRef = ref<HTMLElement | null>(null)
const hostRef = ref<HTMLElement | null>(null)
const animationsReady = ref<boolean>(false)

const isContained = computed(() => internals.grid.mode.value === 'contained')
const rowChunks = computed(() => internals.grid.rowChunks.value)
const rowChunkCount = computed(() => rowChunks.value.length)
const tableRows = computed(() => internals.grid.rows.value)
const gridTemplateColumns = computed(
  () => `repeat(${internals.grid.columnCount.value}, minmax(0, 1fr))`,
)
const gridColumn = computed(
  () => `span ${internals.grid.itemColumnSpan.value} / span ${internals.grid.itemColumnSpan.value}`,
)
const minHeight = computed(() =>
  isContained.value && props.height ? `calc(${props.height} - 6rem)` : '24rem',
)
const showInitialLoading = computed(
  () =>
    internals.queryContent.status.value.isBooting ||
    (internals.queryContent.status.value.isPending && tableRows.value.length === 0),
)
const showRefreshing = computed(
  () =>
    tableRows.value.length > 0 &&
    (internals.queryContent.status.value.isRefreshing ||
      internals.queryContent.status.value.isRevalidating),
)
const showError = computed(
  () => Boolean(internals.queryContent.error.value) && tableRows.value.length === 0,
)
const showEmpty = computed(
  () => !showInitialLoading.value && !showError.value && tableRows.value.length === 0,
)
const skeletonRows = computed(() =>
  Array.from({ length: GRID_DEFAULTS.skeletonRows }, (_, index) => index),
)

const containedVirtualizer = useVirtualizer(
  computed(() => ({
    count: rowChunkCount.value,
    enabled: isContained.value,
    getScrollElement: () => viewportRef.value,
    estimateSize: () => GRID_DEFAULTS.estimatedRowHeight,
    overscan: GRID_DEFAULTS.overscan,
    gap: 16,
    getItemKey: (index: number) => getVirtualRowKey(index),
  })),
)

const virtualRows = computed(() => containedVirtualizer.value.getVirtualItems())
const totalSize = computed(() => containedVirtualizer.value.getTotalSize())
const canAnimateRows = computed(
  () => animationsReady.value && (!isContained.value || !containedVirtualizer.value.isScrolling),
)

onMounted(() => {
  nextTick(() => {
    animationsReady.value = true
  })
})

watch(
  () => internals.pagination.currentPage.value,
  () => scrollToTop(),
)

watch(
  () => internals.controls.tableLayout.value,
  (layout) => {
    if (layout === 'grid') scrollToTop()
  },
)

function getVirtualRowKey(index: number) {
  const chunk = rowChunks.value[index]
  const firstRow = chunk?.rows[0]

  return firstRow
    ? `grid-row:${resolveTableRowId({ rowKey: internals.schema.value.rowKey, row: firstRow, index: chunk.start })}`
    : `grid-row:${index}`
}

function scrollToTop() {
  if (isContained.value) {
    viewportRef.value?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    return
  }
}

function measureVirtualRow(element: Element | ComponentPublicInstance | null) {
  const resolvedElement = unwrapElement(element)
  if (!(resolvedElement instanceof HTMLElement)) return
  containedVirtualizer.value.measureElement(resolvedElement)
}

function refreshData() {
  void internals.queryContent.refreshData()
}

function unwrapElement(value: Element | ComponentPublicInstance | null): Element | null {
  if (value instanceof Element) return value
  if (value && '$el' in value && value.$el instanceof Element) return value.$el
  return null
}
</script>

<template>
  <div ref="hostRef" :class="mergeDataListUiClass('relative overflow-hidden', undefined, ui?.root)">
    <div
      v-if="isContained"
      ref="viewportRef"
      :class="mergeDataListUiClass('overflow-auto', undefined, ui?.viewport)"
      :style="height ? { height } : undefined"
    >
      <div
        v-if="!internals.queryContent.status.value.isBooting"
        :class="mergeDataListUiClass('relative', undefined, ui?.canvas)"
        :style="{ height: `${totalSize}px`, minHeight }"
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            v-for="virtualRow in virtualRows"
            :key="String(virtualRow.key)"
            :ref="measureVirtualRow"
            :class="mergeDataListUiClass('absolute left-0 top-0 w-full', undefined, ui?.row)"
            :style="{ transform: `translateY(${virtualRow.start}px)` }"
            :initial="canAnimateRows ? { opacity: 0, y: 6, scale: 0.995 } : false"
            :animate="{ opacity: 1, y: 0, scale: 1 }"
            :exit="canAnimateRows ? { opacity: 0, y: 4, scale: 0.995 } : undefined"
            :transition="{ duration: canAnimateRows ? 0.22 : 0, ease: [0.25, 1, 0.5, 1] }"
          >
            <div
              :class="mergeDataListUiClass('grid gap-4', undefined, ui?.flow)"
              :style="{ gridTemplateColumns }"
            >
              <div
                v-for="(row, offset) in rowChunks[virtualRow.index]?.rows ?? []"
                :key="
                  resolveTableRowId({
                    rowKey: internals.schema.value.rowKey,
                    row,
                    index: (rowChunks[virtualRow.index]?.start ?? 0) + offset,
                  })
                "
                :class="mergeDataListUiClass('h-full min-w-0 self-stretch', undefined, ui?.item)"
                :style="{ gridColumn }"
              >
                <GridCard :row-index="rowChunks[virtualRow.index]!.start + offset" />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>

    <div v-else :class="mergeDataListUiClass(undefined, undefined, ui?.flowRoot)">
      <div
        v-if="showInitialLoading"
        :class="mergeDataListUiClass('grid gap-4', undefined, ui?.loading)"
        :style="{ gridTemplateColumns, minHeight }"
      >
        <div v-for="row in skeletonRows" :key="row" :style="{ gridColumn }">
          <GridSkeleton />
        </div>
      </div>

      <div
        v-else-if="showError"
        :class="
          mergeDataListUiClass('flex items-center justify-center px-4 py-10', undefined, ui?.error)
        "
        :style="{ minHeight }"
      >
        <div
          :class="
            mergeDataListUiClass(
              'grid max-w-md justify-items-center gap-4 rounded-[28px] border border-danger/20 bg-default/95 px-6 py-8 text-center shadow-lg backdrop-blur',
              undefined,
              ui?.errorCard,
            )
          "
        >
          <div
            :class="
              mergeDataListUiClass(
                'flex size-12 items-center justify-center rounded-2xl border border-danger/20 bg-danger/5',
                undefined,
                ui?.errorIcon,
              )
            "
          >
            <UIcon name="i-lucide-cloud-alert" class="size-5 text-danger" />
          </div>
          <div :class="mergeDataListUiClass('grid gap-1', undefined, ui?.errorCopy)">
            <div
              :class="
                mergeDataListUiClass(
                  'text-base font-medium text-highlighted',
                  undefined,
                  ui?.errorTitle,
                )
              "
            >
              {{ t('table.states.gridError.title') }}
            </div>
            <p
              :class="
                mergeDataListUiClass(
                  'text-sm leading-6 text-muted',
                  undefined,
                  ui?.errorDescription,
                )
              "
            >
              {{ t('table.states.gridError.description') }}
            </p>
          </div>
          <UButton
            color="neutral"
            variant="soft"
            :size="resolvedSize"
            icon="i-lucide-refresh-cw"
            :ui="{ base: ui?.retry }"
            @click="refreshData"
          >
            {{ t('table.states.gridError.action') }}
          </UButton>
        </div>
      </div>

      <div
        v-else-if="showEmpty"
        :class="
          mergeDataListUiClass('flex items-center justify-center px-4 py-10', undefined, ui?.empty)
        "
        :style="{ minHeight }"
      >
        <slot name="empty">
          <div
            :class="
              mergeDataListUiClass(
                'grid max-w-md justify-items-center gap-4 rounded-[28px] border border-default/70 bg-gradient-to-br from-default via-default to-elevated/60 px-6 py-9 text-center shadow-sm',
                undefined,
                ui?.emptyCard,
              )
            "
          >
            <div
              :class="
                mergeDataListUiClass(
                  'flex size-12 items-center justify-center rounded-2xl border border-default/80 bg-elevated/80',
                  undefined,
                  ui?.emptyIcon,
                )
              "
            >
              <UIcon name="i-lucide-layout-grid" class="size-5 text-primary" />
            </div>
            <div :class="mergeDataListUiClass('grid gap-1', undefined, ui?.emptyCopy)">
              <div
                :class="
                  mergeDataListUiClass(
                    'text-base font-medium text-highlighted',
                    undefined,
                    ui?.emptyTitle,
                  )
                "
              >
                {{ t('table.states.gridEmpty.title') }}
              </div>
              <p
                :class="
                  mergeDataListUiClass(
                    'text-sm leading-6 text-muted',
                    undefined,
                    ui?.emptyDescription,
                  )
                "
              >
                {{ t('table.states.gridEmpty.description') }}
              </p>
            </div>
          </div>
        </slot>
      </div>

      <motion.div
        v-else
        :class="mergeDataListUiClass('grid auto-rows-fr gap-4', undefined, ui?.flow)"
        :style="{ gridTemplateColumns }"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :transition="{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }"
      >
        <motion.div
          v-for="(row, index) in tableRows"
          :key="
            resolveTableRowId({
              rowKey: internals.schema.value.rowKey,
              row,
              index,
            })
          "
          :class="mergeDataListUiClass('h-full min-w-0 self-stretch', undefined, ui?.item)"
          :style="{ gridColumn }"
          :initial="canAnimateRows ? { opacity: 0, y: 6 } : false"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{
            duration: canAnimateRows ? 0.22 : 0,
            delay: canAnimateRows
              ? Math.min(
                  Math.floor(index / Math.max(internals.grid.cardsPerRow.value, 1)) * 0.02,
                  0.14,
                )
              : 0,
            ease: [0.25, 1, 0.5, 1],
          }"
        >
          <GridCard :row-index="index" />
        </motion.div>
      </motion.div>
    </div>

    <AnimatePresence v-if="isContained" mode="wait">
      <motion.div
        v-if="showInitialLoading"
        key="grid-loading"
        :class="mergeDataListUiClass('absolute inset-0 z-20', undefined, ui?.loading)"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }"
      >
        <div
          :class="mergeDataListUiClass('grid gap-4', undefined, ui?.flow)"
          :style="{ gridTemplateColumns, minHeight }"
        >
          <div v-for="row in skeletonRows" :key="row" :style="{ gridColumn }">
            <GridSkeleton />
          </div>
        </div>
      </motion.div>

      <motion.div
        v-else-if="showError"
        key="grid-error"
        :class="
          mergeDataListUiClass(
            'absolute inset-0 z-20 flex items-center justify-center px-4 py-10',
            undefined,
            ui?.error,
          )
        "
        :initial="{ opacity: 0, y: 8 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: 4 }"
        :transition="{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }"
      >
        <div
          :class="
            mergeDataListUiClass(
              'grid max-w-md justify-items-center gap-4 rounded-[28px] border border-danger/20 bg-default/95 px-6 py-8 text-center shadow-lg backdrop-blur',
              undefined,
              ui?.errorCard,
            )
          "
        >
          <div
            :class="
              mergeDataListUiClass(
                'flex size-12 items-center justify-center rounded-2xl border border-danger/20 bg-danger/5',
                undefined,
                ui?.errorIcon,
              )
            "
          >
            <UIcon name="i-lucide-cloud-alert" class="size-5 text-danger" />
          </div>
          <div :class="mergeDataListUiClass('grid gap-1', undefined, ui?.errorCopy)">
            <div
              :class="
                mergeDataListUiClass(
                  'text-base font-medium text-highlighted',
                  undefined,
                  ui?.errorTitle,
                )
              "
            >
              {{ t('table.states.gridError.title') }}
            </div>
            <p
              :class="
                mergeDataListUiClass(
                  'text-sm leading-6 text-muted',
                  undefined,
                  ui?.errorDescription,
                )
              "
            >
              {{ t('table.states.gridError.description') }}
            </p>
          </div>
          <UButton
            color="neutral"
            variant="soft"
            :size="resolvedSize"
            icon="i-lucide-refresh-cw"
            :ui="{ base: ui?.retry }"
            @click="refreshData"
          >
            {{ t('table.states.gridError.action') }}
          </UButton>
        </div>
      </motion.div>

      <motion.div
        v-else-if="showEmpty"
        key="grid-empty"
        :class="
          mergeDataListUiClass(
            'absolute inset-0 z-20 flex items-center justify-center px-4 py-10',
            undefined,
            ui?.empty,
          )
        "
        :initial="{ opacity: 0, y: 8 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: 4 }"
        :transition="{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }"
      >
        <slot name="empty">
          <div
            :class="
              mergeDataListUiClass(
                'grid max-w-md justify-items-center gap-4 rounded-[28px] border border-default/70 bg-gradient-to-br from-default via-default to-elevated/60 px-6 py-9 text-center shadow-sm',
                undefined,
                ui?.emptyCard,
              )
            "
          >
            <div
              :class="
                mergeDataListUiClass(
                  'flex size-12 items-center justify-center rounded-2xl border border-default/80 bg-elevated/80',
                  undefined,
                  ui?.emptyIcon,
                )
              "
            >
              <UIcon name="i-lucide-layout-grid" class="size-5 text-primary" />
            </div>
            <div :class="mergeDataListUiClass('grid gap-1', undefined, ui?.emptyCopy)">
              <div
                :class="
                  mergeDataListUiClass(
                    'text-base font-medium text-highlighted',
                    undefined,
                    ui?.emptyTitle,
                  )
                "
              >
                {{ t('table.states.gridEmpty.title') }}
              </div>
              <p
                :class="
                  mergeDataListUiClass(
                    'text-sm leading-6 text-muted',
                    undefined,
                    ui?.emptyDescription,
                  )
                "
              >
                {{ t('table.states.gridEmpty.description') }}
              </p>
            </div>
          </div>
        </slot>
      </motion.div>
    </AnimatePresence>

    <motion.div
      v-if="showRefreshing"
      :class="
        mergeDataListUiClass(
          'pointer-events-none absolute inset-x-0 top-0 z-10',
          undefined,
          ui?.refreshing,
        )
      "
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :exit="{ opacity: 0 }"
      :transition="{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }"
    >
      <div
        :class="
          mergeDataListUiClass(
            'h-px w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent',
            undefined,
            ui?.refreshingLine,
          )
        "
      />
      <div
        :class="
          mergeDataListUiClass(
            'h-12 bg-gradient-to-b from-default/80 via-default/15 to-transparent backdrop-blur-[1.5px]',
            undefined,
            ui?.refreshingVeil,
          )
        "
      />
    </motion.div>
  </div>
</template>

<style scoped>
.grid-overlay-enter-active,
.grid-overlay-leave-active {
  transition: opacity 180ms cubic-bezier(0.25, 1, 0.5, 1);
}

.grid-overlay-enter-from,
.grid-overlay-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  :deep(*) {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
