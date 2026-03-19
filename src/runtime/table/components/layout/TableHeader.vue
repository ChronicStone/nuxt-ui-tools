<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UFieldGroup from '@nuxt/ui/components/FieldGroup.vue'

import type { TableLayout } from '../../types'
import ColumnPanel from '../drawers/ColumnPanel.vue'
import TableFiltersBar from '../filters/tags/FilterTagsBar.vue'
import SearchQueryInput from '../utils/SearchQueryInput.vue'

defineProps<{
  title?: string
  description?: string
  searchPlaceholder: string
  searchLoading: boolean
  gridEnabled: boolean
}>()
const searchQuery = defineModel<string>('searchQuery', { required: true })
const tableLayout = defineModel<TableLayout>('tableLayout', { required: true })

defineSlots<{
  title?: () => any
  actions?: () => any
}>()
</script>

<template>
  <header class="grid gap-3">
    <div v-if="$slots.title || title || description" class="grid gap-1">
      <slot name="title">
        <h2 class="text-lg font-semibold tracking-tight text-highlighted">
          {{ title }}
        </h2>
      </slot>
      <p v-if="description" class="text-sm text-muted">
        {{ description }}
      </p>
    </div>

    <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <SearchQueryInput
          v-model="searchQuery"
          :loading="searchLoading"
          :placeholder="searchPlaceholder"
        />

        <TableFiltersBar />

        <slot name="actions" />
      </div>

      <div class="flex shrink-0 self-start items-start justify-end gap-2">
        <UFieldGroup v-if="gridEnabled" size="md" class="shrink-0">
          <UButton
            color="neutral"
            :variant="tableLayout === 'table' ? 'subtle' : 'outline'"
            size="md"
            icon="i-lucide-table-properties"
            aria-label="Table view"
            title="Table view"
            @click="tableLayout = 'table'"
          />
          <UButton
            color="neutral"
            :variant="tableLayout === 'grid' ? 'subtle' : 'outline'"
            size="md"
            icon="i-lucide-layout-grid"
            aria-label="Grid view"
            title="Grid view"
            @click="tableLayout = 'grid'"
          />
        </UFieldGroup>

        <ColumnPanel />
      </div>
    </div>
  </header>
</template>
