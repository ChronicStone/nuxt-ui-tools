<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'

import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'

import type { FormLayoutConfig, FormObject, FormRendererController } from '../../types'
import { isRecord } from '../../utils/path'
import { provideFormRuntime, useFormRuntime } from '../../composables/use-form-runtime'
import { getSchemaLayout, getSchemaSteps } from '../../utils/state'
import { resolveFormText } from '../../utils/text'
import FormFieldRenderer from '../renderer/FormFieldRenderer.vue'

const props = defineProps<{
  form?: FormRendererController
  schema?: unknown
  input?: FormObject
}>()

const emit = defineEmits<{
  submit: [value: FormObject]
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
const layout = computed(() => currentStep.value?.layout ?? getSchemaLayout(schemaRef.value) ?? {})
const parentPath = computed(() => runtime.currentStepRoot.value ? [runtime.currentStepRoot.value] : [])
const title = computed(() => resolveFormText(getSchemaTitle(schemaRef.value)))
const showStepper = computed(() => getSchemaShowStepper(schemaRef.value))
const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${normalizeColumns(layout.value)}, minmax(0, 1fr))`,
  gap: normalizeGap(layout.value),
}))

async function submit() {
  if (props.form) {
    await props.form.submit()
    return
  }

  const result = await runtime.submitHandler()
  if (result.success) emit('submit', runtime.output.value)
}

defineExpose({
  state: computed(() => runtime.state),
  output: runtime.output,
  dirtyPaths: runtime.dirtyPaths,
  isDirty: runtime.isDirty,
  errors: runtime.errors,
  actionPending: runtime.actionPending,
  validate: runtime.validate,
  submit: runtime.submit,
  submitHandler: runtime.submitHandler,
  reset: runtime.reset,
  nextStep: runtime.nextStep,
  previousStep: runtime.previousStep,
})

function stepLabel(index: number) {
  return runtime.steps.value[index]?.label ?? `Step ${index + 1}`
}

function normalizeColumns(config: FormLayoutConfig) {
  const value = config.columns ?? 1
  if (typeof value === 'number') return Math.max(1, value)

  const parsed = Number(value)
  if (Number.isFinite(parsed)) return Math.max(1, parsed)
  return 1
}

function normalizeGap(config: FormLayoutConfig) {
  const value = config.gap ?? 16
  if (typeof value === 'number') return `${value}px`
  return value
}

function getSchemaTitle(schema: unknown) {
  if (!isRecord(schema)) return undefined
  const value = Object.getOwnPropertyDescriptor(schema, 'title')?.value
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'function' ? value : undefined
}

function getSchemaShowStepper(schema: unknown) {
  if (!isRecord(schema)) return true
  const value = Object.getOwnPropertyDescriptor(schema, 'showStepper')?.value
  return value !== false
}
</script>

<template>
  <form class="grid gap-5" @submit.prevent="submit">
    <header v-if="title || runtime.isStepped.value" class="grid gap-3">
      <div v-if="title" class="grid gap-1">
        <h2 class="text-lg font-semibold text-highlighted">
          {{ title }}
        </h2>
      </div>

      <div
        v-if="runtime.isStepped.value && showStepper"
        class="flex flex-wrap gap-2"
      >
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

    <div :style="gridStyle">
      <FormFieldRenderer
        v-for="field in runtime.currentFields.value"
        :key="`${parentPath.join('.')}:${field.key}`"
        :field="field"
        :parent-path="parentPath"
      />
    </div>

    <footer class="flex items-center justify-between gap-3 border-t border-default pt-4">
      <UButton
        type="button"
        color="neutral"
        variant="ghost"
        icon="i-lucide-rotate-ccw"
        @click="runtime.reset"
      >
        Reset
      </UButton>

      <div class="flex items-center gap-2">
        <UButton
          v-if="runtime.isStepped.value"
          type="button"
          color="neutral"
          variant="soft"
          icon="i-lucide-arrow-left"
          :disabled="runtime.currentStepIndex.value === 0"
          @click="() => {
            runtime.previousStep()
          }"
        >
          Previous
        </UButton>

        <UButton
          v-if="runtime.isStepped.value && runtime.currentStepIndex.value < runtime.steps.value.length - 1"
          type="button"
          trailing-icon="i-lucide-arrow-right"
          @click="async () => {
            await runtime.nextStep()
          }"
        >
          Next
        </UButton>

        <UButton
          v-else
          type="submit"
          trailing-icon="i-lucide-check"
        >
          Submit
        </UButton>
      </div>
    </footer>
  </form>
</template>
