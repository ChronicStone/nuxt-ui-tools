<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import USelect from '@nuxt/ui/components/Select.vue'
import { computed, defineAsyncComponent, ref, watch } from 'vue'

import FormFieldRenderer from '../../components/renderer/FormFieldRenderer.vue'
import { useFormContainerLayout } from '../../composables/use-form-layout'
import { useFormRuntimeContext } from '../../composables/use-form-runtime'
import { useFormUi } from '../../composables/use-form-ui'
import type {
  FormArrayListField,
  FormArrayTabsField,
  FormArrayVariantField,
  FormField,
} from '../../types'
import type { FormObject } from '../../types/utils'
import { syncFormArrayItems } from '../../utils/array'
import { buildInitialFormFieldsState } from '../../utils/state'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'
import type { FormArrayActionCondition } from './types'

const props = defineProps<{
  field: FormArrayListField | FormArrayTabsField | FormArrayVariantField
  path: readonly string[]
}>()

const VueDraggable = defineAsyncComponent(() =>
  import('vue-draggable-plus').then(({ VueDraggable: draggableComponent }) => draggableComponent),
)

const form = useFormRuntimeContext()
const formUi = useFormUi()
const activeIndex = ref<number>(0)
const itemKeys = new WeakMap<FormObject, string>()
let nextItemKey = 0
const items = computed<readonly FormObject[]>(() => {
  const value = form.getValue(props.path)
  return Array.isArray(value) ? value.filter(isFormObject) : []
})
const dragItems = computed<FormObject[]>({
  get: () => [...items.value],
  set: updateItems,
})
const containerLayout = useFormContainerLayout({
  layout: () => props.field.layout,
  formLayout: form.currentLayout,
})
const title = computed(() => resolveFormText(props.field.label))
const description = computed(() => resolveFormText(props.field.description))
const addItemLabel = computed(() => resolveFormText(props.field.addItemLabel) ?? 'Add item')
const emptyLabel = computed(() => resolveFormText(props.field.emptyLabel) ?? 'No items yet')
const itemLabel = computed(() => resolveFormText(props.field.itemLabel) ?? 'Item')
const canAdd = computed(() => resolveAction(props.field.actions?.addItem, -1))
const isDraggable = computed<boolean>(() =>
  props.field.type === 'array-tabs' ? false : props.field.draggable === true,
)
const isTabsMode = computed(
  () =>
    props.field.type === 'array-tabs' ||
    (props.field.type === 'array-variant' && props.field.displayMode === 'tabs'),
)
const variantItems = computed(() =>
  props.field.type === 'array-variant'
    ? props.field.variants.map((variant) => ({
        label: resolveFormText(variant.label) ?? String(variant.key),
        value: variant.key,
      }))
    : [],
)

watch(items, (value) => {
  if (activeIndex.value >= value.length) activeIndex.value = Math.max(0, value.length - 1)
})

function addItem() {
  const index = items.value.length
  const variant = props.field.type === 'array-variant' ? props.field.variants[0] : undefined
  const fields = variant?.fields ?? fieldsForItem({})
  let item = buildInitialFormFieldsState(fields, form.context)
  if (variant && props.field.type === 'array-variant') item[props.field.variantKey] = variant.key
  item = applyVirtualFields(item, index)
  if (props.field.transformOnCreate)
    item = props.field.transformOnCreate(item, index, actionParams(index).deps)
  updateItems([...items.value, item])
  activeIndex.value = index
}

function removeItem(index: number) {
  const message =
    typeof props.field.confirmDelete === 'string' || typeof props.field.confirmDelete === 'function'
      ? resolveFormText(props.field.confirmDelete)
      : 'Remove this item?'
  if (props.field.confirmDelete && !window.confirm(message)) return
  updateItems(items.value.filter((_, itemIndex) => itemIndex !== index))
  if (activeIndex.value >= index) activeIndex.value = Math.max(0, activeIndex.value - 1)
}

function fieldsForItem(item: FormObject): readonly FormField[] {
  const field = props.field
  if (field.type !== 'array-variant') return field.fields
  const variant = field.variants.find((candidate) => candidate.key === item[field.variantKey])
  return variant?.fields ?? []
}

function applyVirtualFields(item: FormObject, index: number) {
  const field = props.field
  const fields =
    field.type === 'array-variant'
      ? field.variants.find((variant) => variant.key === item[field.variantKey])?.virtualFields
      : field.virtualFields
  if (!fields) return item
  for (const [key, resolver] of Object.entries(fields)) item[key] = resolver(index)
  return item
}

function itemHeading(item: FormObject, index: number) {
  return (
    resolveFormText(props.field.headerTemplate?.(item, index, actionParams(index).deps)) ??
    `${itemLabel.value} ${index + 1}`
  )
}

function resolveAction(condition: FormArrayActionCondition | undefined, index: number) {
  if (typeof condition === 'boolean') return condition
  if (typeof condition !== 'function') return true
  const item = items.value[index] ?? {}
  return condition(actionParams(index))
}

function updateVariant(item: FormObject, index: number, value: string | number) {
  if (props.field.type !== 'array-variant') return
  const variant = props.field.variants.find((candidate) => candidate.key === value)
  if (!variant) return
  let next = buildInitialFormFieldsState(variant.fields, form.context)
  next[props.field.variantKey] = variant.key
  next = applyVirtualFields(next, index)
  if (props.field.transformOnCreate)
    next = props.field.transformOnCreate(next, index, actionParams(index).deps)
  const nextItems = [...items.value]
  nextItems[index] = next
  updateItems(nextItems)
}

function variantValue(item: FormObject | undefined) {
  const field = props.field
  if (field.type !== 'array-variant' || !item) return undefined
  const value = item[field.variantKey]
  return typeof value === 'string' || typeof value === 'number' ? value : undefined
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

function moveItem(index: number, direction: -1 | 1) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= items.value.length) return

  const nextItems = [...items.value]
  const current = nextItems[index]
  const next = nextItems[nextIndex]
  if (!current || !next) return

  nextItems[index] = next
  nextItems[nextIndex] = current
  updateItems(nextItems)
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

function itemPath(index: number) {
  return [...props.path, String(index)]
}

function itemKey(item: FormObject) {
  const existing = itemKeys.get(item)
  if (existing) return existing
  nextItemKey += 1
  const key = `array-item-${nextItemKey}`
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
    getValue: (key: string) => form.getValue([...itemPath(index), ...key.split('.')]),
    setValue: (key: string, value: unknown) =>
      form.setValue([...itemPath(index), ...key.split('.')], value),
    getOptions: (key: string) =>
      form.getFieldApi([...itemPath(index), ...key.split('.')]).options.get(),
  }
}

function isFormObject(value: unknown): value is FormObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
</script>

<template>
  <section :class="mergeFormUiClass('grid gap-3', formUi.ui.value.arrayList?.ui?.root)">
    <div
      v-if="title || description"
      :class="mergeFormUiClass('grid gap-1', formUi.ui.value.arrayList?.ui?.header)"
    >
      <h3
        v-if="title"
        :class="
          mergeFormUiClass(
            'text-sm font-medium text-highlighted',
            formUi.ui.value.arrayList?.ui?.title,
          )
        "
      >
        {{ title }}
      </h3>
      <p
        v-if="description"
        :class="mergeFormUiClass('text-sm text-muted', formUi.ui.value.arrayList?.ui?.description)"
      >
        {{ description }}
      </p>
    </div>

    <div
      v-if="items.length === 0"
      :class="
        mergeFormUiClass(
          'rounded-lg border border-dashed border-default bg-elevated/35 p-5 text-center text-sm text-muted',
          formUi.ui.value.arrayList?.ui?.empty,
        )
      "
    >
      {{ emptyLabel }}
    </div>

    <div v-else-if="isTabsMode" class="grid gap-3">
      <div
        :class="
          mergeFormUiClass(
            'flex gap-1 overflow-x-auto rounded-lg bg-elevated p-1',
            formUi.ui.value.arrayList?.ui?.tabs,
          )
        "
      >
        <UButton
          v-for="(item, index) in items"
          :key="itemRenderKey(item, index)"
          size="xs"
          :color="activeIndex === index ? 'primary' : 'neutral'"
          :variant="activeIndex === index ? 'solid' : 'ghost'"
          :class="mergeFormUiClass('shrink-0', formUi.ui.value.arrayList?.ui?.tab)"
          @click="activeIndex = index"
        >
          {{ itemHeading(items[index] ?? {}, index) }}
        </UButton>
      </div>

      <div
        :class="[
          mergeFormUiClass(
            'grid rounded-lg border border-default bg-default',
            formUi.ui.value.arrayList?.ui?.item,
          ),
          field.compact ? 'gap-3 p-3' : 'gap-4 p-4',
        ]"
      >
        <div
          :class="
            mergeFormUiClass(
              'flex items-center justify-between gap-3',
              formUi.ui.value.arrayList?.ui?.itemHeader,
            )
          "
        >
          <span
            :class="
              mergeFormUiClass(
                'text-sm font-medium text-highlighted',
                formUi.ui.value.arrayList?.ui?.itemTitle,
              )
            "
          >
            {{ itemHeading(items[activeIndex] ?? {}, activeIndex) }}
          </span>
          <div
            :class="
              mergeFormUiClass(
                'flex items-center gap-1',
                formUi.ui.value.arrayList?.ui?.itemActions,
              )
            "
          >
            <UButton
              v-if="resolveAction(field.actions?.moveUp, activeIndex)"
              icon="i-lucide-arrow-up"
              color="neutral"
              variant="ghost"
              size="xs"
              :class="formUi.ui.value.arrayList?.ui?.action"
              :disabled="activeIndex === 0"
              aria-label="Move item up"
              @click="moveItem(activeIndex, -1)"
            />
            <UButton
              v-if="resolveAction(field.actions?.moveDown, activeIndex)"
              icon="i-lucide-arrow-down"
              color="neutral"
              variant="ghost"
              size="xs"
              :class="formUi.ui.value.arrayList?.ui?.action"
              :disabled="activeIndex === items.length - 1"
              aria-label="Move item down"
              @click="moveItem(activeIndex, 1)"
            />
            <UButton
              v-if="resolveAction(field.actions?.deleteItem, activeIndex)"
              icon="i-lucide-trash-2"
              color="neutral"
              variant="ghost"
              size="xs"
              :class="formUi.ui.value.arrayList?.ui?.action"
              aria-label="Remove item"
              @click="removeItem(activeIndex)"
            />
          </div>
        </div>

        <USelect
          v-if="field.type === 'array-variant'"
          :model-value="variantValue(items[activeIndex])"
          :items="variantItems"
          value-key="value"
          :size="formUi.controlSize.value"
          :class="mergeFormUiClass('w-full max-w-xs', formUi.ui.value.arrayList?.ui?.variant)"
          @update:model-value="updateVariant(items[activeIndex] ?? {}, activeIndex, $event)"
        />

        <div
          :class="mergeFormUiClass('grid', formUi.ui.value.arrayList?.ui?.fields)"
          :style="containerLayout.style.value"
        >
          <FormFieldRenderer
            v-for="child in fieldsForItem(items[activeIndex] ?? {})"
            :key="child.key"
            :field="child"
            :parent-path="itemPath(activeIndex)"
          />
        </div>
      </div>
    </div>

    <component
      :is="isDraggable ? VueDraggable : 'div'"
      v-else
      v-model="dragItems"
      :class="mergeFormUiClass('grid gap-3', formUi.ui.value.arrayList?.ui?.list)"
      handle=".array-drag-handle"
      :animation="150"
    >
      <div
        v-for="(item, index) in items"
        :key="itemRenderKey(item, index)"
        :class="[
          mergeFormUiClass(
            'grid rounded-lg border border-default bg-default',
            formUi.ui.value.arrayList?.ui?.item,
          ),
          field.compact ? 'gap-3 p-3' : 'gap-4 p-4',
        ]"
      >
        <div
          :class="
            mergeFormUiClass(
              'flex items-center justify-between gap-3',
              formUi.ui.value.arrayList?.ui?.itemHeader,
            )
          "
        >
          <span
            :class="
              mergeFormUiClass(
                'text-sm font-medium text-highlighted',
                formUi.ui.value.arrayList?.ui?.itemTitle,
              )
            "
          >
            {{ itemHeading(items[index] ?? {}, index) }}
          </span>
          <div
            :class="
              mergeFormUiClass(
                'flex items-center gap-1',
                formUi.ui.value.arrayList?.ui?.itemActions,
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
                  'array-drag-handle cursor-grab',
                  formUi.ui.value.arrayList?.ui?.action,
                )
              "
              aria-label="Drag item"
            />
            <UButton
              v-if="resolveAction(field.actions?.moveUp, index)"
              icon="i-lucide-arrow-up"
              color="neutral"
              variant="ghost"
              size="xs"
              :class="formUi.ui.value.arrayList?.ui?.action"
              :disabled="index === 0"
              aria-label="Move item up"
              @click="moveItem(index, -1)"
            />
            <UButton
              v-if="resolveAction(field.actions?.moveDown, index)"
              icon="i-lucide-arrow-down"
              color="neutral"
              variant="ghost"
              size="xs"
              :class="formUi.ui.value.arrayList?.ui?.action"
              :disabled="index === items.length - 1"
              aria-label="Move item down"
              @click="moveItem(index, 1)"
            />
            <UButton
              v-if="resolveAction(field.actions?.deleteItem, index)"
              icon="i-lucide-trash-2"
              color="neutral"
              variant="ghost"
              size="xs"
              :class="formUi.ui.value.arrayList?.ui?.action"
              aria-label="Remove item"
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
              :class="formUi.ui.value.arrayList?.ui?.action"
              @click="runCustomAction(index, actionIndex)"
            >
              {{ resolveFormText(action.label) }}
            </UButton>
          </div>
        </div>

        <USelect
          v-if="field.type === 'array-variant'"
          :model-value="variantValue(items[index])"
          :items="variantItems"
          value-key="value"
          :size="formUi.controlSize.value"
          :class="mergeFormUiClass('w-full max-w-xs', formUi.ui.value.arrayList?.ui?.variant)"
          @update:model-value="updateVariant(items[index] ?? {}, index, $event)"
        />

        <div
          :class="mergeFormUiClass('grid', formUi.ui.value.arrayList?.ui?.fields)"
          :style="containerLayout.style.value"
        >
          <FormFieldRenderer
            v-for="child in fieldsForItem(items[index] ?? {})"
            :key="child.key"
            :field="child"
            :parent-path="itemPath(index)"
          />
        </div>
      </div>
    </component>

    <UButton
      v-if="canAdd"
      icon="i-lucide-plus"
      variant="soft"
      :size="formUi.controlSize.value"
      :class="mergeFormUiClass('justify-self-start', formUi.ui.value.arrayList?.ui?.add)"
      @click="addItem"
    >
      {{ addItemLabel }}
    </UButton>
  </section>
</template>
