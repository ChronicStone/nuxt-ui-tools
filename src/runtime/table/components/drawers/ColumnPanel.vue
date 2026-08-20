<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed, type VNodeChild } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListColumnPanelUi, DataListControlSize } from '../../types'
import {
  mergeDataListUiClass,
  resolveDataListControlGeometry,
  resolveDataListPopoverContentClass,
} from '../../utils'

const props = defineProps<{ size?: DataListControlSize; ui?: DataListColumnPanelUi }>()
const internals = useTableInternals()
const dataListUi = useDataListUi()
const { t } = useUiToolsLocale()
const ui = computed<DataListColumnPanelUi>(() => ({
  ...dataListUi.ui.value.columnPanel?.ui,
  ...props.ui,
}))
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.columnPanel?.size ?? dataListUi.controlSize.value,
)
const geometry = computed(() => resolveDataListControlGeometry(resolvedSize.value))

defineSlots<{
  trigger?: (props: {
    open: () => void
    close: () => void
    toggle: () => void
    openState: boolean
    triggerProps: { type: 'button'; 'aria-expanded': boolean }
  }) => VNodeChild
}>()
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

  return configurableColumns.value.filter((column) => column.label.toLowerCase().includes(search))
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

function open() {
  internals.controls.columnsPanelOpen.value = true
}

function close() {
  internals.controls.columnsPanelOpen.value = false
}

function toggle() {
  internals.controls.columnsPanelOpen.value = !internals.controls.columnsPanelOpen.value
}
</script>

<template>
  <UPopover
    :open="internals.controls.columnsPanelOpen.value"
    @update:open="internals.controls.columnsPanelOpen.value = $event"
    mode="click"
    :content="{ side: 'bottom', align: 'end', sideOffset: 8 }"
    :ui="{
      content: mergeDataListUiClass(
        resolveDataListPopoverContentClass('independent', 'p-0 shadow-none'),
        undefined,
        ui.popoverContent,
      ),
    }"
  >
    <slot
      name="trigger"
      :open="open"
      :close="close"
      :toggle="toggle"
      :open-state="internals.controls.columnsPanelOpen.value"
      :trigger-props="{
        type: 'button',
        'aria-expanded': internals.controls.columnsPanelOpen.value,
      }"
    >
      <UButton
        color="neutral"
        variant="outline"
        :size="resolvedSize"
        icon="i-lucide-sliders-horizontal"
        :label="t('table.controls.view')"
        :ui="{ base: ui.trigger }"
      />
    </slot>

    <template #content>
      <div
        :class="mergeDataListUiClass('w-full min-w-0 max-w-full bg-default', undefined, ui.panel)"
      >
        <div
          :class="
            mergeDataListUiClass(
              `border-b border-default ${geometry.panelPadding}`,
              undefined,
              ui.searchHeader,
            )
          "
        >
          <UInput
            :model-value="internals.controls.columnsPanelSearch.value"
            @update:model-value="internals.controls.columnsPanelSearch.value = String($event ?? '')"
            :size="resolvedSize"
            icon="i-lucide-search"
            :placeholder="t('table.controls.searchColumns')"
            color="neutral"
            variant="ghost"
            :ui="{ root: mergeDataListUiClass('w-full', undefined, ui.search) }"
          />
        </div>

        <div
          :class="
            mergeDataListUiClass(
              `grid max-h-80 gap-1 overflow-y-auto ${geometry.listPadding}`,
              undefined,
              ui.list,
            )
          "
        >
          <div
            v-if="!internals.controls.columnsPanelSearch.value"
            :class="mergeDataListUiClass('grid gap-0.5', undefined, ui.section)"
          >
            <div
              v-for="column in pinnedLeft"
              :key="column.id"
              :class="
                mergeDataListUiClass(
                  `flex items-center rounded-md transition-colors hover:bg-elevated/70 ${geometry.row}`,
                  undefined,
                  ui.row,
                )
              "
            >
              <div
                :class="
                  mergeDataListUiClass(
                    'flex size-6 items-center justify-center rounded-md text-muted',
                    undefined,
                    ui.icon,
                  )
                "
              >
                <UIcon name="i-lucide-pin" class="size-4" />
              </div>
              <button
                type="button"
                class="flex min-w-0 flex-1 items-center gap-3 text-left"
                @click="toggleColumn(column.id)"
              >
                <UIcon v-if="column.icon" :name="column.icon" class="size-4 text-muted" />
                <span :class="mergeDataListUiClass('truncate text-default', undefined, ui.label)">{{
                  column.label
                }}</span>
              </button>
              <UIcon
                :name="
                  internals.tableColumns.tableState.value.columnVisibility?.[column.id] === false
                    ? 'i-lucide-eye-off'
                    : 'i-lucide-check'
                "
                class="size-4 shrink-0"
                :class="
                  mergeDataListUiClass(
                    internals.tableColumns.tableState.value.columnVisibility?.[column.id] === false
                      ? 'text-muted'
                      : 'text-default',
                    undefined,
                    ui.stateIcon,
                  )
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
              :class="mergeDataListUiClass('grid gap-0.5', undefined, ui.section)"
            >
              <div
                v-for="column in draggableColumns"
                :key="column.id"
                :class="
                  mergeDataListUiClass(
                    `flex items-center rounded-md transition-colors hover:bg-elevated/70 ${geometry.row}`,
                    undefined,
                    ui.row,
                  )
                "
              >
                <button
                  type="button"
                  :class="
                    mergeDataListUiClass(
                      'column-drag-handle flex size-6 cursor-grab items-center justify-center rounded-md text-muted hover:bg-elevated active:cursor-grabbing',
                      undefined,
                      ui.handle,
                    )
                  "
                >
                  <UIcon name="i-lucide-grip" class="size-4" />
                </button>

                <button
                  type="button"
                  class="flex min-w-0 flex-1 items-center gap-3 text-left"
                  @click="toggleColumn(column.id)"
                >
                  <UIcon v-if="column.icon" :name="column.icon" class="size-4 text-muted" />
                  <span
                    :class="mergeDataListUiClass('truncate text-default', undefined, ui.label)"
                    >{{ column.label }}</span
                  >
                </button>

                <UIcon
                  :name="
                    internals.tableColumns.tableState.value.columnVisibility?.[column.id] === false
                      ? 'i-lucide-eye-off'
                      : 'i-lucide-check'
                  "
                  class="size-4 shrink-0"
                  :class="
                    mergeDataListUiClass(
                      internals.tableColumns.tableState.value.columnVisibility?.[column.id] ===
                        false
                        ? 'text-muted'
                        : 'text-default',
                      undefined,
                      ui.stateIcon,
                    )
                  "
                />
              </div>
            </VueDraggable>

            <div
              v-for="column in pinnedRight"
              :key="column.id"
              :class="
                mergeDataListUiClass(
                  `flex items-center rounded-md transition-colors hover:bg-elevated/70 ${geometry.row}`,
                  undefined,
                  ui.row,
                )
              "
            >
              <div
                :class="
                  mergeDataListUiClass(
                    'flex size-6 items-center justify-center rounded-md text-muted',
                    undefined,
                    ui.icon,
                  )
                "
              >
                <UIcon name="i-lucide-pin" class="size-4" />
              </div>
              <button
                type="button"
                class="flex min-w-0 flex-1 items-center gap-3 text-left"
                @click="toggleColumn(column.id)"
              >
                <UIcon v-if="column.icon" :name="column.icon" class="size-4 text-muted" />
                <span :class="mergeDataListUiClass('truncate text-default', undefined, ui.label)">{{
                  column.label
                }}</span>
              </button>
              <UIcon
                :name="
                  internals.tableColumns.tableState.value.columnVisibility?.[column.id] === false
                    ? 'i-lucide-eye-off'
                    : 'i-lucide-check'
                "
                class="size-4 shrink-0"
                :class="
                  mergeDataListUiClass(
                    internals.tableColumns.tableState.value.columnVisibility?.[column.id] === false
                      ? 'text-muted'
                      : 'text-default',
                    undefined,
                    ui.stateIcon,
                  )
                "
              />
            </div>
          </div>

          <div v-else :class="mergeDataListUiClass('grid gap-0.5', undefined, ui.section)">
            <button
              v-for="column in filteredColumns"
              :key="column.id"
              type="button"
              :class="
                mergeDataListUiClass(
                  `flex items-center rounded-md text-left transition-colors hover:bg-elevated/70 ${geometry.row}`,
                  undefined,
                  ui.row,
                )
              "
              @click="toggleColumn(column.id)"
            >
              <div
                :class="
                  mergeDataListUiClass(
                    'flex size-6 items-center justify-center rounded-md text-muted',
                    undefined,
                    ui.icon,
                  )
                "
              >
                <UIcon
                  :name="
                    internals.tableColumns.getPinnedState({ columnId: column.id })
                      ? 'i-lucide-pin'
                      : (column.icon ?? 'i-lucide-columns-3')
                  "
                  class="size-4"
                />
              </div>
              <span
                :class="
                  mergeDataListUiClass('min-w-0 flex-1 truncate text-default', undefined, ui.label)
                "
                >{{ column.label }}</span
              >
              <UIcon
                :name="
                  internals.tableColumns.tableState.value.columnVisibility?.[column.id] === false
                    ? 'i-lucide-eye-off'
                    : 'i-lucide-check'
                "
                class="size-4 shrink-0"
                :class="
                  mergeDataListUiClass(
                    internals.tableColumns.tableState.value.columnVisibility?.[column.id] === false
                      ? 'text-muted'
                      : 'text-default',
                    undefined,
                    ui.stateIcon,
                  )
                "
              />
            </button>
          </div>
        </div>

        <div
          :class="
            mergeDataListUiClass(
              `flex items-center justify-between border-t border-default ${geometry.footer}`,
              undefined,
              ui.footer,
            )
          "
        >
          <div
            :class="mergeDataListUiClass(`${geometry.text} text-muted`, undefined, ui.footerSummary)"
          >
            {{ t('table.controls.configurableColumns', { count: configurableColumns.length }) }}
          </div>

          <UButton
            color="neutral"
            variant="ghost"
            :size="resolvedSize"
            icon="i-lucide-rotate-ccw"
            :label="t('table.controls.resetColumns')"
            :ui="{ base: ui.reset }"
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
