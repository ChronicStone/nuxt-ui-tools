<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import USelect from '@nuxt/ui/components/Select.vue'
import { computed, defineAsyncComponent, ref, watch } from 'vue'

import FormFieldRenderer from '../../components/renderer/FormFieldRenderer.vue'
import { useFormContainerLayout } from '../../composables/use-form-layout'
import { useFormRuntimeContext } from '../../composables/use-form-runtime'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormValue } from '../../types'
import type {
  FormArrayListField,
  FormArrayTabsField,
  FormArrayVariantField,
  FormField,
} from '../../types'
import type { FormObject } from '../../types/utils'
import { syncFormArrayItems } from '../../utils/array'
import { isBoolean, isFunction, isNumber, isObject, isString } from '../../utils/predicate'
import { buildInitialFormFieldsState } from '../../utils/state'
import { resolveFormBoundaryText, resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'
import type { FormArrayAction, FormArrayBaseAction } from './types'
import FormDirectionalTransition from '../../components/utils/FormDirectionalTransition.vue'

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
const tabTransitionDirection = ref<'forward' | 'backward'>('forward')
const tabTransitioning = ref<boolean>(false)
const itemKeys = new WeakMap<FormObject, string>()
let nextItemKey = 0
const items = computed<readonly FormObject[]>(() => {
  const value = form.getValue(props.path)
  return Array.isArray(value) ? value.filter(isFormObject) : []
})
const activeItem = computed(() => items.value[activeIndex.value])
const dragItems = computed<FormObject[]>({
  get: () => [...items.value],
  set: updateDraggedItems,
})
const containerLayout = useFormContainerLayout({
  layout: () => props.field.layout,
  formLayout: form.currentLayout,
})
const title = computed(() => resolveFormText(props.field.label))
const description = computed(() => resolveFormText(props.field.description))
const addItemLabel = computed(() =>
  resolveArrayActionLabel(props.field.actions?.addItem, resolveFormText(props.field.addItemLabel) ?? 'Add item'),
)
const addItemIcon = computed(() => resolveArrayActionIcon(props.field.actions?.addItem, 'i-lucide-plus'))
const emptyLabel = computed(() => resolveFormText(props.field.emptyLabel) ?? 'No items yet')
const itemLabel = computed(() => resolveFormText(props.field.itemLabel) ?? 'Item')
const canAdd = computed(() => resolveAction(props.field.actions?.addItem, -1))
const isDraggable = computed<boolean>(() => props.field.draggable !== false)
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

  tabTransitionDirection.value = 'forward'
  updateItems([...items.value, item])
  activeIndex.value = index
}

function removeItem(index: number) {
  const message = resolveFormBoundaryText(props.field.confirmDelete) ?? 'Remove this item?'
  if (props.field.confirmDelete && !window.confirm(message)) return

  const currentActiveIndex = activeIndex.value
  const removingActiveItem = currentActiveIndex === index
  const hasNextItem = index + 1 < items.value.length
  if (removingActiveItem) tabTransitionDirection.value = hasNextItem ? 'forward' : 'backward'

  updateItems(items.value.filter((_, itemIndex) => itemIndex !== index))
  if (currentActiveIndex < index) return
  if (currentActiveIndex > index) {
    activeIndex.value = currentActiveIndex - 1
    return
  }
  activeIndex.value = hasNextItem ? index : Math.max(0, index - 1)
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

function selectTab(index: number) {
  if (index === activeIndex.value) return
  tabTransitionDirection.value = index > activeIndex.value ? 'forward' : 'backward'
  activeIndex.value = index
}

function isArrayActionConfig(action: FormArrayAction | undefined): action is FormArrayBaseAction {
  return isObject(action) && !isFunction(action)
}

function resolveAction(action: FormArrayAction | undefined, index: number) {
  const condition = isArrayActionConfig(action) ? action.condition : action
  if (isBoolean(condition)) return condition
  if (!isFunction(condition)) return true
  const item = items.value[index] ?? {}
  return condition(actionParams(index))
}

function resolveArrayActionLabel(action: FormArrayAction | undefined, fallback: string) {
  if (!isArrayActionConfig(action)) return fallback
  return resolveFormText(action.label) ?? fallback
}

function resolveArrayActionIcon(action: FormArrayAction | undefined, fallback: string) {
  if (!isArrayActionConfig(action) || !isString(action.icon)) return fallback
  return action.icon
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
  return isString(value) || isNumber(value) ? value : undefined
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

function updateDraggedItems(value: readonly FormObject[]) {
  const activeItem = items.value[activeIndex.value]
  updateItems(value)
  if (!activeItem) return
  const nextActiveIndex = value.indexOf(activeItem)
  if (nextActiveIndex >= 0) activeIndex.value = nextActiveIndex
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
    setValue: (key: string, value: FormValue) =>
      form.setValue([...itemPath(index), ...key.split('.')], value),
    getOptions: (key: string) =>
      form.getFieldApi([...itemPath(index), ...key.split('.')]).options.get(),
  }
}

function isFormObject(value: FormValue): value is FormObject {
  return isObject(value) && value !== null && !Array.isArray(value)
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

    <div
      v-else-if="isTabsMode"
      :class="
        mergeFormUiClass(
          'overflow-hidden rounded-lg border border-default bg-default',
          formUi.ui.value.arrayList?.ui?.item,
        )
      "
    >
      <div class="flex min-w-0 items-stretch border-b border-default bg-elevated/25">
        <VueDraggable
          v-model="dragItems"
          tag="div"
          role="tablist"
          :aria-label="title ?? itemLabel"
          :disabled="!isDraggable"
          handle=".array-tab-drag-handle"
          :animation="150"
          :class="
            mergeFormUiClass(
              'flex min-w-0 flex-1 items-stretch overflow-x-auto',
              formUi.ui.value.arrayList?.ui?.tabs,
            )
          "
        >
          <div
            v-for="(item, index) in items"
            :key="itemRenderKey(item, index)"
            :class="
              mergeFormUiClass(
                [
                  'relative flex min-h-11 shrink-0 items-stretch transition-colors',
                  activeIndex === index
                    ? 'bg-default text-highlighted'
                    : 'text-muted hover:bg-elevated/60 hover:text-default',
                ].join(' '),
                formUi.ui.value.arrayList?.ui?.tab,
              )
            "
          >
            <button
              type="button"
              role="tab"
              :aria-selected="activeIndex === index"
              class="array-tab-drag-handle flex min-w-0 items-center gap-2 px-3 py-2.5 text-sm font-medium"
              :class="isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'"
              @click="selectTab(index)"
            >
              <UIcon
                v-if="isDraggable"
                name="i-lucide-grip-vertical"
                class="size-3.5 shrink-0 text-dimmed"
                aria-hidden="true"
              />
              <span class="max-w-48 truncate">{{ itemHeading(item, index) }}</span>
            </button>

            <div class="flex items-center gap-0.5 pr-1">
              <UButton
                v-for="(action, actionIndex) in field.actions?.custom ?? []"
                v-show="customActionVisible(index, actionIndex)"
                :key="actionIndex"
                type="button"
                :icon="action.icon"
                color="neutral"
                variant="ghost"
                size="xs"
                :class="formUi.ui.value.arrayList?.ui?.action"
                @click.stop="runCustomAction(index, actionIndex)"
              >
                {{ action.icon ? undefined : resolveFormText(action.label) }}
              </UButton>
              <UButton
                v-if="resolveAction(field.actions?.deleteItem, index)"
                type="button"
                icon="i-lucide-trash-2"
                color="neutral"
                variant="ghost"
                size="xs"
                :class="formUi.ui.value.arrayList?.ui?.action"
                aria-label="Remove item"
                @click.stop="removeItem(index)"
              />
            </div>

            <span
              class="absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-opacity"
              :class="activeIndex === index ? 'bg-primary opacity-100' : 'opacity-0'"
              aria-hidden="true"
            />
          </div>
        </VueDraggable>
        <div v-if="canAdd" class="flex shrink-0 items-center border-l border-default px-1.5">
          <UButton
            type="button"
            icon="i-lucide-plus"
            color="neutral"
            variant="ghost"
            :size="formUi.controlSize.value"
            :aria-label="addItemLabel"
            :title="addItemLabel"
            @click="addItem"
          />
        </div>
      </div>

      <div :class="field.compact ? 'grid gap-3 p-3' : 'grid gap-4 p-4'">
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
      v-if="canAdd && (!isTabsMode || items.length === 0)"
      icon="i-lucide-plus"
      color="neutral"
      variant="outline"
      :size="formUi.controlSize.value"
      :class="mergeFormUiClass('justify-self-start', formUi.ui.value.arrayList?.ui?.add)"
      @click="addItem"
    >
      {{ addItemLabel }}
    </UButton>
  </section>
</template>
