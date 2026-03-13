<script setup lang="ts">
import type { TableLayout } from '../../types'
import UButton from '@nuxt/ui/components/Button.vue'
import UFieldGroup from '@nuxt/ui/components/FieldGroup.vue'
import ColumnPanel from '../drawers/ColumnPanel.vue'
import SearchQueryInput from '../utils/SearchQueryInput.vue'

defineProps<{
  title?: string
  description?: string
  searchPlaceholder: string
  searchLoading: boolean
  searchQuery: string
  tableLayout: TableLayout
  gridEnabled: boolean
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:tableLayout': [value: TableLayout]
}>()

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

    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <SearchQueryInput
          :model-value="searchQuery"
          :loading="searchLoading"
          :placeholder="searchPlaceholder"
          @update:model-value="emit('update:searchQuery', $event)"
        />

        <slot name="actions" />
      </div>

      <div class="flex items-center justify-end gap-2">
        <UFieldGroup
          v-if="gridEnabled"
          size="md"
          class="shrink-0"
        >
          <UButton
            color="neutral"
            :variant="tableLayout === 'table' ? 'subtle' : 'outline'"
            size="md"
            icon="i-lucide-table-properties"
            :ui="{ base: 'h-10 w-10 justify-center' }"
            aria-label="Table view"
            title="Table view"
            @click="emit('update:tableLayout', 'table')"
          />
          <UButton
            color="neutral"
            :variant="tableLayout === 'grid' ? 'subtle' : 'outline'"
            size="md"
            icon="i-lucide-layout-grid"
            :ui="{ base: 'h-10 w-10 justify-center' }"
            aria-label="Grid view"
            title="Grid view"
            @click="emit('update:tableLayout', 'grid')"
          />
        </UFieldGroup>

        <ColumnPanel />
      </div>
    </div>
  </header>
</template>
