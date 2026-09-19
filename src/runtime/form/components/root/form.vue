<script setup lang="ts">
import UAlert from '@nuxt/ui/components/Alert.vue'
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { useScrollShadow } from '@nuxt/ui/composables/useScrollShadow'
import { useAppConfig } from 'nuxt/app'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useFormActions } from '../../composables/use-form-actions'
import { useFormGridLayout } from '../../composables/use-form-layout'
import { provideFormRuntime, useFormRuntime } from '../../composables/use-form-runtime'
import { provideFormUi } from '../../composables/use-form-ui'
import type {
  FormValue,
  FormObject,
  FormRendererController,
  FormRenderShell,
  FormUiConfig,
  FormValidationMode,
} from '../../types'
import { isRecord } from '../../utils/path'
import {
  isBoolean,
  isFunction,
  isNumber,
  isString,
  isUndefined,
  stringArray,
} from '../../utils/predicate'
import { getSchemaFields, getSchemaSteps, isSteppedSchema } from '../../utils/state'
import { resolveFormText } from '../../utils/text'
import { mergeFormUi, mergeFormUiClass, resolveAppFormUi } from '../../utils/ui'
import FormActions from '../actions/form-actions.vue'
import FormFieldRenderer from '../renderer/form-field-renderer.vue'
import FormDirectionalTransition from '../utils/form-directional-transition.vue'

const props = defineProps<{
  form?: FormRendererController
  schema?: FormValue
  input?: FormObject
  shell?: FormRenderShell
  syncInput?: boolean | readonly string[]
  validate?: FormValidationMode
  showCloseButton?: boolean
  ui?: FormUiConfig
}>()

const router = useRouter()

const emit = defineEmits<{
  submit: [value: FormObject, result: { success: boolean; data?: FormValue }]
  cancel: [value: FormObject]
}>()
const { t } = useUiToolsLocale()

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
  input: inputRef,
  schema: schemaRef,
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
  if (isString(target)) {
    await runtime.focusField(target)
    return
  }
  if (target === true) {
    await focusFirstRenderedField()
  }
})

if (import.meta.client) {
  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (!shouldConfirmDirtyNavigation()) {
      return
    }
    event.preventDefault()
    event.returnValue = ''
  }
  window.addEventListener('beforeunload', handleBeforeUnload)
  onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload))
}

const removeRouteGuard = router.beforeEach(() => {
  if (!shouldConfirmDirtyNavigation()) {
    return true
  }
  return window.confirm(getDirtyNavigationMessage())
})
onBeforeUnmount(removeRouteGuard)

const viewportRef = ref<HTMLElement | null>(null)
const viewportShadow = useScrollShadow(viewportRef, { size: 20 })
const displayedStepIndex = ref<number>(runtime.currentStepIndex.value)
const stepTransitionDirection = ref<'forward' | 'backward'>('forward')
const stepTransitioning = ref<boolean>(false)
watch(
  () => runtime.currentStepIndex.value,
  (nextIndex) => {
    stepTransitionDirection.value = nextIndex > displayedStepIndex.value ? 'forward' : 'backward'
    nextTick().then(() => {
      displayedStepIndex.value = nextIndex
    })
  },
)
const parentPath = computed(() =>
  runtime.currentStepRoot.value ? [runtime.currentStepRoot.value] : [],
)
const displayedStep = computed(() =>
  isSteppedSchema(schemaRef.value)
    ? getSchemaSteps(schemaRef.value)[displayedStepIndex.value]
    : undefined,
)
const displayedFields = computed(() =>
  isSteppedSchema(schemaRef.value)
    ? (displayedStep.value?.fields ?? [])
    : getSchemaFields(schemaRef.value),
)
const displayedParentPath = computed(() =>
  displayedStep.value?.root ? [displayedStep.value.root] : [],
)
const title = computed(() => resolveFormText(getSchemaTitle(schemaRef.value)))
const eyebrow = computed(() => resolveFormText(getSchemaText(schemaRef.value, 'eyebrow')))
const description = computed(() => resolveFormText(getSchemaText(schemaRef.value, 'description')))
const showStepper = computed(() => getSchemaShowStepper(schemaRef.value))
const grid = useFormGridLayout({ layout: runtime.currentLayout })
const shell = computed(() => props.shell ?? 'inline')
const isOverlayShell = computed(
  () => shell.value === 'drawer' || shell.value === 'modal' || shell.value === 'fullscreen',
)
const rootClass = computed(() =>
  mergeFormUiClass(
    isOverlayShell.value
      ? 'flex h-full min-h-0 w-full min-w-0 flex-col'
      : 'flex min-w-0 flex-col gap-4',
    stepTransitioning.value ? 'overflow-hidden' : undefined,
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
    isOverlayShell.value
      ? `min-h-0 flex-1 overflow-y-auto px-5 py-5${stepTransitioning.value ? ' overflow-hidden' : ''}`
      : stepTransitioning.value
        ? 'overflow-hidden'
        : '',
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
    (resource) => 'pending' in resource && resource.pending && isUndefined(resource.value),
  ),
)
const contextLoading = computed<boolean>(() =>
  Object.values(runtime.context).some((resource) => 'loading' in resource && resource.loading),
)
const contextError = computed<string | undefined>(() => {
  for (const resource of Object.values(runtime.context)) {
    if (!('error' in resource) || !resource.error) {
      continue
    }
    if (resource.error instanceof Error) {
      return resource.error.message
    }
    if (isString(resource.error)) {
      return resource.error
    }
    return t('form.states.contextError.description')
  }
})

async function submit() {
  if (props.form) {
    const result = await props.form.submitHandler()
    if (result.success) {
      emit('submit', runtime.output.value, result)
    }
    return
  }

  const result = await runtime.submitHandler()
  if (result.success) {
    emit('submit', runtime.output.value, result)
  }
}

async function refreshContext() {
  await Promise.all(
    Object.values(runtime.context).flatMap((resource) =>
      'refresh' in resource ? [resource.refresh()] : [],
    ),
  )
}

function cancel() {
  if (shouldConfirmDirtyNavigation() && !window.confirm(getDirtyNavigationMessage())) {
    return
  }
  emit('cancel', runtime.output.value)
}

defineExpose({
  actionPending: runtime.actionPending,
  dirtyPaths: runtime.dirtyPaths,
  errors: runtime.errors,
  focus: runtime.focusField,
  focusFirstInvalid: runtime.focusFirstInvalid,
  isDirty: runtime.isDirty,
  nextStep: runtime.nextStep,
  output: runtime.output,
  previousStep: runtime.previousStep,
  reset: runtime.reset,
  state: computed(() => runtime.state),
  submit: runtime.submit,
  submitHandler: runtime.submitHandler,
  validate: runtime.validate,
})

function stepLabel(index: number) {
  return runtime.steps.value[index]?.label ?? `Step ${index + 1}`
}

function getSchemaText(schema: FormValue, key: string) {
  if (!isRecord(schema)) {
    return
  }
  const value = Object.getOwnPropertyDescriptor(schema, key)?.value
  return isString(value) || isNumber(value) || isFunction(value) ? value : undefined
}

function getSchemaTitle(schema: FormValue) {
  if (!isRecord(schema)) {
    return
  }
  const value = Object.getOwnPropertyDescriptor(schema, 'title')?.value
  return isString(value) || isNumber(value) || isFunction(value) ? value : undefined
}

function getSchemaUi(schema: FormValue): FormUiConfig | undefined {
  if (!isRecord(schema)) {
    return undefined
  }
  const value = Object.getOwnPropertyDescriptor(schema, 'ui')?.value
  return isRecord(value) ? value : undefined
}

function getSchemaShowStepper(schema: FormValue) {
  if (!isRecord(schema)) {
    return true
  }
  const value = Object.getOwnPropertyDescriptor(schema, 'showStepper')?.value
  return value !== false
}

function getSchemaSyncInput(schema: FormValue): boolean | readonly string[] {
  const controls = getSchemaControls(schema)
  const value = controls ? Object.getOwnPropertyDescriptor(controls, 'syncInput')?.value : undefined
  if (isBoolean(value)) {
    return value
  }
  return stringArray(value)
}

function getSchemaValidationMode(schema: FormValue): FormValidationMode {
  const controls = getSchemaControls(schema)
  const value = controls ? Object.getOwnPropertyDescriptor(controls, 'validate')?.value : undefined
  return value === false || value === 'required' || value === 'rules' ? value : true
}

function getSchemaControls(schema: FormValue) {
  if (!isRecord(schema)) {
    return
  }
  const controls = Object.getOwnPropertyDescriptor(schema, 'controls')?.value
  return isRecord(controls) ? controls : undefined
}

function getSchemaAutoFocus(schema: FormValue) {
  const controls = getSchemaControls(schema)
  const value = controls ? Object.getOwnPropertyDescriptor(controls, 'autoFocus')?.value : undefined
  return isString(value) || isBoolean(value) ? value : false
}

function dirtyNavigationConfig() {
  const controls = getSchemaControls(schemaRef.value)
  return controls
    ? Object.getOwnPropertyDescriptor(controls, 'confirmNavOnDirty')?.value
    : undefined
}

function shouldConfirmDirtyNavigation() {
  if (!runtime.isDirty.value) {
    return false
  }
  const config = dirtyNavigationConfig()
  if (!config) {
    return false
  }
  if (!isRecord(config)) {
    return config === true
  }
  const ignored = stringArray(config.ignorePaths)
  return runtime.dirtyPaths.value.some(
    (path) =>
      !ignored.some((ignoredPath) => path === ignoredPath || path.startsWith(`${ignoredPath}.`)),
  )
}

function getDirtyNavigationMessage() {
  const config = dirtyNavigationConfig()
  if (!isRecord(config)) {
    return 'You have unsaved changes. Close this form?'
  }
  const message = Object.getOwnPropertyDescriptor(config, 'message')?.value
  return resolveFormText(message) ?? 'You have unsaved changes. Close this form?'
}

async function focusFirstRenderedField() {
  const paths = runtime.currentFields.value.map(
    (field) => `${parentPath.value.join('.')}${parentPath.value.length ? '.' : ''}${field.key}`,
  )
  for (const path of paths) {
    if (await runtime.focusField(path)) {
      return
    }
  }
}
</script>

<template>
  <form novalidate :class="rootClass" @submit.prevent="submit">
    <header
      v-if="title || eyebrow || description || runtime.isStepped.value || isOverlayShell"
      :class="headerClass"
    >
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
          v-if="title || eyebrow || description"
          :class="mergeFormUiClass('grid min-w-0 gap-1', formUi.ui.value.root?.ui?.heading)"
        >
          <p
            v-if="eyebrow"
            :class="
              mergeFormUiClass(
                'text-[11px] font-semibold uppercase tracking-[0.08em] text-(--nut-form-eyebrow,var(--ui-primary))',
                formUi.ui.value.root?.ui?.eyebrow,
              )
            "
          >
            {{ eyebrow }}
          </p>
          <h2
            v-if="title"
            :class="
              mergeFormUiClass(
                'text-lg font-semibold tracking-tight text-highlighted',
                formUi.ui.value.root?.ui?.title,
              )
            "
          >
            {{ title }}
          </h2>
          <p
            v-if="description"
            :class="
              mergeFormUiClass(
                'max-w-[56ch] text-[13px] leading-relaxed text-muted',
                formUi.ui.value.root?.ui?.description,
              )
            "
          >
            {{ description }}
          </p>
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

    <div
      ref="viewportRef"
      :class="viewportClass"
      :style="isOverlayShell ? viewportShadow.style.value : undefined"
    >
      <UAlert
        v-if="contextError"
        color="error"
        variant="soft"
        icon="i-lucide-circle-alert"
        :title="t('form.states.contextError.title')"
        :description="contextError"
        class="mb-4"
      >
        <template #actions>
          <UButton
            type="button"
            color="error"
            variant="outline"
            size="xs"
            :loading="contextLoading"
            @click="refreshContext"
          >
            {{ t('form.states.contextError.action') }}
          </UButton>
        </template>
      </UAlert>
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
      <div v-else class="relative min-w-0">
        <FormDirectionalTransition
          :direction="stepTransitionDirection"
          @before-enter="stepTransitioning = true"
          @after-enter="stepTransitioning = false"
        >
          <div
            :key="displayedStepIndex"
            class="grid min-w-0"
            style="grid-template-rows: minmax(0, 1fr)"
          >
            <div
              :class="
                mergeFormUiClass('h-full min-w-0 gap-4 text-left', formUi.ui.value.root?.ui?.grid)
              "
              :style="grid.style.value"
            >
              <FormFieldRenderer
                v-for="field in displayedFields"
                :key="`${displayedParentPath.join('.')}:${field.key}`"
                :field="field"
                :parent-path="displayedParentPath"
              />
            </div>
          </div>
        </FormDirectionalTransition>
      </div>
    </div>

    <footer :class="footerClass">
      <FormActions :runtime="runtime" :actions="actions" @cancel="cancel" />
    </footer>
  </form>
</template>
