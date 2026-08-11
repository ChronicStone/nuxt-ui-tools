<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import { computed, onBeforeUnmount, watch } from 'vue'

import { useFormActions } from '../../composables/use-form-actions'
import { useFormGridLayout } from '../../composables/use-form-layout'
import { provideFormRuntime, useFormRuntime } from '../../composables/use-form-runtime'
import type { FormObject, FormRendererController, FormRenderShell } from '../../types'
import { isRecord } from '../../utils/path'
import { getSchemaSteps } from '../../utils/state'
import { resolveFormText } from '../../utils/text'
import FormActions from '../actions/FormActions.vue'
import FormFieldRenderer from '../renderer/FormFieldRenderer.vue'

const props = defineProps<{
  form?: FormRendererController
  schema?: unknown
  input?: FormObject
  shell?: FormRenderShell
}>()

const emit = defineEmits<{
  submit: [value: FormObject, result: { success: boolean; data?: unknown }]
  cancel: [value: FormObject]
}>()

const schemaRef = computed(() => props.form?.schema.value ?? props.schema ?? {})
const inputRef = computed(() => props.form?.input.value ?? props.input)
const runtime = useFormRuntime({ schema: schemaRef, input: inputRef })

provideFormRuntime(runtime)

watch(
  () => props.form,
  (controller, previousController) => {
    previousController?.unbind(runtime)
    controller?.bind(runtime)
  },
  { immediate: true },
)

onBeforeUnmount(() => props.form?.unbind(runtime))

const currentStep = computed(() => getSchemaSteps(schemaRef.value)[runtime.currentStepIndex.value])
const parentPath = computed(() =>
  runtime.currentStepRoot.value ? [runtime.currentStepRoot.value] : [],
)
const title = computed(() => resolveFormText(getSchemaTitle(schemaRef.value)))
const showStepper = computed(() => getSchemaShowStepper(schemaRef.value))
const grid = useFormGridLayout({ layout: runtime.currentLayout })
const shell = computed(() => props.shell ?? 'inline')
const isOverlayShell = computed(
  () => shell.value === 'drawer' || shell.value === 'modal' || shell.value === 'fullscreen',
)
const rootClass = computed(() =>
  isOverlayShell.value ? 'flex h-full min-h-0 flex-col' : 'grid gap-5',
)
const headerClass = computed(() =>
  isOverlayShell.value ? 'shrink-0 border-b border-default bg-default px-5 py-4' : 'grid gap-3',
)
const viewportClass = computed(() =>
  isOverlayShell.value ? 'min-h-0 flex-1 overflow-y-auto px-5 py-5' : '',
)
const footerClass = computed(() =>
  isOverlayShell.value
    ? 'flex shrink-0 items-center justify-between gap-3 border-t border-default bg-default px-5 py-4'
    : 'flex items-center justify-between gap-3 border-t border-default pt-4',
)
const actions = useFormActions({ runtime, shell })

async function submit() {
  if (props.form) {
    const result = await props.form.submitHandler()
    if (result.success) emit('submit', runtime.output.value, result)
    return
  }

  const result = await runtime.submitHandler()
  if (result.success) emit('submit', runtime.output.value, result)
}

function cancel() {
  emit('cancel', runtime.output.value)
}

defineExpose({
  state: computed(() => runtime.state),
  output: runtime.output,
  dirtyPaths: runtime.dirtyPaths,
  isDirty: runtime.isDirty,
  errors: runtime.errors,
  actionPending: runtime.actionPending,
  validate: runtime.validate,
  focus: runtime.focusField,
  focusFirstInvalid: runtime.focusFirstInvalid,
  submit: runtime.submit,
  submitHandler: runtime.submitHandler,
  reset: runtime.reset,
  nextStep: runtime.nextStep,
  previousStep: runtime.previousStep,
})

function stepLabel(index: number) {
  return runtime.steps.value[index]?.label ?? `Step ${index + 1}`
}

function getSchemaTitle(schema: unknown) {
  if (!isRecord(schema)) return undefined
  const value = Object.getOwnPropertyDescriptor(schema, 'title')?.value
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'function'
    ? value
    : undefined
}

function getSchemaShowStepper(schema: unknown) {
  if (!isRecord(schema)) return true
  const value = Object.getOwnPropertyDescriptor(schema, 'showStepper')?.value
  return value !== false
}
</script>

<template>
  <form :class="rootClass" @submit.prevent="submit">
    <header v-if="title || runtime.isStepped.value || isOverlayShell" :class="headerClass">
      <div v-if="title || isOverlayShell" class="flex items-start justify-between gap-4">
        <div v-if="title" class="grid gap-1">
          <h2 class="text-lg font-semibold text-highlighted">
            {{ title }}
          </h2>
        </div>

        <UButton
          v-if="isOverlayShell"
          type="button"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-x"
          :disabled="runtime.actionPending.value !== null"
          aria-label="Close form"
          @click="cancel"
        />
      </div>

      <div v-if="runtime.isStepped.value && showStepper" class="flex flex-wrap gap-2">
        <UBadge
          v-for="(step, index) in runtime.steps.value"
          :key="step.key"
          :color="step.active ? 'primary' : 'neutral'"
          :variant="step.active ? 'solid' : 'soft'"
        >
          {{ stepLabel(index) }}
        </UBadge>
      </div>
    </header>

    <div :class="viewportClass">
      <div :style="grid.style.value">
        <FormFieldRenderer
          v-for="field in runtime.currentFields.value"
          :key="`${parentPath.join('.')}:${field.key}`"
          :field="field"
          :parent-path="parentPath"
        />
      </div>
    </div>

    <footer :class="footerClass">
      <FormActions :runtime="runtime" :actions="actions" @submit="submit" @cancel="cancel" />
    </footer>
  </form>
</template>
