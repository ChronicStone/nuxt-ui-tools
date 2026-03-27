<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

import { useUiToolsLocale } from '#ui-tools/i18n'
import { useTableInternals } from '../../composables/use-table-internals'

const internals = useTableInternals()
const { t } = useUiToolsLocale()
const configurableColumns = computed(() =>
  internals.tableColumns.orderedColumns.value.filter((column) => column.configurable !== false),
)

const pinnedLeft = computed(() => {
  const leftIds = internals.tableColumns.tableState.value.columnPinning?.left ?? []
  return configurableColumns.value.filter((col) => leftIds.includes(col.id))
})

const pinnedRight = computed(() => {
  const rightIds = internals.tableColumns.tableState.value.columnPinning?.right ?? []
  return configurableColumns.value.filter((col) => rightIds.includes(col.id))
})

const unpinnedColumns = computed(() => {
  const leftIds = internals.tableColumns.tableState.value.columnPinning?.left ?? []
  const rightIds = internals.tableColumns.tableState.value.columnPinning?.right ?? []
  return configurableColumns.value.filter(
    (col) => !leftIds.includes(col.id) && !rightIds.includes(col.id),
  )
})

const filteredColumns = computed(() => {
  const search = internals.controls.columnsPanelSearch.value.trim().toLowerCase()
  if (!search) return configurableColumns.value

  return configurableColumns.value.filter((column) =>
    column.label.toLowerCase().includes(search),
  )
})

const draggableColumns = computed({
  get: () => unpinnedColumns.value,
  set: (columns: Array<{ id: string }>) =>
    internals.tableColumns.setOrder({
      columnIds: [
        ...pinnedLeft.value.map((col) => col.id),
        ...columns.map((col) => col.id),
        ...pinnedRight.value.map((col) => col.id),
      ],
    }),
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
    :ui="{ content: 'w-fit overflow-hidden p-0 shadow-none' }"
  >
    <UButton
      color="neutral"
      variant="outline"
      size="md"
      icon="i-lucide-sliders-horizontal"
      :label="t('table.controls.view')"
    />

    <template #content>
      <div class="w-fit max-w-[calc(100vw-1rem)] bg-default">
        <div class="border-b border-default p-2">
          <UInput
            :model-value="internals.controls.columnsPanelSearch.value"
            @update:model-value="internals.controls.columnsPanelSearch.value = String($event ?? '')"
            size="sm"
            icon="i-lucide-search"
            :placeholder="t('table.controls.searchColumns')"
            color="neutral"
            variant="ghost"
            class="w-full"
          />
        </div>

        <div class="grid max-h-80 gap-1 overflow-y-auto p-2">
          <div v-if="!internals.controls.columnsPanelSearch.value" class="grid gap-0.5">
            <div
              v-for="column in pinnedLeft"
              :key="column.id"
              class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-elevated/70"
            >
              <div class="flex size-6 items-center justify-center rounded-md text-muted">
                <UIcon name="i-lucide-pin" class="size-4" />
              </div>
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

            <VueDraggable
              v-if="draggableColumns.length"
              v-model="draggableColumns"
              item-key="id"
              handle=".column-drag-handle"
              :animation="180"
              easing="cubic-bezier(0.22, 1, 0.36, 1)"
              ghost-class="column-panel-row-ghost"
              chosen-class="column-panel-row-chosen"
              drag-class="column-panel-row-dragging"
              class="grid gap-0.5"
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

            <div
              v-for="column in pinnedRight"
              :key="column.id"
              class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-elevated/70"
            >
              <div class="flex size-6 items-center justify-center rounded-md text-muted">
                <UIcon name="i-lucide-pin" class="size-4" />
              </div>
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
          </div>

          <div v-else class="grid gap-0.5">
            <button
              v-for="column in filteredColumns"
              :key="column.id"
              type="button"
              class="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-elevated/70"
              @click="toggleColumn(column.id)"
            >
              <div class="flex size-6 items-center justify-center rounded-md text-muted">
                <UIcon
                  :name="
                    internals.tableColumns.getPinnedState({ columnId: column.id })
                      ? 'i-lucide-pin'
                      : (column.icon ?? 'i-lucide-columns-3')
                  "
                  class="size-4"
                />
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
          <div class="text-sm text-muted">
            {{ t('table.controls.configurableColumns', { count: configurableColumns.length }) }}
          </div>

          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-lucide-rotate-ccw"
            :label="t('table.controls.resetColumns')"
            @click="internals.tableColumns.reset()"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
:deep(.column-panel-row-ghost) {
  opacity: 0.35;
  background-color: rgb(var(--ui-bg-elevated) / 0.55);
}

:deep(.column-panel-row-chosen) {
  background-color: rgb(var(--ui-bg-elevated) / 0.8);
}

:deep(.column-panel-row-dragging) {
  opacity: 1;
  background-color: rgb(var(--ui-bg-default));
  box-shadow:
    0 12px 28px rgb(15 23 42 / 0.14),
    0 2px 6px rgb(15 23 42 / 0.08);
}
</style>
