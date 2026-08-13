<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { useAppConfig } from 'nuxt/app'
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useFormActions } from '../../composables/use-form-actions'
import { useFormGridLayout } from '../../composables/use-form-layout'
import { provideFormRuntime, useFormRuntime } from '../../composables/use-form-runtime'
import { provideFormUi } from '../../composables/use-form-ui'
import type { FormObject, FormRendererController, FormRenderShell, FormUiConfig } from '../../types'
import type { FormValidationMode } from '../../types'
import { isRecord } from '../../utils/path'
import { getSchemaSteps } from '../../utils/state'
import { resolveFormText } from '../../utils/text'
import { mergeFormUi, mergeFormUiClass, resolveAppFormUi } from '../../utils/ui'
import FormActions from '../actions/FormActions.vue'
import FormFieldRenderer from '../renderer/FormFieldRenderer.vue'

const props = defineProps<{
  form?: FormRendererController
  schema?: unknown
  input?: FormObject
  shell?: FormRenderShell
  syncInput?: boolean | readonly string[]
  validate?: FormValidationMode
  showCloseButton?: boolean
  ui?: FormUiConfig
}>()

const router = useRouter()

const emit = defineEmits<{
  submit: [value: FormObject, result: { success: boolean; data?: unknown }]
  cancel: [value: FormObject]
}>()

const schemaRef = computed(() => props.form?.schema.value ?? props.schema ?? {})
const appConfig = useAppConfig()
const formUi = provideFormUi(
  computed<FormUiConfig>(() =>
    mergeFormUi(resolveAppFormUi(appConfig), getSchemaUi(schemaRef.value), props.ui),
  ),
)
const inputRef = computed(() => props.form?.input.value ?? props.input)
const syncInputRef = computed<boolean | readonly string[]>(
  () => props.form?.syncInput.value ?? props.syncInput ?? getSchemaSyncInput(schemaRef.value),
)
const validationModeRef = computed<FormValidationMode>(
  () =>
    props.form?.validationMode.value ?? props.validate ?? getSchemaValidationMode(schemaRef.value),
)
const runtime = useFormRuntime({
  schema: schemaRef,
  input: inputRef,
  syncInput: syncInputRef,
  validationMode: validationModeRef,
})

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

onMounted(async () => {
  await nextTick()
  const target = getSchemaAutoFocus(schemaRef.value)
  if (typeof target === 'string') {
    await runtime.focusField(target)
    return
  }
  if (target === true) await focusFirstRenderedField()
})

if (typeof window !== 'undefined') {
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!shouldConfirmDirtyNavigation()) return
    event.preventDefault()
    event.returnValue = ''
  }
  window.addEventListener('beforeunload', handleBeforeUnload)
  onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload))
}

const removeRouteGuard = router.beforeEach(() => {
  if (!shouldConfirmDirtyNavigation()) return true
  return window.confirm(getDirtyNavigationMessage())
})
onBeforeUnmount(removeRouteGuard)

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
  mergeFormUiClass(
    isOverlayShell.value ? 'flex h-full min-h-0 flex-col' : 'grid gap-5',
    formUi.ui.value.root?.ui?.root,
  ),
)
const headerClass = computed(() =>
  mergeFormUiClass(
    isOverlayShell.value ? 'shrink-0 border-b border-default bg-default px-5 py-4' : 'grid gap-3',
    formUi.ui.value.root?.ui?.header,
  ),
)
const viewportClass = computed(() =>
  mergeFormUiClass(
    isOverlayShell.value ? 'min-h-0 flex-1 overflow-y-auto px-5 py-5' : '',
    formUi.ui.value.root?.ui?.viewport,
  ),
)
const footerClass = computed(() =>
  mergeFormUiClass(
    isOverlayShell.value
      ? 'flex shrink-0 items-center justify-between gap-3 border-t border-default bg-default px-5 py-4'
      : 'flex items-center justify-between gap-3 border-t border-default pt-4',
    formUi.ui.value.root?.ui?.footer,
  ),
)
const actions = useFormActions({ runtime, shell })
const contextPending = computed<boolean>(() =>
  Object.values(runtime.context).some(
    (resource) =>
      'pending' in resource && resource.pending && typeof resource.value === 'undefined',
  ),
)

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
  if (shouldConfirmDirtyNavigation() && !window.confirm(getDirtyNavigationMessage())) return
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

function getSchemaUi(schema: unknown): FormUiConfig | undefined {
  if (!isRecord(schema)) return undefined
  const value = Object.getOwnPropertyDescriptor(schema, 'ui')?.value
  return isRecord(value) ? value : undefined
}

function getSchemaShowStepper(schema: unknown) {
  if (!isRecord(schema)) return true
  const value = Object.getOwnPropertyDescriptor(schema, 'showStepper')?.value
  return value !== false
}

function getSchemaSyncInput(schema: unknown): boolean | readonly string[] {
  const controls = getSchemaControls(schema)
  const value = controls ? Object.getOwnPropertyDescriptor(controls, 'syncInput')?.value : undefined
  if (typeof value === 'boolean') return value
  return Array.isArray(value) ? value.filter((path) => typeof path === 'string') : false
}

function getSchemaValidationMode(schema: unknown): FormValidationMode {
  const controls = getSchemaControls(schema)
  const value = controls ? Object.getOwnPropertyDescriptor(controls, 'validate')?.value : undefined
  return value === false || value === 'required' || value === 'rules' ? value : true
}

function getSchemaControls(schema: unknown) {
  if (!isRecord(schema)) return undefined
  const controls = Object.getOwnPropertyDescriptor(schema, 'controls')?.value
  return isRecord(controls) ? controls : undefined
}

function getSchemaAutoFocus(schema: unknown) {
  const controls = getSchemaControls(schema)
  const value = controls ? Object.getOwnPropertyDescriptor(controls, 'autoFocus')?.value : undefined
  return typeof value === 'string' || typeof value === 'boolean' ? value : false
}

function dirtyNavigationConfig() {
  const controls = getSchemaControls(schemaRef.value)
  return controls
    ? Object.getOwnPropertyDescriptor(controls, 'confirmNavOnDirty')?.value
    : undefined
}

function shouldConfirmDirtyNavigation() {
  if (!runtime.isDirty.value) return false
  const config = dirtyNavigationConfig()
  if (!config) return false
  if (!isRecord(config)) return config === true
  const ignored = Array.isArray(config.ignorePaths)
    ? config.ignorePaths.filter((path) => typeof path === 'string')
    : []
  return runtime.dirtyPaths.value.some(
    (path) =>
      !ignored.some((ignoredPath) => path === ignoredPath || path.startsWith(`${ignoredPath}.`)),
  )
}

function getDirtyNavigationMessage() {
  const config = dirtyNavigationConfig()
  if (!isRecord(config)) return 'You have unsaved changes. Close this form?'
  const message = Object.getOwnPropertyDescriptor(config, 'message')?.value
  return resolveFormText(message) ?? 'You have unsaved changes. Close this form?'
}

async function focusFirstRenderedField() {
  const path = runtime.currentFields.value
    .map(
      (field) => `${parentPath.value.join('.')}${parentPath.value.length ? '.' : ''}${field.key}`,
    )
    .find(Boolean)
  if (path) await runtime.focusField(path)
}
</script>

<template>
  <form :class="rootClass" @submit.prevent="submit">
    <header v-if="title || runtime.isStepped.value || isOverlayShell" :class="headerClass">
      <div
        v-if="title || isOverlayShell"
        :class="
          mergeFormUiClass(
            'flex items-start justify-between gap-4',
            formUi.ui.value.root?.ui?.headerContent,
          )
        "
      >
        <div
          v-if="title"
          :class="mergeFormUiClass('grid gap-1', formUi.ui.value.root?.ui?.heading)"
        >
          <h2
            :class="
              mergeFormUiClass(
                'text-lg font-semibold text-highlighted',
                formUi.ui.value.root?.ui?.title,
              )
            "
          >
            {{ title }}
          </h2>
        </div>

        <UButton
          v-if="isOverlayShell && showCloseButton !== false"
          type="button"
          color="neutral"
          variant="ghost"
          :size="formUi.controlSize.value"
          icon="i-lucide-x"
          :disabled="runtime.actionPending.value !== null"
          aria-label="Close form"
          :class="formUi.ui.value.root?.ui?.close"
          @click="cancel"
        />
      </div>

      <div
        v-if="runtime.isStepped.value && showStepper"
        :class="mergeFormUiClass('flex flex-wrap gap-2', formUi.ui.value.root?.ui?.stepper)"
      >
        <UBadge
          v-for="(step, index) in runtime.steps.value"
          :key="step.key"
          :color="step.active ? 'primary' : 'neutral'"
          :variant="step.active ? 'solid' : 'soft'"
          :class="formUi.ui.value.root?.ui?.step"
        >
          {{ stepLabel(index) }}
        </UBadge>
      </div>
    </header>

    <div :class="viewportClass">
      <div
        v-if="contextPending"
        data-form-skeleton
        :class="formUi.ui.value.root?.ui?.skeleton"
        :style="grid.style.value"
      >
        <div
          v-for="field in runtime.currentFields.value"
          :key="field.key"
          :class="mergeFormUiClass('grid gap-2', formUi.ui.value.root?.ui?.skeletonField)"
        >
          <USkeleton
            :class="mergeFormUiClass('h-4 w-32', formUi.ui.value.root?.ui?.skeletonLabel)"
          />
          <USkeleton
            :class="mergeFormUiClass('h-9 w-full', formUi.ui.value.root?.ui?.skeletonControl)"
          />
        </div>
      </div>
      <div v-else :class="formUi.ui.value.root?.ui?.grid" :style="grid.style.value">
        <FormFieldRenderer
          v-for="field in runtime.currentFields.value"
          :key="`${parentPath.join('.')}:${field.key}`"
          :field="field"
          :parent-path="parentPath"
        />
      </div>
    </div>

    <footer :class="footerClass">
      <FormActions :runtime="runtime" :actions="actions" @cancel="cancel" />
    </footer>
  </form>
</template>
