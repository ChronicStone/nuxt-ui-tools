<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UCollapsible from '@nuxt/ui/components/Collapsible.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, ref } from 'vue'

import { useFormFieldBare } from '../../composables/use-form-field-chrome'
import { useFormRuntimeContext } from '../../composables/use-form-runtime'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormField } from '../../types'
import { createFormFieldInstance } from '../../utils/field-instance'
import { isRecord } from '../../utils/path'
import { isBoolean, isFunction, isObject } from '../../utils/predicate'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'

const props = defineProps<{
  field: FormField
  path: readonly string[]
  inlineLabel?: boolean
}>()

const form = useFormRuntimeContext()
const formUi = useFormUi()
const bare = useFormFieldBare()
const field = computed(() => createFormFieldInstance(props.field))

const label = computed(() =>
  field.value.capability.has('label') && 'label' in props.field
    ? resolveFormText(props.field.label)
    : undefined,
)
const description = computed(() =>
  field.value.capability.has('description') && 'description' in props.field
    ? resolveFormText(props.field.description)
    : undefined,
)
const hint = computed(() =>
  field.value.capability.has('hint') && 'hint' in props.field
    ? resolveFormText(props.field.hint)
    : undefined,
)
const labelExtra = computed(() => {
  if (!field.value.capability.has('hint') || !('labelExtra' in props.field)) return undefined
  const value = props.field.labelExtra
  return isFunction(value) ? value() : value
})
const shellLabel = computed(() => (props.inlineLabel ? undefined : label.value))
const shellDescription = computed(() => (props.inlineLabel ? undefined : description.value))
const shellHint = computed(() => (props.inlineLabel ? undefined : hint.value))
const shellLabelExtra = computed(() => (props.inlineLabel ? undefined : labelExtra.value))
const error = computed(() => form.getFieldError(props.path))
const pending = computed(() => form.getFieldApi(props.path, props.field).validation.pending())
const required = computed(() => {
  if (!field.value.capability.has('validation')) return false
  const validation = Object.getOwnPropertyDescriptor(props.field, 'validation')?.value
  if (!isObject(validation) || validation === null || Array.isArray(validation)) return false
  const value = Object.getOwnPropertyDescriptor(validation, 'required')?.value
  if (isFunction(value)) return value(form.getFieldCallbackParams(props.path, props.field)) === true
  return isBoolean(value) ? value : false
})
const dirty = computed(
  () =>
    'dirtyCheck' in props.field &&
    (props.field.dirtyCheck === true || schemaDirtyCheck()) &&
    form.dirtyPaths.value.includes(props.path.join('.')),
)

function schemaDirtyCheck() {
  const schema = form.schema.value
  if (!isRecord(schema) || !isRecord(schema.controls)) return false
  return schema.controls.dirtyCheck === true
}
const open = ref<boolean>(!('collapsed' in props.field && props.field.collapsed === true))
const collapsible = computed(() => 'collapsible' in props.field && props.field.collapsible === true)
const fieldUi = computed(() => formUi.ui.value.field?.ui)
const nuxtFieldUi = computed(() => ({
  root: fieldUi.value?.root,
  wrapper: fieldUi.value?.wrapper,
  labelWrapper: fieldUi.value?.labelWrapper,
  label: fieldUi.value?.label,
  container: fieldUi.value?.container,
  description: fieldUi.value?.description,
  error: fieldUi.value?.error,
  hint: fieldUi.value?.hint,
  help: fieldUi.value?.help,
}))

function resetField() {
  form.getFieldApi(props.path, props.field).value.reset()
}

function renderLabelExtra() {
  return shellLabelExtra.value
}
</script>

<template>
  <template v-if="bare">
    <slot :label="label" :description="description" :hint="hint" :required="required" />
  </template>
  <UFormField
    v-else
    :name="path.join('.')"
    :label="shellLabel"
    :description="shellDescription"
    :hint="shellLabelExtra === undefined || shellLabelExtra === null ? shellHint : undefined"
    :error="error"
    :required="required"
    :size="formUi.controlSize.value"
    :ui="nuxtFieldUi"
  >
    <template v-if="shellLabelExtra !== undefined && shellLabelExtra !== null" #hint>
      <span :class="fieldUi?.labelExtra">
        <component :is="renderLabelExtra" />
      </span>
    </template>
    <UCollapsible
      v-if="collapsible"
      v-model:open="open"
      :class="mergeFormUiClass('grid gap-2', fieldUi?.collapsible)"
    >
      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        :icon="open ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
        :class="mergeFormUiClass('justify-self-start', fieldUi?.collapseTrigger)"
      >
        {{ open ? 'Collapse' : 'Expand' }}
      </UButton>
      <template #content>
        <div :class="mergeFormUiClass('flex items-start gap-2', fieldUi?.body)">
          <div :class="mergeFormUiClass('min-w-0 flex-1', fieldUi?.content)">
            <slot :label="label" :description="description" :hint="hint" :required="required" />
          </div>
          <UIcon
            v-if="pending"
            name="i-lucide-loader-circle"
            aria-hidden="true"
            :class="mergeFormUiClass('mt-2 size-4 shrink-0 animate-spin text-muted', fieldUi?.pending)"
          />
          <UButton
            v-if="dirty"
            icon="i-lucide-rotate-ccw"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Reset field"
            :class="fieldUi?.reset"
            @click="resetField"
          />
        </div>
      </template>
    </UCollapsible>
    <div v-else :class="mergeFormUiClass('flex items-start gap-2', fieldUi?.body)">
      <div :class="mergeFormUiClass('min-w-0 flex-1', fieldUi?.content)">
        <slot :label="label" :description="description" :hint="hint" :required="required" />
      </div>
      <UIcon
        v-if="pending"
        name="i-lucide-loader-circle"
        aria-hidden="true"
        :class="mergeFormUiClass('mt-2 size-4 shrink-0 animate-spin text-muted', fieldUi?.pending)"
      />
      <UButton
        v-if="dirty"
        icon="i-lucide-rotate-ccw"
        color="neutral"
        variant="ghost"
        size="xs"
        aria-label="Reset field"
        :class="fieldUi?.reset"
        @click="resetField"
      />
    </div>
  </UFormField>
</template>
