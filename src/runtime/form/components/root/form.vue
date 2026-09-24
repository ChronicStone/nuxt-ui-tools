<script setup lang="ts">
import UAlert from '@nuxt/ui/components/Alert.vue'
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { useScrollShadow } from '@nuxt/ui/composables/useScrollShadow'
import { computed, nextTick, ref, watch } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useFormActions } from '../../composables/use-form-actions'
import { useFormGridLayout } from '../../composables/use-form-layout'
import { useFormRoot } from '../../composables/use-form-root'
import type {
  FormValue,
  FormHeaderDisplay,
  FormObject,
  FormRendererController,
  FormRenderShell,
  FormUiConfig,
  FormValidationMode,
} from '../../types'
import { getFormHeader } from '../../utils/overlay'
import { isRecord } from '../../utils/path'
import { isFunction, isNumber, isString } from '../../utils/predicate'
import { getSchemaFields, getSchemaSteps, isSteppedSchema } from '../../utils/state'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'
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

const emit = defineEmits<{
  submit: [value: FormObject, result: { success: boolean; data?: FormValue }]
  cancel: [value: FormObject]
}>()
const { t } = useUiToolsLocale()

const {
  cancel,
  contextError,
  contextLoading,
  contextPending,
  formUi,
  refreshContext,
  runtime,
  schema: schemaRef,
  submit,
} = useFormRoot({
  form: () => props.form,
  input: () => props.input,
  onCancelled: (value) => emit('cancel', value),
  onSubmitted: (value, result) => emit('submit', value, result),
  schema: () => props.schema,
  syncInput: () => props.syncInput,
  ui: () => props.ui,
  validate: () => props.validate,
})

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
const header = computed(() => getFormHeader(schemaRef.value))
const title = computed(() => resolveFormText(getHeaderText(header.value, 'title')))
const eyebrow = computed(() => resolveFormText(getHeaderText(header.value, 'eyebrow')))
const description = computed(() => resolveFormText(getHeaderText(header.value, 'description')))
const showHeading = computed(() => {
  if (!title.value && !eyebrow.value && !description.value) {
    return false
  }
  return headerDisplayed(getHeaderDisplay(header.value), shell.value)
})
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
    isOverlayShell.value ? 'shrink-0 bg-default px-[22px] pt-5' : 'grid gap-3',
    formUi.ui.value.root?.ui?.header,
  ),
)
const viewportClass = computed(() =>
  mergeFormUiClass(
    isOverlayShell.value
      ? `min-h-0 flex-1 overflow-y-auto px-[22px] pt-[18px] pb-2${stepTransitioning.value ? ' overflow-hidden' : ''}`
      : stepTransitioning.value
        ? 'overflow-hidden'
        : '',
    formUi.ui.value.root?.ui?.viewport,
  ),
)
const footerClass = computed(() =>
  mergeFormUiClass(
    isOverlayShell.value
      ? 'flex shrink-0 items-center justify-between gap-3 border-t border-default bg-default px-[22px] pt-3.5 pb-[18px]'
      : 'flex items-center justify-between gap-3',
    formUi.ui.value.root?.ui?.footer,
  ),
)
const actions = useFormActions({
  runtime,
  slot: () => (shell.value === 'inline' ? 'left' : 'right'),
})

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

function getHeaderText(headerConfig: FormValue, key: string) {
  if (!isRecord(headerConfig)) {
    return
  }
  const value = Object.getOwnPropertyDescriptor(headerConfig, key)?.value
  return isString(value) || isNumber(value) || isFunction(value) ? value : undefined
}

function getHeaderDisplay(headerConfig: FormValue): FormHeaderDisplay {
  if (!isRecord(headerConfig)) {
    return 'overlay'
  }
  const value = Object.getOwnPropertyDescriptor(headerConfig, 'display')?.value
  if (value === 'always' || value === 'never' || value === 'overlay') {
    return value
  }
  return Array.isArray(value) ? value.filter(isRenderShell) : 'overlay'
}

function headerDisplayed(display: FormHeaderDisplay, currentShell: FormRenderShell) {
  if (display === 'always') {
    return true
  }
  if (display === 'never') {
    return false
  }
  if (display === 'overlay') {
    return currentShell !== 'inline'
  }
  return display.includes(currentShell)
}

function isRenderShell(value: FormValue): value is FormRenderShell {
  return value === 'inline' || value === 'drawer' || value === 'modal' || value === 'fullscreen'
}

function getSchemaShowStepper(schema: FormValue) {
  if (!isRecord(schema)) {
    return true
  }
  const value = Object.getOwnPropertyDescriptor(schema, 'showStepper')?.value
  return value !== false
}
</script>

<template>
  <form novalidate :class="rootClass" @submit.prevent="submit">
    <header v-if="showHeading || runtime.isStepped.value || isOverlayShell" :class="headerClass">
      <div
        v-if="showHeading || isOverlayShell"
        :class="
          mergeFormUiClass(
            'flex items-start justify-between gap-4',
            formUi.ui.value.root?.ui?.headerContent,
          )
        "
      >
        <div
          v-if="showHeading"
          :class="mergeFormUiClass('grid min-w-0 gap-1', formUi.ui.value.root?.ui?.heading)"
        >
          <p
            v-if="eyebrow"
            :class="
              mergeFormUiClass(
                'text-[11px] font-semibold uppercase tracking-[0.08em] text-(--nut-form-eyebrow,var(--ui-color-primary-700,var(--ui-primary))) dark:text-(--nut-form-eyebrow,var(--ui-color-primary-400,var(--ui-primary)))',
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
                'text-lg font-semibold leading-[1.3] tracking-tight text-highlighted',
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
