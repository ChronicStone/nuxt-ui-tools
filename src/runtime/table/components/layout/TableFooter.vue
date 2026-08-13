<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListControlSize, DataListPaginationUi } from '../../types'
import { mergeDataListUiClass } from '../../utils'

const props = defineProps<{ size?: DataListControlSize; ui?: DataListPaginationUi }>()
const internals = useTableInternals()
const dataListUi = useDataListUi()
const { locale, t } = useUiToolsLocale()
const controlSize = computed(
  () => props.size ?? dataListUi.ui.value.pagination?.size ?? dataListUi.controlSize.value,
)
const ui = computed<DataListPaginationUi>(() => ({
  ...dataListUi.ui.value.pagination?.ui,
  ...props.ui,
}))

const pageSizeItems = computed(() =>
  internals.tableApi.pagination.pageSizeOptions.value.map((size: number) => [
    {
      label: t('table.footer.pageSizeOption', {
        count: formatCount(size),
      }),
      onSelect: () => internals.pagination.setPageSize(size),
    },
  ]),
)

function formatCount(value: number) {
  return new Intl.NumberFormat(locale.value.code).format(value)
}
</script>

<template>
  <footer
    v-if="internals.pagination.mode.value === 'offset'"
    :class="
      mergeDataListUiClass(
        'flex flex-col gap-3 px-4 py-3 text-sm text-muted sm:px-5 lg:flex-row lg:items-center lg:justify-between',
        undefined,
        ui.root,
      )
    "
  >
    <slot
      name="selected-count"
      :selected="internals.selection.selectedCount.value"
      :total="internals.pagination.rowCount.value ?? 0"
    >
      <div :class="ui.summary">
        {{
          t('table.footer.rowsSelected', {
            selected: formatCount(internals.selection.selectedCount.value),
            total: formatCount(internals.pagination.rowCount.value ?? 0),
          })
        }}
      </div>
    </slot>

    <div
      :class="
        mergeDataListUiClass(
          'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end',
          undefined,
          ui.inner,
        )
      "
    >
      <slot
        name="page-size"
        :page-size="internals.pagination.pageSize.value"
        :options="internals.pagination.pageSizeOptions.value"
        :set-page-size="internals.pagination.setPageSize"
      >
        <div :class="mergeDataListUiClass('flex items-center gap-3', undefined, ui.pageSize)">
          <span>{{ t('table.footer.rowsPerPage') }}</span>

          <UDropdownMenu
            :size="controlSize"
            :items="pageSizeItems"
            :content="{ align: 'end', side: 'top', sideOffset: 10 }"
          >
            <UButton
              color="neutral"
              variant="outline"
              :size="controlSize"
              :ui="{
                base: mergeDataListUiClass('min-w-20 justify-between', undefined, ui.button),
              }"
              :label="String(internals.pagination.pageSize.value)"
              trailing-icon="i-lucide-chevron-down"
            />
          </UDropdownMenu>
        </div>
      </slot>

      <div :class="mergeDataListUiClass('flex items-center gap-3', undefined, ui.pages)">
        <slot
          name="page-count"
          :current="internals.pagination.currentPage.value"
          :total="internals.pagination.totalPages.value"
        >
          <span>{{
            t('table.footer.page', {
              current: formatCount(internals.pagination.currentPage.value),
              total: formatCount(internals.pagination.totalPages.value),
            })
          }}</span>
        </slot>

        <slot
          name="navigation"
          :state="internals.pagination.state.value"
          :set-page="internals.pagination.setPage"
          :next="internals.pagination.next"
          :previous="internals.pagination.previous"
        >
          <div :class="mergeDataListUiClass('flex items-center gap-2', undefined, ui.controls)">
            <UButton
              color="neutral"
              variant="outline"
              :size="controlSize"
              icon="i-lucide-chevrons-left"
              :aria-label="t('table.footer.firstPage')"
              :title="t('table.footer.firstPage')"
              :disabled="!internals.pagination.canPreviousPage.value"
              :ui="{ base: ui.button }"
              @click="internals.pagination.setPage(1)"
            />
            <UButton
              color="neutral"
              variant="outline"
              :size="controlSize"
              icon="i-lucide-chevron-left"
              :aria-label="t('table.footer.previousPage')"
              :title="t('table.footer.previousPage')"
              :disabled="!internals.pagination.canPreviousPage.value"
              :ui="{ base: ui.button }"
              @click="internals.pagination.setPage(internals.pagination.currentPage.value - 1)"
            />
            <UButton
              color="neutral"
              variant="outline"
              :size="controlSize"
              icon="i-lucide-chevron-right"
              :aria-label="t('table.footer.nextPage')"
              :title="t('table.footer.nextPage')"
              :disabled="!internals.pagination.canNextPage.value"
              :ui="{ base: ui.button }"
              @click="internals.pagination.setPage(internals.pagination.currentPage.value + 1)"
            />
            <UButton
              color="neutral"
              variant="outline"
              :size="controlSize"
              icon="i-lucide-chevrons-right"
              :aria-label="t('table.footer.lastPage')"
              :title="t('table.footer.lastPage')"
              :disabled="!internals.pagination.canNextPage.value"
              :ui="{ base: ui.button }"
              @click="internals.pagination.setPage(internals.pagination.totalPages.value)"
            />
          </div>
        </slot>
      </div>
    </div>
  </footer>
</template>
