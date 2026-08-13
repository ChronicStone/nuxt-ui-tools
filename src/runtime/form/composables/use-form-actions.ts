import { computed } from 'vue'
import type { ComputedRef } from 'vue'

import { useUiToolsLocale } from '../../i18n/use-locale'
import type { FormAction, FormActionKey, FormRenderShell, FormRuntime } from '../types'
import { isRecord } from '../utils/path'

export function useFormActions(params: {
  runtime: FormRuntime
  shell: ComputedRef<FormRenderShell>
}) {
  const { t } = useUiToolsLocale()

  return computed<readonly FormAction[]>(() => {
    const configuredActions =
      getCurrentStepActions(params.runtime) ?? getSchemaActions(params.runtime.schema.value)
    if (configuredActions)
      return configuredActions.map((action) => normalizeFormAction(action, params, t))

    if (!params.runtime.isStepped.value) return [getBaseFormAction('submit', params, t)]

    return [
      getBaseFormAction('previous', params, t),
      getBaseFormAction('next', params, t),
      getBaseFormAction('submit', params, t),
    ]
  })
}

function normalizeFormAction(
  action: FormAction,
  params: {
    runtime: FormRuntime
    shell: ComputedRef<FormRenderShell>
  },
  t: (key: string) => string,
): FormAction {
  if (!isBaseFormAction(action)) return action
  return {
    ...getBaseFormAction(action.key, params, t),
    ...action,
  }
}

function getBaseFormAction(
  key: FormActionKey,
  params: {
    runtime: FormRuntime
    shell: ComputedRef<FormRenderShell>
  },
  t: (key: string) => string,
): FormAction {
  const slot = params.shell.value !== 'inline' ? 'right' : 'left'
  if (key === 'submit')
    return {
      key,
      label: () => t('form.actions.submitButton'),
      condition: (context) => (context.isMultiStep ? context.isLastStep : true),
      type: 'primary',
      width: 'fill md:fit',
      slot,
    }
  if (key === 'next')
    return {
      key,
      label: () => t('form.actions.nextButton'),
      condition: (context) => !context.isLastStep,
      type: 'primary',
      width: 'fill md:fit',
      slot,
    }
  if (key === 'previous')
    return {
      key,
      label: () => t('form.actions.prevButton'),
      disabled: (context) => context.isFirstStep,
      width: 'fill md:fit',
      slot,
    }
  if (key === 'reset')
    return {
      key,
      label: () => t('form.actions.resetButton'),
      width: 'fill md:fit',
      slot,
    }

  return {
    key,
    label: () => t('form.actions.cancelButton'),
    width: 'fill md:fit',
    slot,
  }
}

function getSchemaActions(schema: unknown) {
  if (!isRecord(schema)) return undefined
  const actions = Object.getOwnPropertyDescriptor(schema, 'actions')?.value
  return isFormActionList(actions) ? actions : undefined
}

function getCurrentStepActions(runtime: FormRuntime) {
  if (!runtime.isStepped.value) return undefined
  const schema = runtime.schema.value
  if (!isRecord(schema)) return undefined

  const steps = Object.getOwnPropertyDescriptor(schema, 'steps')?.value
  if (!Array.isArray(steps)) return undefined

  const step = steps[runtime.currentStepIndex.value]
  if (!isRecord(step)) return undefined

  const actions = Object.getOwnPropertyDescriptor(step, 'actions')?.value
  return isFormActionList(actions) ? actions : undefined
}

function isFormActionList(value: unknown): value is readonly FormAction[] {
  return Array.isArray(value)
}

function isBaseFormAction(action: FormAction): action is FormAction & { key: FormActionKey } {
  return isFormActionKey(action.key)
}

function isFormActionKey(value: unknown): value is FormActionKey {
  return (
    value === 'reset' ||
    value === 'cancel' ||
    value === 'submit' ||
    value === 'previous' ||
    value === 'next'
  )
}
