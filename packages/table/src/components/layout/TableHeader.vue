<script setup lang="ts">
import type { TableLayout } from '../../types'
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
        <div
          v-if="gridEnabled"
          class="inline-flex items-center gap-2"
        >
          <button
            type="button"
            class="inline-flex h-10 items-center rounded-lg border px-3 text-sm transition-colors"
            :class="tableLayout === 'table'
              ? 'border-default bg-elevated text-default shadow-xs'
              : 'border-default bg-default text-muted hover:bg-elevated/60 hover:text-default'"
            @click="emit('update:tableLayout', 'table')"
          >
            Table
          </button>
          <button
            type="button"
            class="inline-flex h-10 items-center rounded-lg border px-3 text-sm transition-colors"
            :class="tableLayout === 'grid'
              ? 'border-default bg-elevated text-default shadow-xs'
              : 'border-default bg-default text-muted hover:bg-elevated/60 hover:text-default'"
            @click="emit('update:tableLayout', 'grid')"
          >
            Grid
          </button>
        </div>

        <ColumnPanel />
      </div>
    </div>
  </header>
</template>
