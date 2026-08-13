<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed, defineAsyncComponent } from 'vue'

import FormFieldRenderer from '../../components/renderer/FormFieldRenderer.vue'
import { useFormRuntimeContext } from '../../composables/use-form-runtime'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormObject } from '../../types'
import type { FormField } from '../../types'
import { syncFormArrayItems } from '../../utils/array'
import { buildInitialFormFieldsState } from '../../utils/state'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'
import type { FormArrayActionCondition } from '../array-list/types'
import type { FormArrayTableField } from './types'

const props = defineProps<{
  field: FormArrayTableField
  path: readonly string[]
}>()

const VueDraggable = defineAsyncComponent(() =>
  import('vue-draggable-plus').then(({ VueDraggable: draggableComponent }) => draggableComponent),
)

const form = useFormRuntimeContext()
const formUi = useFormUi()
const itemKeys = new WeakMap<FormObject, string>()
let nextItemKey = 0
const items = computed<readonly FormObject[]>(() => {
  const value = form.getValue(props.path)
  return Array.isArray(value) ? value.filter(isFormObject) : []
})
const columns = computed(() =>
  props.field.fields.filter((field) => field.type !== 'hidden' && field.ignore !== true),
)
const minWidth = computed(() =>
  typeof props.field.minWidth === 'number' ? `${props.field.minWidth}px` : props.field.minWidth,
)
const canAdd = computed<boolean>(() => resolveAction(props.field.actions?.addItem, -1))
const isDraggable = computed<boolean>(() => props.field.draggable === true)
const dragItems = computed<FormObject[]>({
  get: () => [...items.value],
  set: updateItems,
})

function addItem() {
  const index = items.value.length
  let item = buildInitialFormFieldsState(props.field.fields, form.context)
  item = applyVirtualFields(item, index)
  if (props.field.transformOnCreate)
    item = props.field.transformOnCreate(item, index, actionParams(index).deps)
  updateItems([...items.value, item])
}

function removeItem(index: number) {
  const message =
    typeof props.field.confirmDelete === 'string' || typeof props.field.confirmDelete === 'function'
      ? resolveFormText(props.field.confirmDelete)
      : 'Remove this row?'
  if (props.field.confirmDelete && !window.confirm(message)) return
  updateItems(items.value.filter((_, itemIndex) => itemIndex !== index))
}

function moveItem(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= items.value.length) return
  const current = items.value[index]
  const next = items.value[target]
  if (!current || !next) return
  const values = [...items.value]
  values[index] = next
  values[target] = current
  updateItems(values)
}

function updateItems(value: readonly FormObject[]) {
  const current = form.getValue(props.path)
  if (!syncFormArrayItems(current, value)) {
    form.setValue(
      props.path,
      value.map((item, index) => applyVirtualFields(item, index)),
    )
    return
  }

  if (Array.isArray(current))
    current.forEach((item, index) => {
      if (isFormObject(item)) applyVirtualFields(item, index)
    })
}

function applyVirtualFields(item: FormObject, index: number) {
  if (!props.field.virtualFields) return item
  for (const [key, resolver] of Object.entries(props.field.virtualFields))
    item[key] = resolver(index)
  return item
}

function resolveAction(condition: FormArrayActionCondition | undefined, index: number) {
  if (typeof condition === 'boolean') return condition
  if (typeof condition !== 'function') return true
  const item = items.value[index] ?? {}
  return condition(actionParams(index))
}

async function runCustomAction(index: number, actionIndex: number) {
  const action = props.field.actions?.custom?.[actionIndex]
  const item = items.value[index]
  if (!action || !item) return
  await action.action(actionParams(index))
}

function customActionVisible(index: number, actionIndex: number) {
  const action = props.field.actions?.custom?.[actionIndex]
  const item = items.value[index]
  if (!action || !item) return false
  return action.condition?.(actionParams(index)) ?? true
}

function hasRowActions(index: number) {
  return (
    isDraggable.value ||
    resolveAction(props.field.actions?.deleteItem, index) ||
    resolveAction(props.field.actions?.moveUp, index) ||
    resolveAction(props.field.actions?.moveDown, index) ||
    Boolean(
      props.field.actions?.custom?.some((_action, actionIndex) =>
        customActionVisible(index, actionIndex),
      ),
    )
  )
}

const showActionsColumn = computed<boolean>(() =>
  items.value.some((_item, index) => hasRowActions(index)),
)

function rowPath(index: number) {
  return [...props.path, String(index)]
}

function itemKey(item: FormObject) {
  const existing = itemKeys.get(item)
  if (existing) return existing
  nextItemKey += 1
  const key = `array-table-item-${nextItemKey}`
  itemKeys.set(item, key)
  return key
}

function itemRenderKey(item: FormObject, index: number) {
  return `${itemKey(item)}:${index}`
}

function actionParams(index: number) {
  const item = items.value[index] ?? {}
  const callback = form.getFieldCallbackParams(props.path, props.field)
  return {
    index,
    item,
    items: items.value,
    ctx: callback.ctx,
    deps: callback.deps,
    getValue: (key: string) => form.getValue([...rowPath(index), ...key.split('.')]),
    setValue: (key: string, value: unknown) =>
      form.setValue([...rowPath(index), ...key.split('.')], value),
    getOptions: (key: string) =>
      form.getFieldApi([...rowPath(index), ...key.split('.')]).options.get(),
  }
}

function isFormObject(value: unknown): value is FormObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function fieldLabel(field: FormField) {
  return 'label' in field ? (resolveFormText(field.label) ?? field.key) : field.key
}
</script>

<template>
  <section :class="mergeFormUiClass('grid gap-3', formUi.ui.value.arrayTable?.ui?.root)">
    <div
      :class="
        mergeFormUiClass(
          'w-full overflow-x-auto rounded-lg border border-default bg-default',
          formUi.ui.value.arrayTable?.ui?.viewport,
        )
      "
    >
      <table
        :class="
          mergeFormUiClass(
            'w-full table-fixed border-collapse text-sm',
            formUi.ui.value.arrayTable?.ui?.table,
          )
        "
        :style="{ minWidth }"
      >
        <thead
          :class="
            mergeFormUiClass(
              'bg-elevated/70 text-left text-muted',
              formUi.ui.value.arrayTable?.ui?.head,
            )
          "
        >
          <tr :class="formUi.ui.value.arrayTable?.ui?.headerRow">
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :class="
                mergeFormUiClass(
                  'border-b border-r border-default px-3 py-2.5 font-medium last:border-r-0',
                  formUi.ui.value.arrayTable?.ui?.headerCell,
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
                  'w-36 border-b border-default px-2 py-2',
                  formUi.ui.value.arrayTable?.ui?.actionsHeader,
                )
              "
            />
          </tr>
        </thead>
        <component
          :is="isDraggable ? VueDraggable : 'tbody'"
          v-model="dragItems"
          :tag="isDraggable ? 'tbody' : undefined"
          :class="formUi.ui.value.arrayTable?.ui?.body"
          handle=".array-table-drag-handle"
          :animation="150"
        >
          <tr
            v-for="(item, index) in items"
            :key="itemRenderKey(item, index)"
            :class="
              mergeFormUiClass(
                'align-middle transition-colors hover:bg-elevated/35 [&>*]:border-b [&>*]:border-default [&:last-child>*]:border-b-0',
                formUi.ui.value.arrayTable?.ui?.row,
              )
            "
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="
                mergeFormUiClass(
                  'border-r border-default px-3 py-2 last:border-r-0',
                  formUi.ui.value.arrayTable?.ui?.cell,
                )
              "
            >
              <div
                :class="
                  mergeFormUiClass(
                    'flex min-h-9 w-full items-center',
                    formUi.ui.value.arrayTable?.ui?.control,
                  )
                "
              >
                <FormFieldRenderer :field="column" :parent-path="rowPath(index)" bare />
              </div>
            </td>
            <td
              v-if="showActionsColumn"
              :class="
                mergeFormUiClass(
                  'whitespace-nowrap px-2 py-2 text-right',
                  formUi.ui.value.arrayTable?.ui?.actionsCell,
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
                    formUi.ui.value.arrayTable?.ui?.action,
                  )
                "
                aria-label="Drag row"
              />
              <UButton
                v-if="resolveAction(field.actions?.moveUp, index)"
                icon="i-lucide-arrow-up"
                color="neutral"
                variant="ghost"
                size="xs"
                :class="formUi.ui.value.arrayTable?.ui?.action"
                :disabled="index === 0"
                aria-label="Move row up"
                @click="moveItem(index, -1)"
              />
              <UButton
                v-if="resolveAction(field.actions?.moveDown, index)"
                icon="i-lucide-arrow-down"
                color="neutral"
                variant="ghost"
                size="xs"
                :class="formUi.ui.value.arrayTable?.ui?.action"
                :disabled="index === items.length - 1"
                aria-label="Move row down"
                @click="moveItem(index, 1)"
              />
              <UButton
                v-if="resolveAction(field.actions?.deleteItem, index)"
                icon="i-lucide-trash-2"
                color="neutral"
                variant="ghost"
                size="xs"
                :class="formUi.ui.value.arrayTable?.ui?.action"
                aria-label="Remove row"
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
                :class="formUi.ui.value.arrayTable?.ui?.action"
                @click="runCustomAction(index, actionIndex)"
              >
                {{ resolveFormText(action.label) }}
              </UButton>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td
              :colspan="columns.length + (showActionsColumn ? 1 : 0)"
              :class="
                mergeFormUiClass(
                  'px-3 py-10 text-center text-muted',
                  formUi.ui.value.arrayTable?.ui?.empty,
                )
              "
            >
              {{ resolveFormText(field.emptyLabel) ?? 'No items yet' }}
            </td>
          </tr>
        </component>
      </table>
    </div>
    <UButton
      v-if="canAdd"
      icon="i-lucide-plus"
      variant="soft"
      :size="formUi.controlSize.value"
      :class="mergeFormUiClass('justify-self-start', formUi.ui.value.arrayTable?.ui?.add)"
      @click="addItem"
    >
      {{ resolveFormText(field.addItemLabel) ?? 'Add row' }}
    </UButton>
  </section>
</template>
