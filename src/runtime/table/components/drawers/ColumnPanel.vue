<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed, type VNodeChild } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { isNumber } from '../../../shared/utils/predicate'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type {
  DataListBadgeProps,
  DataListButtonProps,
  DataListCheckboxProps,
  DataListColumnPanelProps,
  DataListColumnPanelUi,
  DataListControlSize,
} from '../../types'
import {
  mergeDataListProps,
  mergeDataListUiClass,
  resolveDataListControlGeometry,
  resolveDataListPopoverContentClass,
} from '../../utils'

const props = defineProps<{
  size?: DataListControlSize
  ui?: DataListColumnPanelUi
  props?: DataListColumnPanelProps
}>()
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
const controlProps = computed<DataListColumnPanelProps>(() =>
  mergeDataListProps(dataListUi.ui.value.columnPanel?.props, props.props),
)
const triggerProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    {
      color: 'neutral',
      variant: 'outline',
      size: resolvedSize.value,
      icon: 'i-lucide-layers',
      label: t('table.controls.view'),
    },
    controlProps.value.trigger,
  ),
)
const countProps = computed(() =>
  controlProps.value.count === false
    ? null
    : mergeDataListProps<DataListBadgeProps>(
        { color: 'neutral', variant: 'subtle', size: resolvedSize.value },
        controlProps.value.count,
      ),
)
const searchable = computed(() => {
  const search = controlProps.value.search ?? 30
  return isNumber(search) ? configurableColumns.value.length > search : search
})
const checkboxProps = computed(() =>
  mergeDataListProps<DataListCheckboxProps>(
    { color: 'primary', size: 'sm' },
    controlProps.value.checkbox,
  ),
)
const resetProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    { color: 'neutral', variant: 'link', size: resolvedSize.value },
    controlProps.value.reset,
  ),
)
function isVisible(columnId: string) {
  return internals.tableColumns.tableState.value.columnVisibility?.[columnId] !== false
}
function isRequired(column: { required?: boolean; canHide?: boolean }) {
  return column.required === true || column.canHide === false
}
const visibleCount = computed(
  () =>
    configurableColumns.value.filter(
      (column) => internals.tableColumns.tableState.value.columnVisibility?.[column.id] !== false,
    ).length,
)

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
        v-bind="triggerProps"
        :ui="{ base: mergeDataListUiClass('nut-dl-colbtn', undefined, ui.trigger) }"
      >
        <template v-if="countProps" #trailing>
          <UBadge
            v-bind="countProps"
            :label="String(visibleCount)"
            :class="mergeDataListUiClass('nut-dl-colbtn__count tabular-nums', undefined, ui.count)"
          />
        </template>
      </UButton>
    </slot>

    <template #content>
      <div
        :class="mergeDataListUiClass('nut-dl-colpanel w-full min-w-0 max-w-full bg-default', undefined, ui.panel)"
      >
        <div
          :class="
            mergeDataListUiClass(
              'nut-dl-colpanel__title flex items-center gap-1 px-4 pt-3 pb-1 text-[11px] font-semibold tracking-[0.06em] text-dimmed uppercase',
              undefined,
              ui.title,
            )
          "
        >
          <span>{{ t('table.controls.view') }}</span>
          <span class="font-medium">
            · {{ t('table.controls.columnsCount', { visible: visibleCount, total: configurableColumns.length }) }}
          </span>
        </div>

        <div
          v-if="searchable"
          :class="mergeDataListUiClass(`px-2 pb-1`, undefined, ui.searchHeader)"
        >
          <UInput
            :model-value="internals.controls.columnsPanelSearch.value"
            @update:model-value="internals.controls.columnsPanelSearch.value = String($event ?? '')"
            size="sm"
            icon="i-lucide-search"
            :placeholder="t('table.controls.searchColumns')"
            color="neutral"
            variant="soft"
            :ui="{ root: mergeDataListUiClass('w-full', undefined, ui.search) }"
          />
        </div>

        <div
          :class="
            mergeDataListUiClass('nut-dl-colpanel__list grid max-h-80 gap-px overflow-y-auto px-2 py-1', undefined, ui.list)
          "
        >
          <template v-if="!internals.controls.columnsPanelSearch.value">
            <div
              v-for="column in pinnedLeft"
              :key="column.id"
              :class="mergeDataListUiClass('nut-dl-colpanel__row group/col flex h-8 items-center gap-2.5 rounded-md px-2 hover:bg-elevated', undefined, ui.row)"
            >
              <UCheckbox
                v-bind="checkboxProps"
                :model-value="isVisible(column.id)"
                :disabled="isRequired(column)"
                :aria-label="column.label"
                @update:model-value="toggleColumn(column.id)"
              />
              <button
                type="button"
                class="flex min-w-0 flex-1 items-center gap-2 text-left text-[13px]"
                :class="isRequired(column) ? 'text-dimmed' : 'text-highlighted'"
                :disabled="isRequired(column)"
                @click="toggleColumn(column.id)"
              >
                <span :class="mergeDataListUiClass('truncate', undefined, ui.label)">{{ column.label }}</span>
              </button>
              <UIcon name="i-lucide-pin" :class="mergeDataListUiClass('size-3.5 shrink-0 text-dimmed', undefined, ui.icon)" />
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
              :class="mergeDataListUiClass('grid gap-px', undefined, ui.section)"
            >
              <div
                v-for="column in draggableColumns"
                :key="column.id"
                :class="mergeDataListUiClass('nut-dl-colpanel__row group/col flex h-8 items-center gap-2.5 rounded-md px-2 hover:bg-elevated', undefined, ui.row)"
              >
                <UCheckbox
                  v-bind="checkboxProps"
                  :model-value="isVisible(column.id)"
                  :disabled="isRequired(column)"
                  :aria-label="column.label"
                  @update:model-value="toggleColumn(column.id)"
                />
                <button
                  type="button"
                  class="flex min-w-0 flex-1 items-center gap-2 text-left text-[13px] text-highlighted"
                  @click="toggleColumn(column.id)"
                >
                  <span :class="mergeDataListUiClass('truncate', undefined, ui.label)">{{ column.label }}</span>
                </button>
                <button
                  type="button"
                  :class="
                    mergeDataListUiClass(
                      'column-drag-handle flex size-6 cursor-grab items-center justify-center rounded-md text-dimmed opacity-0 transition-opacity group-hover/col:opacity-100 focus-visible:opacity-100 active:cursor-grabbing',
                      undefined,
                      ui.handle,
                    )
                  "
                  :aria-label="column.label"
                >
                  <UIcon name="i-lucide-grip-vertical" class="size-3.5" />
                </button>
              </div>
            </VueDraggable>

            <div
              v-for="column in pinnedRight"
              :key="column.id"
              :class="mergeDataListUiClass('nut-dl-colpanel__row group/col flex h-8 items-center gap-2.5 rounded-md px-2 hover:bg-elevated', undefined, ui.row)"
            >
              <UCheckbox
                v-bind="checkboxProps"
                :model-value="isVisible(column.id)"
                :disabled="isRequired(column)"
                :aria-label="column.label"
                @update:model-value="toggleColumn(column.id)"
              />
              <button
                type="button"
                class="flex min-w-0 flex-1 items-center gap-2 text-left text-[13px]"
                :class="isRequired(column) ? 'text-dimmed' : 'text-highlighted'"
                :disabled="isRequired(column)"
                @click="toggleColumn(column.id)"
              >
                <span :class="mergeDataListUiClass('truncate', undefined, ui.label)">{{ column.label }}</span>
              </button>
              <UIcon name="i-lucide-pin" :class="mergeDataListUiClass('size-3.5 shrink-0 text-dimmed', undefined, ui.icon)" />
            </div>
          </template>

          <template v-else>
            <div
              v-for="column in filteredColumns"
              :key="column.id"
              :class="mergeDataListUiClass('nut-dl-colpanel__row flex h-8 items-center gap-2.5 rounded-md px-2 hover:bg-elevated', undefined, ui.row)"
            >
              <UCheckbox
                v-bind="checkboxProps"
                :model-value="isVisible(column.id)"
                :disabled="isRequired(column)"
                :aria-label="column.label"
                @update:model-value="toggleColumn(column.id)"
              />
              <button
                type="button"
                class="flex min-w-0 flex-1 items-center gap-2 text-left text-[13px]"
                :class="isRequired(column) ? 'text-dimmed' : 'text-highlighted'"
                :disabled="isRequired(column)"
                @click="toggleColumn(column.id)"
              >
                <span :class="mergeDataListUiClass('truncate', undefined, ui.label)">{{ column.label }}</span>
              </button>
            </div>
            <div
              v-if="!filteredColumns.length"
              :class="mergeDataListUiClass('px-2 py-3 text-[12.5px] text-muted', undefined, ui.empty)"
            >
              {{ t('table.controls.noMatchingFilters') }}
            </div>
          </template>
        </div>

        <div
          :class="
            mergeDataListUiClass(
              'nut-dl-colpanel__footer flex items-center justify-between border-t border-default px-4 py-2.5 text-[12.5px]',
              undefined,
              ui.footer,
            )
          "
        >
          <UButton
            v-bind="resetProps"
            :label="t('table.controls.resetColumns')"
            :ui="{ base: mergeDataListUiClass('px-0 text-muted hover:text-default', undefined, ui.reset) }"
            @click="internals.tableColumns.reset()"
          />
          <button
            type="button"
            :class="mergeDataListUiClass('text-muted hover:text-default', undefined, ui.close)"
            @click="close"
          >
            {{ t('table.controls.close') }}
          </button>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
:deep(.column-panel-row-ghost) {
  opacity: 0.35;
}
:deep(.column-panel-row-dragging) {
  background-color: var(--ui-bg);
  box-shadow: 0 12px 28px rgb(31 29 26 / 0.14);
}
</style>
