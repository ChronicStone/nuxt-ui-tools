<script lang="ts">
import type { FormFieldType } from '../../types'

/** Space a field reserves until its first render, so the page does not jump when it fills in. */
const DEFAULT_PENDING_HEIGHT = 62
const PENDING_HEIGHTS: Partial<Record<FormFieldType, number>> = {
  'array-collapse': 160,
  'array-list': 160,
  'array-table': 160,
  'array-tabs': 160,
  'array-variant': 160,
  card: 140,
  checkbox: 28,
  column: 140,
  divider: 17,
  file: 132,
  group: 140,
  info: 52,
  matrix: 160,
  object: 140,
  section: 36,
  switch: 28,
  tabs: 180,
  textarea: 104,
  upload: 132,
}
</script>

<script setup lang="ts">
import UAlert from '@nuxt/ui/components/Alert.vue'
import { computed, ref, useId, watchEffect } from 'vue'

import { useFieldEffects } from '../../composables/use-field-effects'
import {
  provideFormFieldBare,
  provideFormFieldControlAttrs,
} from '../../composables/use-form-field-chrome'
import { useFormItemLayout } from '../../composables/use-form-layout'
import {
  childParentPath,
  fieldPath,
  useFormRuntimeContext,
} from '../../composables/use-form-runtime'
import type { FormValue, FormField, FormItemLayout, FormObject } from '../../types'
import { createFormFieldInstance } from '../../utils/field-instance'
import { focusFormFieldElement } from '../../utils/focus'
import { isObject } from '../../utils/predicate'
import { isArrayField } from '../../utils/state'
import { resolveFormText } from '../../utils/text'
import { fieldRenderer } from './field-renderers'

const props = defineProps<{
  field: FormField
  parentPath: readonly string[]
  bare?: boolean
  controlLabelledby?: string
  controlAttrs?: FormObject
}>()

const form = useFormRuntimeContext()
const element = ref<HTMLElement | null>(null)
const bare = computed<boolean>(() => props.bare === true)
const controlId = useId()
const controlAttrs = computed<FormObject>(() => {
  if (!bare.value) {
    return {}
  }
  const attrs = {
    ...props.controlAttrs,
    'data-form-field': fieldPath(props.parentPath, props.field).join('.'),
  }
  if (props.controlLabelledby) {
    return { ...attrs, 'aria-labelledby': props.controlLabelledby, id: controlId }
  }
  return { ...attrs, 'aria-label': resolveControlLabel(props.field), id: controlId }
})

provideFormFieldBare(bare)
provideFormFieldControlAttrs(controlAttrs)
const placeholder = ref<HTMLElement | null>(null)
/** Bare controls render inside a parent that schedules them, such as an array-table row. */
const ready = bare.value ? ref<boolean>(true) : form.render.claim(1, placeholderTop)
const field = computed(() => createFormFieldInstance(props.field))
const path = computed(() => fieldPath(props.parentPath, props.field))
const childPath = computed(() => childParentPath(props.parentPath, props.field))
const visible = computed(() => form.shouldRender(props.field, path.value))
useFieldEffects(
  () => props.field,
  () => path.value,
)
const renderer = computed(() => fieldRenderer(field.value.type.value) ?? null)
const rendererProps = computed(() => {
  const baseProps = {
    field: props.field,
    path: path.value,
  }
  if (!field.value.type.isAny(['input-group', 'tabs', 'group', 'object', 'card', 'column'])) {
    return baseProps
  }

  return {
    ...baseProps,
    parentPath: childPath.value,
  }
})
const itemLayout = useFormItemLayout({
  formLayout: form.currentLayout,
  layout: resolveFieldLayout,
})

watchEffect((onCleanup) => {
  if (!element.value) {
    return
  }
  onCleanup(form.registerFieldElement(path.value, element.value))
})

watchEffect(async () => {
  const request = form.focusRequest.value
  if (!request || request.path !== path.value.join('.') || !element.value) {
    return
  }

  await focusFormFieldElement(element.value)
})

const pendingHeight = computed(
  () => `${PENDING_HEIGHTS[props.field.type] ?? DEFAULT_PENDING_HEIGHT}px`,
)
const pendingControl = computed(
  () => !field.value.state.is('stateless') && !isArrayField(props.field),
)

function resolveFieldLayout(): FormItemLayout | undefined {
  if (!field.value.capability.has('itemLayout')) {
    return undefined
  }
  const layout = Object.getOwnPropertyDescriptor(props.field, 'layout')?.value
  const fullByDefault =
    field.value.state.is('stateless') || field.value.type.is('tabs') || isArrayField(props.field)
  if (isLayout(layout)) {
    return fullByDefault ? { span: 'full', ...layout } : layout
  }
  return fullByDefault ? { span: 'full' } : undefined
}

function isLayout(value: FormValue): value is FormItemLayout {
  return isObject(value) && value !== null && !Array.isArray(value)
}

/** Where the placeholder sits on screen, unless it is hidden, as in an inactive tab. */
function placeholderTop() {
  const node = placeholder.value
  return node && node.getClientRects().length > 0 ? node.getBoundingClientRect().top : undefined
}

function resolveControlLabel(controlField: FormField) {
  if ('label' in controlField) {
    return resolveFormText(controlField.label) ?? controlField.key
  }
  return controlField.key
}
</script>

<template>
  <div
    v-if="visible && !ready"
    ref="placeholder"
    :data-form-field-pending="path.join('.')"
    :style="itemLayout.style.value"
    aria-hidden="true"
  >
    <div class="grid content-start gap-2" :style="{ minHeight: pendingHeight }">
      <template v-if="pendingControl">
        <span class="h-3 w-24 max-w-full rounded bg-elevated" />
        <span class="h-8 rounded-md bg-elevated/60" />
      </template>
    </div>
  </div>

  <template v-else-if="visible && bare">
    <component :is="renderer" v-if="renderer" v-bind="rendererProps" />
    <UAlert
      v-else
      color="neutral"
      variant="soft"
      icon="i-lucide-construction"
      title="Unsupported field"
      :description="`The ${field.type.value} field renderer is not implemented in this slice.`"
    />
  </template>

  <div
    v-else-if="visible"
    ref="element"
    :data-form-field="path.join('.')"
    :style="itemLayout.style.value"
  >
    <component :is="renderer" v-if="renderer" v-bind="rendererProps" />
    <UAlert
      v-else
      color="neutral"
      variant="soft"
      icon="i-lucide-construction"
      title="Unsupported field"
      :description="`The ${field.type.value} field renderer is not implemented in this slice.`"
    />
  </div>
</template>
