<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

import { useTableInternals } from '../../composables/use-table-internals'

const internals = useTableInternals()

const filteredColumns = computed(() => {
  const search = internals.controls.columnsPanelSearch.value.trim().toLowerCase()

  if (!search) {
    return internals.tableColumns.orderedColumns.value
  }

  return internals.tableColumns.orderedColumns.value.filter((column: { label: string }) =>
    column.label.toLowerCase().includes(search),
  )
})

const draggableColumns = computed({
  get: () => internals.tableColumns.orderedColumns.value,
  set: (columns: Array<{ id: string }>) =>
    internals.tableColumns.setOrder(columns.map((column) => column.id)),
})

function toggleColumn(columnId: string) {
  const isVisible = internals.tableColumns.tableState.value.columnVisibility?.[columnId] !== false
  internals.tableColumns.setVisibility({ columnId, visible: !isVisible })
}
</script>

<template>
  <UPopover
    :open="internals.controls.columnsPanelOpen.value"
    @update:open="internals.controls.columnsPanelOpen.value = $event"
    mode="click"
    :content="{ side: 'bottom', align: 'end', sideOffset: 8 }"
    :ui="{
      content: 'w-[18rem] rounded-xl p-0 shadow-xl',
    }"
  >
    <UButton
      color="neutral"
      variant="outline"
      size="md"
      icon="i-lucide-sliders-horizontal"
      label="View"
      :ui="{ base: 'h-10 px-3' }"
    />

    <template #content>
      <div class="overflow-hidden rounded-xl border border-default bg-default">
        <UInput
          :model-value="internals.controls.columnsPanelSearch.value"
          @update:model-value="internals.controls.columnsPanelSearch.value = String($event ?? '')"
          size="sm"
          icon="i-lucide-search"
          placeholder="Search columns..."
          color="neutral"
          variant="ghost"
          class="w-full border-b border-default px-2.5 py-2"
          :ui="{
            base: 'h-8 ps-8',
            leading: 'start-2',
            leadingIcon: 'size-4 text-muted',
          }"
        />

        <div class="grid max-h-80 gap-1 overflow-y-auto p-2">
          <div
            v-if="!internals.controls.columnsPanelSearch.value && draggableColumns.length"
            class="grid gap-1"
          >
            <VueDraggable
              v-model="draggableColumns"
              item-key="id"
              handle=".column-drag-handle"
              ghost-class="opacity-60"
              class="grid gap-1"
            >
              <div
                v-for="column in draggableColumns"
                :key="column.id"
                class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-elevated/70"
              >
                <button
                  type="button"
                  class="column-drag-handle flex size-6 cursor-grab items-center justify-center rounded-md text-muted hover:bg-elevated active:cursor-grabbing"
                >
                  <UIcon name="i-lucide-grip" class="size-4" />
                </button>

                <button
                  type="button"
                  class="flex min-w-0 flex-1 items-center gap-3 text-left"
                  @click="toggleColumn(column.id)"
                >
                  <UIcon v-if="column.icon" :name="column.icon" class="size-4 text-muted" />
                  <span class="truncate text-default">{{ column.label }}</span>
                </button>

                <UIcon
                  :name="
                    internals.tableColumns.tableState.value.columnVisibility?.[column.id] === false
                      ? 'i-lucide-eye-off'
                      : 'i-lucide-check'
                  "
                  class="size-4 shrink-0"
                  :class="
                    internals.tableColumns.tableState.value.columnVisibility?.[column.id] === false
                      ? 'text-muted'
                      : 'text-default'
                  "
                />
              </div>
            </VueDraggable>
          </div>

          <div v-else class="grid gap-1">
            <button
              v-for="column in filteredColumns"
              :key="column.id"
              type="button"
              class="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-elevated/70"
              @click="toggleColumn(column.id)"
            >
              <div class="flex size-6 items-center justify-center rounded-md text-muted">
                <UIcon :name="column.icon ?? 'i-lucide-columns-3'" class="size-4" />
              </div>
              <span class="min-w-0 flex-1 truncate text-default">{{ column.label }}</span>
              <UIcon
                :name="
                  internals.tableColumns.tableState.value.columnVisibility?.[column.id] === false
                    ? 'i-lucide-eye-off'
                    : 'i-lucide-check'
                "
                class="size-4 shrink-0"
                :class="
                  internals.tableColumns.tableState.value.columnVisibility?.[column.id] === false
                    ? 'text-muted'
                    : 'text-default'
                "
              />
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between gap-3 border-t border-default px-3 py-2">
          <div class="text-xs text-muted">
            {{ internals.tableColumns.orderedColumns.value.length }} configurable columns
          </div>

          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-lucide-rotate-ccw"
            label="Reset"
            @click="internals.tableColumns.reset()"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
