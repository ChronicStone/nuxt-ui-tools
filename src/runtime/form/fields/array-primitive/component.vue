<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldRenderer from '../../components/renderer/form-field-renderer.vue'
import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormValue, FormField } from '../../types'
import { formOptionKey, normalizeOptionItem, resolveOptionSource } from '../../utils/options'
import { isRecord } from '../../utils/path'
import {
  invokeFormFunction,
  isBoolean,
  isFunction,
  isNumber,
  isString,
} from '../../utils/predicate'
import { getPrimitiveArrayItemField, isEmptyValue } from '../../utils/state'
import { resolveFormBoundaryText, resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'
import type { FormArrayPrimitiveField } from './types'

const props = defineProps<{
  field: FormArrayPrimitiveField
  path: readonly string[]
}>()

const { fieldProps, api, disabled, form, params } = useFieldControl(
  () => props.field,
  () => props.path,
  { omit: ['variant', 'draggable'] },
)
const VueDraggable = defineAsyncComponent(async () => {
  const { VueDraggable: draggableComponent } = await import('vue-draggable-plus')
  return draggableComponent
})

const formUi = useFormUi()
const { t } = useUiToolsLocale()
const ui = computed(() => formUi.ui.value.arrayPrimitive?.ui)
const values = computed<readonly FormValue[]>(() => {
  const value = form.getValue(props.path)
  return Array.isArray(value) ? value : []
})
const itemFields = computed(() =>
  values.value.flatMap((_value, index) => {
    const itemField = getPrimitiveArrayItemField(props.field, index)
    return itemField ? [itemField] : []
  }),
)
const hasPendingItem = computed(() => values.value.some(isEmptyValue))
const isChips = computed(() => fieldProps.value.variant === 'chips')
const isDraggable = computed(() => fieldProps.value.draggable === true)
const dragValues = computed<FormValue[]>({
  get: () => [...values.value],
  set: (value) => form.setValue(props.path, value),
})
const editingIndex = ref<number | null>(null)

watch(
  () => values.value[editingIndex.value ?? -1],
  (value, previous) => {
    if (editingIndex.value !== null && previous !== undefined && value !== previous) {
      editingIndex.value = null
    }
  },
)

watch(
  values,
  (list) => {
    if (list.includes(null)) {
      form.setValue(
        props.path,
        list.map((item) => item ?? undefined),
      )
    }
  },
  { immediate: true },
)
const addItemLabel = computed(
  () => resolveFormText(props.field.addItemLabel) ?? t('form.fields.array.addItem'),
)
const emptyLabel = computed(
  () => resolveFormText(props.field.emptyLabel) ?? t('form.fields.array.empty'),
)
const canAdd = computed(() => {
  const action = props.field.actions?.addItem
  if (isFunction(action)) {
    return action({ ...actionParams(), values: values.value })
  }
  return action ?? true
})

function actionParams() {
  return {
    api: api.value,
    ctx: params.value.ctx,
    deps: params.value.deps,
    values: values.value,
  }
}

function canDelete(index: number) {
  const action = props.field.actions?.deleteItem
  if (isFunction(action)) {
    return action({ ...actionParams(), index, value: values.value[index] })
  }
  return action ?? true
}

function isPending(index: number) {
  return isEmptyValue(values.value[index])
}

function showsPreview(index: number) {
  return isFunction(props.field.preview) && !isPending(index) && editingIndex.value !== index
}

async function editItem(index: number) {
  editingIndex.value = index
  await nextTick()
  await form.focusField(itemPath(index))
}

function itemPath(index: number) {
  return [...props.path, String(index)]
}

function itemOption(index: number, itemField: FormField) {
  const [selected] = form.getFieldApi(itemPath(index), itemField).options.selected()
  if (isRecord(selected)) {
    return selected
  }
  return staticItemOption(index, itemField)
}

function staticItemOption(index: number, itemField: FormField) {
  const value = values.value[index]
  if (!isString(value) && !isNumber(value) && !isBoolean(value)) {
    return
  }
  const source = Object.getOwnPropertyDescriptor(itemField, 'options')?.value
  const items = resolveOptionSource(
    isRecord(source) ? source.source : source,
    form.getFieldCallbackParams(itemPath(index), itemField),
  )
  const key = formOptionKey(value)
  const match = items.find((item) => formOptionKey(normalizeOptionItem(item).value) === key)
  if (match === undefined) {
    return
  }
  return isRecord(match) ? match : { label: String(match), value: match }
}

function previewRenderer(index: number, itemField: FormField) {
  const { preview } = props.field
  if (!preview) {
    return null
  }
  const content = preview({
    ctx: params.value.ctx,
    deps: params.value.deps,
    index,
    option: itemOption(index, itemField),
    value: values.value[index],
  })
  return () => invokeFormFunction(content) ?? content
}

async function addItem() {
  const index = values.value.length
  form.setValue(props.path, [...values.value, undefined])
  await nextTick()
  await form.focusField(itemPath(index))
}

function removeItem(index: number) {
  if (!isPending(index) && props.field.confirmDelete !== false) {
    const message =
      resolveFormBoundaryText(props.field.confirmDelete) ?? t('form.fields.array.confirmDelete')
    // oxlint-disable-next-line no-alert -- confirmation stays native until the engine ships its own confirm overlay
    if (!window.confirm(message)) {
      return
    }
  }
  form.setValue(
    props.path,
    values.value.filter((_value, itemIndex) => itemIndex !== index),
  )
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <div :class="mergeFormUiClass('grid gap-2', ui?.root)">
      <p
        v-if="itemFields.length === 0"
        :class="mergeFormUiClass('text-sm text-muted', ui?.empty)"
        data-form-array-empty=""
      >
        {{ emptyLabel }}
      </p>
      <component
        :is="isDraggable ? VueDraggable : 'div'"
        v-model="dragValues"
        :class="
          mergeFormUiClass(isChips ? 'flex flex-wrap items-center gap-2' : 'grid gap-2', ui?.list)
        "
        handle=".array-primitive-drag-handle"
        :animation="150"
        :disabled="!isDraggable"
      >
        <div
          v-for="(itemField, index) in itemFields"
          :key="index"
          :class="
            mergeFormUiClass(
              isChips && showsPreview(index)
                ? 'inline-flex h-8 items-center gap-0.5 rounded-full border border-default bg-default pl-1 pr-0.5 text-sm'
                : isChips
                  ? 'inline-flex items-center gap-1'
                  : 'flex items-start gap-2',
              ui?.item,
            )
          "
          :data-form-array-item="index"
        >
          <UIcon
            v-if="isChips && isDraggable && showsPreview(index)"
            name="i-lucide-grip-vertical"
            class="array-primitive-drag-handle size-3.5 shrink-0 cursor-grab text-dimmed active:cursor-grabbing"
            aria-hidden="true"
          />
          <button
            v-if="showsPreview(index)"
            type="button"
            :class="
              mergeFormUiClass(
                isChips
                  ? 'inline-flex min-w-0 items-center px-1.5 text-sm font-medium text-highlighted focus-visible:outline-2 focus-visible:outline-primary'
                  : 'flex min-h-9 min-w-0 flex-1 items-center rounded-lg border border-default bg-elevated/40 px-3 py-1.5 text-left text-sm break-words transition-colors hover:border-inverted/30 hover:bg-elevated focus-visible:outline-2 focus-visible:outline-primary',
                ui?.preview,
              )
            "
            :disabled="disabled"
            :title="t('form.fields.array.editItem')"
            data-form-array-preview=""
            @click="editItem(index)"
          >
            <component :is="previewRenderer(index, itemField)" />
          </button>
          <div
            v-else
            :class="mergeFormUiClass(isChips ? 'w-44 min-w-0' : 'min-w-0 flex-1', ui?.control)"
          >
            <FormFieldRenderer :field="itemField" :parent-path="path" />
          </div>
          <UButton
            v-if="canDelete(index)"
            :icon="isPending(index) ? 'i-lucide-x' : isChips ? 'i-lucide-x' : 'i-lucide-trash-2'"
            color="neutral"
            variant="ghost"
            :size="isChips ? 'xs' : formUi.controlSize.value"
            :disabled="disabled"
            :class="mergeFormUiClass(isChips ? 'shrink-0 rounded-full' : 'shrink-0', ui?.action)"
            :aria-label="t('form.fields.array.removeItem')"
            @click="removeItem(index)"
          />
        </div>
        <UButton
          v-if="canAdd && isChips"
          icon="i-lucide-plus"
          color="neutral"
          variant="outline"
          size="sm"
          :disabled="disabled || hasPendingItem"
          :class="mergeFormUiClass('h-8 rounded-full', ui?.add)"
          @click="addItem"
        >
          {{ addItemLabel }}
        </UButton>
      </component>
      <UButton
        v-if="canAdd && !isChips"
        icon="i-lucide-plus"
        color="neutral"
        variant="outline"
        :size="formUi.controlSize.value"
        :disabled="disabled || hasPendingItem"
        :class="mergeFormUiClass('justify-self-start', ui?.add)"
        @click="addItem"
      >
        {{ addItemLabel }}
      </UButton>
    </div>
  </FormFieldShell>
</template>
