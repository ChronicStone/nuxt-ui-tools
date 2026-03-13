<script setup lang="ts">
import { computed } from 'vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'

import { useTableInternals } from '../../composables/use-table-internals'

const internals = useTableInternals()

const pageSizeItems = computed(() =>
  internals.tableApi.pageSizeOptions.value.map((size: number) => [
    {
      label: `${size} rows`,
      onSelect: () => internals.pagination.setPageSize(size),
    },
  ]),
)

const groupedNumberFormatter = new Intl.NumberFormat('fr-FR')

function formatCount(value: number) {
  return groupedNumberFormatter.format(value)
}
</script>

<template>
  <footer class="flex flex-col gap-3 px-4 py-3 text-sm text-muted sm:px-5 lg:flex-row lg:items-center lg:justify-between">
    <div>
      {{ formatCount(internals.selection.selectedCount.value) }} of
      {{ formatCount(internals.queryContent.data.value.rowCount) }} row(s) selected.
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <div class="flex items-center gap-3">
        <span>Rows per page</span>

        <UDropdownMenu :items="pageSizeItems" :content="{ align: 'end', side: 'top', sideOffset: 10 }">
          <UButton
            color="neutral"
            variant="outline"
            size="md"
            class="min-w-20 justify-between"
            :label="String(internals.pagination.pageSize.value)"
            trailing-icon="i-lucide-chevron-down"
          />
        </UDropdownMenu>
      </div>

      <div class="flex items-center gap-3">
        <span>Page {{ internals.pagination.currentPage.value }} of {{ internals.pagination.totalPages.value }}</span>

        <div class="flex items-center gap-2">
          <UButton
            color="neutral"
            variant="outline"
            size="md"
            icon="i-lucide-chevrons-left"
            :disabled="!internals.pagination.canPreviousPage.value"
            @click="internals.pagination.setPage(1)"
          />
          <UButton
            color="neutral"
            variant="outline"
            size="md"
            icon="i-lucide-chevron-left"
            :disabled="!internals.pagination.canPreviousPage.value"
            @click="internals.pagination.setPage(internals.pagination.currentPage.value - 1)"
          />
          <UButton
            color="neutral"
            variant="outline"
            size="md"
            icon="i-lucide-chevron-right"
            :disabled="!internals.pagination.canNextPage.value"
            @click="internals.pagination.setPage(internals.pagination.currentPage.value + 1)"
          />
          <UButton
            color="neutral"
            variant="outline"
            size="md"
            icon="i-lucide-chevrons-right"
            :disabled="!internals.pagination.canNextPage.value"
            @click="internals.pagination.setPage(internals.pagination.totalPages.value)"
          />
        </div>
      </div>
    </div>
  </footer>
</template>
