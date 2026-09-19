<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UCollapsible from '@nuxt/ui/components/Collapsible.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import UModal from '@nuxt/ui/components/Modal.vue'
import UTooltip from '@nuxt/ui/components/Tooltip.vue'
import { computed, ref } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import { useFormFieldBare } from '../../composables/use-form-field-chrome'
import { useFormRuntimeContext } from '../../composables/use-form-runtime'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormField } from '../../types'
import { createFormFieldInstance } from '../../utils/field-instance'
import { isRecord } from '../../utils/path'
import { isFunction, isNumber, isString } from '../../utils/predicate'
import { resolveRequired } from '../../utils/state'
import { resolveFieldDescription, resolveFormText } from '../../utils/text'
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
const { t } = useUiToolsLocale()
const descriptionConfig = computed(() =>
  field.value.capability.has('description') && 'description' in props.field
    ? resolveFieldDescription(props.field.description)
    : undefined,
)
const description = computed(() =>
  descriptionConfig.value?.display === 'inline' ? descriptionConfig.value.text : undefined,
)
const descriptionTooltip = computed(() =>
  descriptionConfig.value?.display === 'tooltip' ? descriptionConfig.value : undefined,
)
const descriptionModal = computed(() =>
  descriptionConfig.value?.display === 'modal' ? descriptionConfig.value : undefined,
)
const descriptionModalOpen = ref<boolean>(false)
const labelPosition = computed(() => {
  const layout = 'layout' in props.field ? props.field.layout : undefined
  return layout?.labelPosition ?? form.currentLayout.value.labelPosition ?? 'top'
})
const labelWidth = computed(() => {
  const layout = 'layout' in props.field ? props.field.layout : undefined
  const width = layout?.labelWidth ?? form.currentLayout.value.labelWidth
  if (isNumber(width)) {
    return `${width}px`
  }
  return isString(width) ? width : undefined
})
const orientation = computed(() => (labelPosition.value === 'left' ? 'horizontal' : 'vertical'))
const shellStyle = computed(() =>
  orientation.value === 'horizontal' && labelWidth.value
    ? { '--nut-form-label-width': labelWidth.value }
    : undefined,
)
const hint = computed(() =>
  field.value.capability.has('hint') && 'hint' in props.field
    ? resolveFormText(props.field.hint)
    : undefined,
)
const labelExtra = computed(() => {
  if (!field.value.capability.has('hint') || !('labelExtra' in props.field)) {
    return
  }
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
  if (!field.value.capability.has('validation')) {
    return false
  }
  return resolveRequired(props.field, form.getFieldCallbackParams(props.path, props.field))
})
const help = computed(() =>
  field.value.capability.has('hint') && 'help' in props.field
    ? resolveFormText(props.field.help)
    : undefined,
)
const shellHelp = computed(() => (props.inlineLabel ? undefined : help.value))
const dirty = computed(
  () =>
    'dirtyCheck' in props.field &&
    (props.field.dirtyCheck === true || schemaDirtyCheck()) &&
    form.dirtyPaths.value.includes(props.path.join('.')),
)

function schemaDirtyCheck() {
  const schema = form.schema.value
  if (!isRecord(schema) || !isRecord(schema.controls)) {
    return false
  }
  return schema.controls.dirtyCheck === true
}
const open = ref<boolean>(!('collapsed' in props.field && props.field.collapsed === true))
const collapsible = computed(() => 'collapsible' in props.field && props.field.collapsible === true)
const fieldUi = computed(() => formUi.ui.value.field?.ui)
const nuxtFieldUi = computed(() => ({
  container: mergeFormUiClass(
    orientation.value === 'horizontal' ? 'min-w-0 flex-1' : undefined,
    fieldUi.value?.container,
  ),
  description: fieldUi.value?.description,
  error: fieldUi.value?.error,
  help: fieldUi.value?.help,
  hint: fieldUi.value?.hint,
  label: fieldUi.value?.label,
  labelWrapper: mergeFormUiClass(
    orientation.value === 'horizontal' && labelWidth.value
      ? 'w-(--nut-form-label-width) shrink-0'
      : undefined,
    fieldUi.value?.labelWrapper,
  ),
  root: fieldUi.value?.root,
  wrapper: fieldUi.value?.wrapper,
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
    :help="shellHelp"
    :required="required"
    :size="formUi.controlSize.value"
    :orientation="orientation"
    :style="shellStyle"
    :ui="nuxtFieldUi"
  >
    <template v-if="shellLabel && (descriptionTooltip || descriptionModal)" #label>
      <span class="inline-flex items-center gap-1.5">
        <span>{{ shellLabel }}</span>
        <UTooltip v-if="descriptionTooltip" :text="descriptionTooltip.text">
          <UIcon
            name="i-lucide-circle-help"
            class="size-3.5 text-dimmed"
            tabindex="0"
            role="img"
            :aria-label="descriptionTooltip.text"
            data-form-description-tooltip=""
          />
        </UTooltip>
        <UModal
          v-if="descriptionModal"
          v-model:open="descriptionModalOpen"
          :title="descriptionModal.title ?? shellLabel"
          :ui="{ footer: 'justify-end' }"
        >
          <button
            type="button"
            class="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            data-form-description-modal=""
          >
            <UIcon name="i-lucide-info" class="size-3.5" aria-hidden="true" />
            {{ t('form.fields.description.more') }}
          </button>
          <template #body>
            <p class="text-sm text-default">{{ descriptionModal.text }}</p>
          </template>
          <template #footer>
            <UButton
              color="neutral"
              variant="outline"
              :label="t('form.fields.description.close')"
              @click="descriptionModalOpen = false"
            />
          </template>
        </UModal>
      </span>
    </template>
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
            :class="
              mergeFormUiClass('mt-2 size-4 shrink-0 animate-spin text-muted', fieldUi?.pending)
            "
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
