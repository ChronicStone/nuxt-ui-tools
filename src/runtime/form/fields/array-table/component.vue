<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useScrollShadow } from '@nuxt/ui/composables/useScrollShadow'
import { computed, defineAsyncComponent, ref } from 'vue'

import FormFieldError from '../../components/renderer/form-field-error.vue'
import FormFieldRenderer from '../../components/renderer/form-field-renderer.vue'
import type { FormField, FormObject } from '../../types'
import { isRecord } from '../../utils/path'
import { isNumber, isString } from '../../utils/predicate'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'
import { useFormArrayItems } from '../array-list/use-array-items'
import type { FormArrayTableField } from './types'

const DEFAULT_COLUMN_MIN_WIDTH = '140px'

const props = defineProps<{
  field: FormArrayTableField
  path: readonly string[]
}>()

const VueDraggable = defineAsyncComponent(async () => {
  const { VueDraggable: draggableComponent } = await import('vue-draggable-plus')
  return draggableComponent
})

const {
  addItem,
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
const viewportRef = ref<HTMLElement | null>(null)
const viewportShadow = useScrollShadow(viewportRef, { orientation: 'horizontal', size: 20 })
const ui = computed(() => formUi.ui.value.arrayTable?.ui)
const columns = computed(() =>
  props.field.fields.filter((field) => field.type !== 'hidden' && field.ignore !== true),
)
const minWidth = computed(() =>
  isNumber(props.field.minWidth) ? `${props.field.minWidth}px` : props.field.minWidth,
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

function columnStyle(field: FormField) {
  const layout = Object.getOwnPropertyDescriptor(field, 'layout')?.value
  const width = isRecord(layout) ? layout.width : undefined
  const resolved = isNumber(width) ? `${width}px` : isString(width) ? width : undefined
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
            <tr
              v-for="(item, index) in items"
              :key="itemRenderKey(item, index)"
              :class="
                mergeFormUiClass(
                  'align-middle transition-colors hover:bg-elevated/35 [&>*]:border-b [&>*]:border-default [&:last-child>*]:border-b-0',
                  ui?.row,
                )
              "
            >
              <td
                v-for="column in columns"
                :key="column.key"
                :class="mergeFormUiClass('border-r border-default p-1.5 last:border-r-0', ui?.cell)"
              >
                <div
                  :class="mergeFormUiClass('flex w-full items-center [&>*]:w-full', ui?.control)"
                >
                  <FormFieldRenderer :field="column" :parent-path="itemPath(index)" bare />
                </div>
                <FormFieldError
                  :path="[...itemPath(index), column.key]"
                  :class="mergeFormUiClass('mt-1 px-2.5 text-xs text-error', ui?.error)"
                />
              </td>
              <td
                v-if="showActionsColumn"
                :class="
                  mergeFormUiClass(
                    'sticky right-0 whitespace-nowrap border-l border-default bg-default px-1.5 py-1.5 text-right shadow-[-8px_0_12px_-10px_rgba(0,0,0,0.45)]',
                    ui?.actionsCell,
                  )
                "
              >
                <UButton
                  v-if="isDraggable"
                  icon="i-lucide-grip-vertical"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :class="
                    mergeFormUiClass(
                      'array-table-drag-handle cursor-grab active:cursor-grabbing',
                      ui?.action,
                    )
                  "
                  :aria-label="t('form.fields.array.dragItem')"
                />
                <UButton
                  v-if="canDelete(index)"
                  icon="i-lucide-trash-2"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :class="ui?.action"
                  :aria-label="t('form.fields.array.removeItem')"
                  @click="removeItem(index)"
                />
                <UButton
                  v-for="(action, actionIndex) in field.actions?.custom ?? []"
                  v-show="customActionVisible(index, actionIndex)"
                  :key="actionIndex"
                  :icon="action.icon"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :class="ui?.action"
                  @click="runCustomAction(index, actionIndex)"
                >
                  {{ resolveFormText(action.label) }}
                </UButton>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td
                :colspan="columns.length + (showActionsColumn ? 1 : 0)"
                :class="mergeFormUiClass('px-3 py-10 text-center text-muted', ui?.empty)"
              >
                {{ emptyLabel }}
              </td>
            </tr>
          </component>
          <tfoot v-if="canAdd">
            <tr>
              <td
                :colspan="columns.length + (showActionsColumn ? 1 : 0)"
                :class="mergeFormUiClass('border-t border-default p-1.5', ui?.addCell)"
              >
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
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </section>
</template>
