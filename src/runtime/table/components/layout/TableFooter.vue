<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import { useTableInternals } from '../../composables/use-table-internals'

const internals = useTableInternals()
const { locale, t } = useUiToolsLocale()

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
    class="flex flex-col gap-3 px-4 py-3 text-sm text-muted sm:px-5 lg:flex-row lg:items-center lg:justify-between"
  >
    <div>
      {{ t('table.footer.rowsSelected', {
        selected: formatCount(internals.selection.selectedCount.value),
        total: formatCount(internals.pagination.rowCount.value),
      }) }}
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <div class="flex items-center gap-3">
        <span>{{ t('table.footer.rowsPerPage') }}</span>

        <UDropdownMenu
          :items="pageSizeItems"
          :content="{ align: 'end', side: 'top', sideOffset: 10 }"
        >
          <UButton
            color="neutral"
            variant="outline"
            size="md"
            class="min-w-20 justify-between"
            :label="String(internals.tableApi.pagination.state.value.pageSize)"
            trailing-icon="i-lucide-chevron-down"
          />
        </UDropdownMenu>
      </div>

      <div class="flex items-center gap-3">
        <span>{{
          t('table.footer.page', {
            current: formatCount(internals.pagination.currentPage.value),
            total: formatCount(internals.pagination.totalPages.value),
          })
        }}</span>

        <div class="flex items-center gap-2">
          <UButton
            color="neutral"
            variant="outline"
            size="md"
            icon="i-lucide-chevrons-left"
            :aria-label="t('table.footer.firstPage')"
            :title="t('table.footer.firstPage')"
            :disabled="!internals.pagination.canPreviousPage.value"
            @click="internals.pagination.setPage(1)"
          />
          <UButton
            color="neutral"
            variant="outline"
            size="md"
            icon="i-lucide-chevron-left"
            :aria-label="t('table.footer.previousPage')"
            :title="t('table.footer.previousPage')"
            :disabled="!internals.pagination.canPreviousPage.value"
            @click="internals.pagination.setPage(internals.pagination.currentPage.value - 1)"
          />
          <UButton
            color="neutral"
            variant="outline"
            size="md"
            icon="i-lucide-chevron-right"
            :aria-label="t('table.footer.nextPage')"
            :title="t('table.footer.nextPage')"
            :disabled="!internals.pagination.canNextPage.value"
            @click="internals.pagination.setPage(internals.pagination.currentPage.value + 1)"
          />
          <UButton
            color="neutral"
            variant="outline"
            size="md"
            icon="i-lucide-chevrons-right"
            :aria-label="t('table.footer.lastPage')"
            :title="t('table.footer.lastPage')"
            :disabled="!internals.pagination.canNextPage.value"
            @click="internals.pagination.setPage(internals.pagination.totalPages.value)"
          />
        </div>
      </div>
    </div>
  </footer>
</template>
