<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UPagination from '@nuxt/ui/components/Pagination.vue'
import USelect from '@nuxt/ui/components/Select.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListBreakpoint } from '../../composables/use-data-list-breakpoint'
import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type {
  DataListControlSize,
  DataListPaginationControlProps,
  DataListPaginationProps,
  DataListPaginationUi,
  DataListSelectControlProps,
} from '../../types'
import {
  mergeDataListProps,
  mergeDataListUiClass,
  resolveDataListControlGeometry,
} from '../../utils'

const props = withDefaults(
  defineProps<{
    size?: DataListControlSize
    compact?: boolean
    ui?: DataListPaginationUi
    props?: DataListPaginationProps
  }>(),
  { compact: undefined },
)
const internals = useTableInternals()
const { isMobile } = useDataListBreakpoint()
const compact = computed(() => props.compact ?? isMobile.value)
const dataListUi = useDataListUi()
const { locale, t } = useUiToolsLocale()
const controlSize = computed(
  () => props.size ?? dataListUi.ui.value.pagination?.size ?? dataListUi.controlSize.value,
)
const geometry = computed(() => resolveDataListControlGeometry(controlSize.value))
const ui = computed<DataListPaginationUi>(() => ({
  ...dataListUi.ui.value.pagination?.ui,
  ...props.ui,
}))
const controlProps = computed<DataListPaginationProps>(() =>
  mergeDataListProps(dataListUi.ui.value.pagination?.props, props.props),
)
const paginationProps = computed(() =>
  mergeDataListProps<DataListPaginationControlProps>(
    {
      activeColor: 'neutral',
      activeVariant: 'solid',
      color: 'neutral',
      showControls: true,
      showEdges: true,
      siblingCount: 1,
      size: controlSize.value,
      variant: 'ghost',
    },
    controlProps.value.pagination,
  ),
)
const pageSizeProps = computed(() =>
  mergeDataListProps<
    Pick<DataListSelectControlProps, 'color' | 'variant' | 'size' | 'icon' | 'trailingIcon'>
  >({ color: 'neutral', size: controlSize.value, variant: 'none' }, controlProps.value.pageSize),
)

const total = computed(() => internals.pagination.rowCount.value ?? 0)
const booting = computed(
  () =>
    internals.queryContent.status.value.isBooting ||
    (internals.queryContent.status.value.isPending &&
      internals.queryContent.data.value.rows.length === 0),
)
const from = computed(() =>
  total.value === 0
    ? 0
    : (internals.pagination.currentPage.value - 1) * internals.pagination.pageSize.value + 1,
)
const to = computed(() =>
  Math.min(
    total.value,
    internals.pagination.currentPage.value * internals.pagination.pageSize.value,
  ),
)
const summary = computed(() =>
  total.value === 0
    ? t('table.footer.rangeEmpty')
    : t('table.footer.range', {
        from: formatCount(from.value),
        to: formatCount(to.value),
        total: formatCount(total.value),
      }),
)
const pageSizeItems = computed(() =>
  internals.pagination.pageSizeOptions.value.map((size: number) => ({
    label: formatCount(size),
    value: size,
  })),
)
const page = computed({
  get: () => internals.pagination.currentPage.value,
  set: (value: number) => internals.pagination.setPage(value),
})

function formatCount(value: number) {
  return new Intl.NumberFormat(locale.value.code).format(value)
}
</script>

<template>
  <footer
    v-if="internals.pagination.mode.value === 'offset'"
    :class="
      mergeDataListUiClass(
        `nut-dl-footer flex flex-wrap items-center gap-x-3 gap-y-2 text-muted ${geometry.footer}`,
        undefined,
        ui.root,
      )
    "
  >
    <div
      :class="
        mergeDataListUiClass(
          `nut-dl-footer__lead flex min-w-0 flex-wrap items-center ${geometry.toolbarGap}`,
          undefined,
          ui.inner,
        )
      "
    >
      <slot
        name="selected-count"
        :selected="internals.selection.selectedCount.value"
        :total="total"
        :from="from"
        :to="to"
      >
        <span
          v-if="booting"
          class="nut-dl-skeleton nut-dl-footer__range-skeleton inline-block h-3 w-24 rounded"
          aria-hidden="true"
        />
        <span
          v-else
          :class="mergeDataListUiClass('nut-dl-footer__range tabular-nums', undefined, ui.summary)"
          role="status"
        >
          {{ summary }}
        </span>
      </slot>

      <slot
        v-if="!compact && !booting"
        name="page-size"
        :page-size="internals.pagination.pageSize.value"
        :options="internals.pagination.pageSizeOptions.value"
        :set-page-size="internals.pagination.setPageSize"
      >
        <label
          :class="
            mergeDataListUiClass(
              'nut-dl-footer__size inline-flex h-7 items-center gap-1 rounded-md pl-2.5 ring ring-inset ring-default',
              undefined,
              ui.pageSize,
            )
          "
        >
          <span class="nut-dl-footer__size-label whitespace-nowrap">{{
            t('table.footer.perPage')
          }}</span>
          <USelect
            v-bind="pageSizeProps"
            :model-value="internals.pagination.pageSize.value"
            :items="pageSizeItems"
            :aria-label="t('table.footer.perPage')"
            :ui="{
              base: mergeDataListUiClass(
                'nut-dl-footer__select h-7 bg-transparent pl-1 pr-6 text-highlighted font-medium ring-0 shadow-none focus-visible:ring-0',
                undefined,
                ui.button,
              ),
              trailing: 'pe-1.5',
              trailingIcon: 'size-3.5 text-dimmed',
            }"
            @update:model-value="internals.pagination.setPageSize(Number($event))"
          />
        </label>
      </slot>
    </div>

    <div
      :class="
        mergeDataListUiClass(
          `nut-dl-footer__pages ml-auto flex items-center ${geometry.toolbarGap}`,
          undefined,
          ui.pages,
        )
      "
    >
      <slot
        name="page-count"
        :current="internals.pagination.currentPage.value"
        :total="internals.pagination.totalPages.value"
      />

      <slot
        name="navigation"
        :state="internals.pagination.state.value"
        :set-page="internals.pagination.setPage"
        :next="internals.pagination.next"
        :previous="internals.pagination.previous"
      >
        <div
          v-if="compact && total > 0 && !booting"
          :class="
            mergeDataListUiClass(
              'nut-dl-pager nut-dl-pager--compact flex items-center gap-1.5',
              undefined,
              ui.controls,
            )
          "
        >
          <UButton
            color="neutral"
            variant="outline"
            :size="controlSize"
            icon="i-lucide-chevron-left"
            square
            :aria-label="t('table.footer.previousPage')"
            :disabled="!internals.pagination.canPreviousPage.value"
            :ui="{ base: mergeDataListUiClass('nut-dl-pager__btn', undefined, ui.button) }"
            @click="internals.pagination.previous()"
          />
          <span
            class="nut-dl-pager__of min-w-11 text-center text-[12.5px] font-semibold tabular-nums text-highlighted"
          >
            {{
              t('table.footer.pageOf', {
                current: formatCount(internals.pagination.currentPage.value),
                total: formatCount(internals.pagination.totalPages.value),
              })
            }}
          </span>
          <UButton
            color="neutral"
            variant="outline"
            :size="controlSize"
            icon="i-lucide-chevron-right"
            square
            :aria-label="t('table.footer.nextPage')"
            :disabled="!internals.pagination.canNextPage.value"
            :ui="{ base: mergeDataListUiClass('nut-dl-pager__btn', undefined, ui.button) }"
            @click="internals.pagination.next()"
          />
        </div>
        <UPagination
          v-else-if="internals.pagination.totalPages.value > 0 && total > 0 && !booting"
          v-bind="paginationProps"
          v-model:page="page"
          :total="total"
          :items-per-page="internals.pagination.pageSize.value"
          :ui="{
            root: mergeDataListUiClass('nut-dl-pager', undefined, ui.controls),
            list: 'gap-0.5',
            item: mergeDataListUiClass('nut-dl-pager__btn tabular-nums', undefined, ui.button),
            first: mergeDataListUiClass(
              `nut-dl-pager__btn ${controlProps.firstLast === false ? 'hidden' : ''}`,
              undefined,
              ui.button,
            ),
            prev: mergeDataListUiClass('nut-dl-pager__btn', undefined, ui.button),
            next: mergeDataListUiClass('nut-dl-pager__btn', undefined, ui.button),
            last: mergeDataListUiClass(
              `nut-dl-pager__btn ${controlProps.firstLast === false ? 'hidden' : ''}`,
              undefined,
              ui.button,
            ),
          }"
        />
      </slot>
    </div>
  </footer>
</template>
