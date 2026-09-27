<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useScrollShadow } from '@nuxt/ui/composables/useScrollShadow'
import { useElementSize } from '@vueuse/core'
import { computed, defineAsyncComponent, ref, shallowRef, watch } from 'vue'
import type { Ref } from 'vue'

import { useResolvedFieldProps } from '../../composables/use-field-control'
import type { FormField, FormObject } from '../../types'
import { isRecord } from '../../utils/path'
import { isNumber, isString } from '../../utils/predicate'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'
import type { FormArrayCustomAction } from '../array-list/types'
import { useFormArrayItems } from '../array-list/use-array-items'
import ArrayTableRow from './array-table-row.vue'
import type { FormArrayTableField } from './types'

const DEFAULT_COLUMN_MIN_WIDTH = '140px'
const ACTION_BUTTON_WIDTH = 24
const ACTIONS_CELL_INSET = 14

const props = defineProps<{
  field: FormArrayTableField
  path: readonly string[]
}>()

const fieldProps = useResolvedFieldProps(
  () => props.field,
  () => props.path,
)

const VueDraggable = defineAsyncComponent(async () => {
  const { VueDraggable: draggableComponent } = await import('vue-draggable-plus')
  return draggableComponent
})

const {
  addItem,
  form,
  addItemLabel,
  canAdd,
  canDelete,
  customActionVisible,
  description,
  emptyLabel,
  formUi,
  hasCustomActions,
  isDraggable,
  itemPath,
  itemRenderKey,
  items,
  removeItem,
  runCustomAction,
  t,
  title,
  updateItems,
} = useFormArrayItems(
  () => props.field,
  () => props.path,
)
const DEFAULT_ROW_HEIGHT = 45

/**
 * Rows claim render slots from the form scheduler in order, so a long table paints the rows on
 * screen at once and fills in the rest over the next frames while a spacer holds its height. A
 * pending row sits in the spacer, one estimated row height after the previous one. A draggable
 * table renders every row, since sorting reads the whole list from the DOM.
 */
const rowSlots = shallowRef<readonly Ref<boolean>[]>([])
const rowHeight = ref<number>(DEFAULT_ROW_HEIGHT)
const spacer = ref<HTMLElement | null>(null)

function pendingRowTop(index: number) {
  const node = spacer.value
  if (!node || node.getClientRects().length === 0) {
    return undefined
  }
  return node.getBoundingClientRect().top + (index - readyRows.value) * rowHeight.value
}

watch(
  () => items.value.length,
  (length) => {
    const current = rowSlots.value
    if (length <= current.length) {
      rowSlots.value = current.slice(0, length)
      return
    }
    const weight = Math.max(1, props.field.fields.length)
    const added = Array.from({ length: length - current.length }, (_, offset) =>
      isDraggable.value
        ? ref<boolean>(true)
        : form.render.claim(weight, () => pendingRowTop(current.length + offset)),
    )
    rowSlots.value = [...current, ...added]
  },
  { immediate: true },
)

const readyRows = computed(() => {
  const index = rowSlots.value.findIndex((slot) => !slot.value)
  return index === -1 ? items.value.length : index
})
const renderedItems = computed(() => items.value.slice(0, readyRows.value))
const pendingRows = computed(() => items.value.length - readyRows.value)

watch(readyRows, (count, previous) => {
  if (previous || !count) {
    return
  }
  requestAnimationFrame(() => {
    const row = viewportRef.value?.querySelector<HTMLElement>('tbody > tr')
    if (row && row.offsetHeight > 0) {
      rowHeight.value = row.offsetHeight
    }
  })
})

const NO_CUSTOM_ACTIONS: readonly FormArrayCustomAction[] = []
const customActions = computed(() => props.field.actions?.custom ?? NO_CUSTOM_ACTIONS)
const dragLabel = computed(() => t('form.fields.array.dragItem'))
const removeLabel = computed(() => t('form.fields.array.removeItem'))

const viewportRef = ref<HTMLElement | null>(null)
const viewportShadow = useScrollShadow(viewportRef, { orientation: 'horizontal', size: 20 })
const { width: viewportWidth } = useElementSize(viewportRef)
const ui = computed(() => formUi.ui.value.arrayTable?.ui)
const columns = computed(() =>
  props.field.fields.filter((field) => field.type !== 'hidden' && field.ignore !== true),
)
const minWidth = computed(() =>
  isNumber(fieldProps.value.minWidth)
    ? `${fieldProps.value.minWidth}px`
    : fieldProps.value.minWidth,
)
const dragItems = computed<FormObject[]>({
  get: () => [...items.value],
  set: updateItems,
})
const showActionsColumn = computed<boolean>(() =>
  items.value.some(
    (_item, index) => isDraggable.value || canDelete(index) || hasCustomActions(index),
  ),
)
/** Keeps the empty state and the add button in view when the table is wider than its frame. */
const pinnedStyle = computed(() =>
  viewportWidth.value > 0 ? { width: `${viewportWidth.value}px` } : undefined,
)
/** Room for the most buttons a row shows, so a fixed table layout never clips them. */
const actionsStyle = computed(() => {
  const buttons = Math.max(0, ...items.value.map((_item, index) => rowActionCount(index)))
  return buttons ? { width: `${buttons * ACTION_BUTTON_WIDTH + ACTIONS_CELL_INSET}px` } : undefined
})

function rowActionCount(index: number) {
  const custom = (props.field.actions?.custom ?? []).filter((_action, actionIndex) =>
    customActionVisible(index, actionIndex),
  )
  return Number(isDraggable.value) + Number(canDelete(index)) + custom.length
}

function columnStyle(field: FormField) {
  const layout = Object.getOwnPropertyDescriptor(field, 'layout')?.value
  const width = isRecord(layout) ? layout.width : undefined
  let resolved: string | undefined
  if (isNumber(width)) {
    resolved = `${width}px`
  } else if (isString(width)) {
    resolved = width
  }
  return { minWidth: resolved ?? DEFAULT_COLUMN_MIN_WIDTH, width: resolved }
}

function fieldLabel(field: FormField) {
  return 'label' in field ? (resolveFormText(field.label) ?? field.key) : field.key
}
</script>

<template>
  <section :class="mergeFormUiClass('grid gap-3', ui?.root)">
    <div v-if="title || description" :class="mergeFormUiClass('grid gap-1', ui?.header)">
      <h3 v-if="title" :class="mergeFormUiClass('text-sm font-medium text-highlighted', ui?.title)">
        {{ title }}
      </h3>
      <p v-if="description" :class="mergeFormUiClass('text-sm text-muted', ui?.description)">
        {{ description }}
      </p>
    </div>
    <div
      :class="
        mergeFormUiClass(
          'w-full overflow-hidden rounded-lg border border-default bg-default',
          ui?.frame,
        )
      "
    >
      <div
        ref="viewportRef"
        :class="mergeFormUiClass('w-full overflow-x-auto', ui?.viewport)"
        :style="viewportShadow.style.value"
      >
        <table
          :class="mergeFormUiClass('w-full table-auto border-collapse text-sm', ui?.table)"
          :style="{ minWidth }"
        >
          <thead :class="mergeFormUiClass('bg-elevated/70 text-left text-muted', ui?.head)">
            <tr :class="ui?.headerRow">
              <th
                v-for="column in columns"
                :key="column.key"
                scope="col"
                :style="columnStyle(column)"
                :class="
                  mergeFormUiClass(
                    'border-b border-r border-default px-4 py-2 font-medium last:border-r-0',
                    ui?.headerCell,
                  )
                "
              >
                {{ fieldLabel(column) }}
              </th>
              <th
                v-if="showActionsColumn"
                scope="col"
                :style="actionsStyle"
                :class="
                  mergeFormUiClass(
                    'sticky right-0 w-px border-b border-l border-default bg-elevated px-1.5 py-2 shadow-[-8px_0_12px_-10px_rgba(0,0,0,0.45)]',
                    ui?.actionsHeader,
                  )
                "
              />
            </tr>
          </thead>
          <component
            :is="isDraggable ? VueDraggable : 'tbody'"
            v-model="dragItems"
            :tag="isDraggable ? 'tbody' : undefined"
            :class="ui?.body"
            handle=".array-table-drag-handle"
            :animation="150"
          >
            <ArrayTableRow
              v-for="(item, index) in renderedItems"
              :key="itemRenderKey(item, index)"
              :index="index"
              :item-path="itemPath(index)"
              :columns="columns"
              :actions="showActionsColumn"
              :draggable="isDraggable"
              :can-delete="canDelete"
              :custom-actions="customActions"
              :custom-visible="customActionVisible"
              :ui="ui"
              :drag-label="dragLabel"
              :remove-label="removeLabel"
              @remove="removeItem"
              @custom="runCustomAction"
            />
            <tr v-if="pendingRows > 0" ref="spacer" aria-hidden="true" data-form-array-pending="">
              <td
                :colspan="columns.length + (showActionsColumn ? 1 : 0)"
                class="p-0"
                :style="{ height: `${pendingRows * rowHeight}px` }"
              />
            </tr>
            <tr v-if="items.length === 0">
              <td :colspan="columns.length + (showActionsColumn ? 1 : 0)" class="p-0">
                <div
                  :class="
                    mergeFormUiClass('sticky left-0 px-3 py-10 text-center text-muted', ui?.empty)
                  "
                  :style="pinnedStyle"
                  data-form-array-empty=""
                >
                  {{ emptyLabel }}
                </div>
              </td>
            </tr>
          </component>
          <tfoot v-if="canAdd">
            <tr>
              <td
                :colspan="columns.length + (showActionsColumn ? 1 : 0)"
                :class="mergeFormUiClass('border-t border-default p-0', ui?.addCell)"
              >
                <div class="sticky left-0 p-1.5" :style="pinnedStyle">
                  <button
                    type="button"
                    :class="
                      mergeFormUiClass(
                        'flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-default px-3 py-2 text-sm text-muted transition-colors hover:border-inverted/40 hover:bg-elevated/50 hover:text-default focus-visible:outline-2 focus-visible:outline-primary',
                        ui?.add,
                      )
                    "
                    :data-form-array-add="path.join('.')"
                    @click="addItem()"
                  >
                    <UIcon name="i-lucide-plus" class="size-4" aria-hidden="true" />
                    <span>{{ addItemLabel }}</span>
                  </button>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </section>
</template>
