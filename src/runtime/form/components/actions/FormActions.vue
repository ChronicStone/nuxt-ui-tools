<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import { getResponsiveValue } from '../../../shared/composables/use-responsive-value'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormValue } from '../../types'
import type { FormAction, FormActionContext, FormActionKey, FormRuntime } from '../../types'
import { createPublicFormApi } from '../../utils/api'
import { invokeFormFunction, isString } from '../../utils/predicate'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'

const props = defineProps<{
  runtime: FormRuntime
  actions: readonly FormAction[]
}>()
const formUi = useFormUi()

const emit = defineEmits<{
  cancel: []
}>()

const actionContext = computed<FormActionContext>(() => ({
  currentStep: props.runtime.currentStepIndex.value,
  api: createPublicFormApi(props.runtime),
  actionPending: props.runtime.actionPending.value,
  isMultiStep: props.runtime.isStepped.value,
  isFirstStep: props.runtime.isFirstStep.value,
  isLastStep: props.runtime.isLastStep.value,
}))
const visibleActions = computed(() =>
  props.actions.filter((action) => action.condition?.(actionContext.value) ?? true),
)
const actionsLeft = computed(() =>
  visibleActions.value.filter((action) => resolveActionSlot(action) === 'left'),
)
const actionsRight = computed(() =>
  visibleActions.value.filter((action) => resolveActionSlot(action) !== 'left'),
)

async function runAction(action: FormAction) {
  if (isBuiltInAction(action, 'submit')) return
  if (isBuiltInAction(action, 'next')) {
    await props.runtime.nextStep()
    return
  }
  if (isBuiltInAction(action, 'previous')) {
    await props.runtime.previousStep()
    return
  }
  if (isBuiltInAction(action, 'reset')) {
    props.runtime.reset()
    return
  }
  if (isBuiltInAction(action, 'cancel')) {
    emit('cancel')
    return
  }

  if ('action' in action) await action.action?.(actionContext.value)
}

function resolveActionLabel(action: FormAction) {
  return resolveFormText(action.label)
}

function resolveActionSlot(action: FormAction) {
  const slot = getResponsiveValue(action.slot ?? 'right')
  return slot === 'left' ? 'left' : 'right'
}

function resolveActionWidth(action: FormAction) {
  const width = getResponsiveValue(action.width ?? 'fit')
  return width === 'fill' ? 'fill' : 'fit'
}

function resolveActionLink(action: FormAction) {
  if (!('link' in action)) return undefined
  if (isString(action.link)) return action.link
  const link = invokeFormFunction(action.link, [actionContext.value])
  return isString(link) ? link : undefined
}

function isActionDisabled(action: FormAction) {
  const disabled = action.disabled?.(actionContext.value) ?? false
  if (disabled) return true
  if (!props.runtime.actionPending.value) return false
  return !isActionLoading(action)
}

function isActionLoading(action: FormAction) {
  if (!isBuiltInActionKey(action.key)) return false
  const pending = props.runtime.actionPending.value
  if (pending === null) return false
  return action.key === pending
}

function resolveActionColor(action: FormAction) {
  if (action.color) return action.color
  if (action.type === 'primary') return 'primary'
  return undefined
}

function resolveActionVariant(action: FormAction) {
  if (action.variant) return action.variant
  if (action.type === 'primary') return 'solid'
  return undefined
}

function actionButtonClass(action: FormAction) {
  return mergeFormUiClass(
    resolveActionWidth(action) === 'fill' ? 'flex-1 justify-center' : undefined,
    formUi.ui.value.actions?.ui?.button,
    action.class,
  )
}

function isBuiltInAction(action: FormAction, key: FormActionKey) {
  return action.key === key
}

function isBuiltInActionKey(value: FormValue): value is FormActionKey {
  return (
    value === 'reset' ||
    value === 'cancel' ||
    value === 'submit' ||
    value === 'previous' ||
    value === 'next'
  )
}
</script>

<template>
  <div
    :class="
      mergeFormUiClass(
        'flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        formUi.ui.value.actions?.ui?.root,
      )
    "
  >
    <div
      v-if="actionsLeft.length"
      :class="
        mergeFormUiClass(
          'flex min-w-0 flex-1 flex-wrap items-center justify-start gap-2',
          formUi.ui.value.actions?.ui?.left,
        )
      "
    >
      <UButton
        v-for="(action, index) in actionsLeft"
        :key="action.key ?? index"
        :type="isBuiltInAction(action, 'submit') ? 'submit' : 'button'"
        :to="resolveActionLink(action)"
        :label="resolveActionLabel(action)"
        :icon="action.icon === false ? undefined : action.icon"
        :trailing-icon="action.trailingIcon === false ? undefined : action.trailingIcon"
        :color="resolveActionColor(action)"
        :variant="resolveActionVariant(action)"
        :size="action.size ?? formUi.controlSize.value"
        :class="actionButtonClass(action)"
        :disabled="isActionDisabled(action)"
        :loading="isActionLoading(action)"
        @click="runAction(action)"
      />
    </div>

    <div
      v-if="actionsRight.length"
      :class="
        mergeFormUiClass(
          'flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2',
          formUi.ui.value.actions?.ui?.right,
        )
      "
    >
      <UButton
        v-for="(action, index) in actionsRight"
        :key="action.key ?? index"
        :type="isBuiltInAction(action, 'submit') ? 'submit' : 'button'"
        :to="resolveActionLink(action)"
        :label="resolveActionLabel(action)"
        :icon="action.icon === false ? undefined : action.icon"
        :trailing-icon="action.trailingIcon === false ? undefined : action.trailingIcon"
        :color="resolveActionColor(action)"
        :variant="resolveActionVariant(action)"
        :size="action.size ?? formUi.controlSize.value"
        :class="actionButtonClass(action)"
        :disabled="isActionDisabled(action)"
        :loading="isActionLoading(action)"
        @click="runAction(action)"
      />
    </div>
  </div>
</template>
