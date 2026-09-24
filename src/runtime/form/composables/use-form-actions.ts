import { computed } from 'vue'

import { useUiToolsLocale } from '../../i18n/use-locale'
import type { FormValue, FormAction, FormActionKey, FormActionSlot, FormRuntime } from '../types'
import { isRecord } from '../utils/path'

interface UseFormActionsParams {
  runtime: FormRuntime
  /** Slot the built-in actions take unless an authored action sets its own. */
  slot: () => FormActionSlot
}

/** Resolves the actions of the current schema or step, completing built-in actions. */
export function useFormActions(params: UseFormActionsParams) {
  const { t } = useUiToolsLocale()

  return computed<readonly FormAction[]>(() => {
    const configuredActions =
      getCurrentStepActions(params.runtime) ?? getSchemaActions(params.runtime.schema.value)
    if (configuredActions) {
      return configuredActions.map((action) => normalizeFormAction(action, params, t))
    }

    if (!params.runtime.isStepped.value) {
      return [getBaseFormAction('submit', params, t)]
    }

    return [
      getBaseFormAction('previous', params, t),
      getBaseFormAction('next', params, t),
      getBaseFormAction('submit', params, t),
    ]
  })
}

function normalizeFormAction(
  action: FormAction,
  params: UseFormActionsParams,
  t: (key: string) => string,
): FormAction {
  if (!isBaseFormAction(action)) {
    return action
  }
  return {
    ...getBaseFormAction(action.key, params, t),
    ...action,
  }
}

function getBaseFormAction(
  key: FormActionKey,
  params: UseFormActionsParams,
  t: (key: string) => string,
): FormAction {
  const slot = params.slot()
  if (key === 'submit') {
    return {
      condition: (context) => (context.isMultiStep ? context.isLastStep : true),
      key,
      label: () => t('form.actions.submitButton'),
      slot,
      type: 'primary',
      width: 'fill md:fit',
    }
  }
  if (key === 'next') {
    return {
      condition: (context) => !context.isLastStep,
      key,
      label: () => t('form.actions.nextButton'),
      slot,
      type: 'primary',
      width: 'fill md:fit',
    }
  }
  if (key === 'previous') {
    return {
      color: 'neutral',
      disabled: (context) => context.isFirstStep,
      key,
      label: () => t('form.actions.prevButton'),
      slot,
      variant: 'outline',
      width: 'fill md:fit',
    }
  }
  if (key === 'reset') {
    return {
      color: 'neutral',
      key,
      label: () => t('form.actions.resetButton'),
      slot,
      variant: 'outline',
      width: 'fill md:fit',
    }
  }

  return {
    color: 'neutral',
    key,
    label: () => t('form.actions.cancelButton'),
    slot,
    variant: 'outline',
    width: 'fill md:fit',
  }
}

function getSchemaActions(schema: FormValue) {
  if (!isRecord(schema)) {
    return
  }
  const actions = Object.getOwnPropertyDescriptor(schema, 'actions')?.value
  return isFormActionList(actions) ? actions : undefined
}

function getCurrentStepActions(runtime: FormRuntime) {
  if (!runtime.isStepped.value) {
    return
  }
  const schema = runtime.schema.value
  if (!isRecord(schema)) {
    return
  }

  const steps = Object.getOwnPropertyDescriptor(schema, 'steps')?.value
  if (!Array.isArray(steps)) {
    return
  }

  const step = steps[runtime.currentStepIndex.value]
  if (!isRecord(step)) {
    return
  }

  const actions = Object.getOwnPropertyDescriptor(step, 'actions')?.value
  return isFormActionList(actions) ? actions : undefined
}

function isFormActionList(value: FormValue): value is readonly FormAction[] {
  return Array.isArray(value)
}

function isBaseFormAction(action: FormAction): action is FormAction & { key: FormActionKey } {
  return isFormActionKey(action.key)
}

function isFormActionKey(value: FormValue): value is FormActionKey {
  return (
    value === 'reset' ||
    value === 'cancel' ||
    value === 'submit' ||
    value === 'previous' ||
    value === 'next'
  )
}
