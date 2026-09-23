import { computed } from 'vue'

import { getResponsiveValue } from '../../shared/composables/use-responsive-value'
import type { FormAction, FormActionContext, FormActionKey, FormRuntime, FormValue } from '../types'
import { createPublicFormApi } from '../utils/api'
import { invokeFormFunction, isString } from '../utils/predicate'
import { resolveFormText } from '../utils/text'
import { useFormUi } from './use-form-ui'

/**
 * Turns form actions into Nuxt UI buttons: visibility, disabled and loading states, links, and
 * what a click runs. The form footer and the form page actions render from it.
 */
export function useFormActionButtons(params: {
  runtime: FormRuntime
  actions: () => readonly FormAction[]
  onCancel: () => void
}) {
  const formUi = useFormUi()
  const context = computed<FormActionContext>(() => ({
    actionPending: params.runtime.actionPending.value,
    api: createPublicFormApi(params.runtime),
    currentStep: params.runtime.currentStepIndex.value,
    isFirstStep: params.runtime.isFirstStep.value,
    isLastStep: params.runtime.isLastStep.value,
    isMultiStep: params.runtime.isStepped.value,
  }))
  const visible = computed(() =>
    params.actions().filter((action) => action.condition?.(context.value) ?? true),
  )

  async function run(action: FormAction) {
    if (action.key === 'submit') {
      return
    }
    if (action.key === 'next') {
      await params.runtime.nextStep()
      return
    }
    if (action.key === 'previous') {
      await params.runtime.previousStep()
      return
    }
    if (action.key === 'reset') {
      await params.runtime.reset()
      return
    }
    if (action.key === 'cancel') {
      params.onCancel()
      return
    }
    if ('action' in action) {
      await action.action?.(context.value)
    }
  }

  function link(action: FormAction) {
    if (!('link' in action)) {
      return
    }
    if (isString(action.link)) {
      return action.link
    }
    const resolved = invokeFormFunction(action.link, [context.value])
    return isString(resolved) ? resolved : undefined
  }

  function loading(action: FormAction) {
    const pending = params.runtime.actionPending.value
    return pending !== null && isBuiltInActionKey(action.key) && action.key === pending
  }

  function disabled(action: FormAction) {
    if (action.disabled?.(context.value)) {
      return true
    }
    return params.runtime.actionPending.value !== null && !loading(action)
  }

  /** Props of the Nuxt UI button rendering an action. */
  function button(action: FormAction) {
    const primary = action.type === 'primary'
    return {
      color: action.color ?? (primary ? 'primary' : undefined),
      disabled: disabled(action),
      icon: action.icon === false ? undefined : action.icon,
      label: resolveFormText(action.label),
      loading: loading(action),
      size: action.size ?? formUi.controlSize.value,
      to: link(action),
      trailingIcon: action.trailingIcon === false ? undefined : action.trailingIcon,
      type: action.key === 'submit' ? 'submit' : 'button',
      variant: action.variant ?? (primary ? 'solid' : undefined),
    } as const
  }

  return { button, fills, run, slot, visible }
}

/** Footer group of an action at the current breakpoint. */
function slot(action: FormAction) {
  return getResponsiveValue(action.slot ?? 'right') === 'left' ? 'left' : 'right'
}

/** True when an action fills its row at the current breakpoint. */
function fills(action: FormAction) {
  return getResponsiveValue(action.width ?? 'fit') === 'fill'
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
