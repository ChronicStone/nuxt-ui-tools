import type {
  FormContextData,
  FormField,
  FormFieldApi,
  FormFieldCallbackParams,
  FormLayoutConfig,
  FormObject,
  FormText,
} from '../types'
import { resolveFieldDependencies } from './dependencies'
import { createFormFieldInstance, isRegisteredFormFieldType } from './field-instance'
import { cloneFormValue, getPathValue, isRecord, mergeFormObjects, setPathValue } from './path'

export interface FormSubmitError {
  path: string
  message: string
}

export interface RuntimeFormStep {
  key?: string
  title?: FormText
  root?: string
  layout?: FormLayoutConfig
  fields: readonly FormField[]
}

export function getSchemaFields(schema: unknown) {
  if (!isRecord(schema)) return []
  const fields = Object.getOwnPropertyDescriptor(schema, 'fields')?.value
  return Array.isArray(fields) ? fields.filter(isFormField) : []
}

export function getSchemaSteps(schema: unknown) {
  if (!isRecord(schema)) return []
  const steps = Object.getOwnPropertyDescriptor(schema, 'steps')?.value
  if (!Array.isArray(steps)) return []
  return steps.map(normalizeStep).filter(isRuntimeStep)
}

export function isSteppedSchema(schema: unknown) {
  return getSchemaSteps(schema).length > 0
}

export function getSchemaLayout(schema: unknown): FormLayoutConfig | undefined {
  if (!isRecord(schema)) return undefined
  return normalizeLayout(Object.getOwnPropertyDescriptor(schema, 'layout')?.value)
}

export function buildInitialFormState(schema: unknown, ctx: FormContextData, input?: FormObject) {
  const state: FormObject = {}
  if (input) mergeFormObjects(state, input)

  if (isSteppedSchema(schema)) {
    for (const step of getSchemaSteps(schema))
      mergeMissingFieldDefaults(state, step.fields, ctx, step.root ? [step.root] : [])

    return state
  }

  mergeMissingFieldDefaults(state, getSchemaFields(schema), ctx, [])
  return state
}

export function buildFormOutput(schema: unknown, state: FormObject, ctx: FormContextData, apiFactory: FormFieldApiFactory) {
  const output: FormObject = {}

  if (isSteppedSchema(schema)) {
    for (const step of getSchemaSteps(schema))
      mergeFormObjects(output, buildFieldsOutput(step.fields, state, ctx, apiFactory, step.root ? [step.root] : []))

    return output
  }

  return buildFieldsOutput(getSchemaFields(schema), state, ctx, apiFactory, [])
}

export async function validateFormState(schema: unknown, state: FormObject, ctx: FormContextData, apiFactory: FormFieldApiFactory) {
  const errors: FormSubmitError[] = []

  if (isSteppedSchema(schema)) {
    for (const step of getSchemaSteps(schema))
      errors.push(...await validateFields(step.fields, state, ctx, apiFactory, step.root ? [step.root] : []))

    return errors
  }

  return validateFields(getSchemaFields(schema), state, ctx, apiFactory, [])
}

export async function validateFormFields(params: {
  fields: readonly FormField[]
  state: FormObject
  ctx: FormContextData
  apiFactory: FormFieldApiFactory
  parentPath: readonly string[]
}) {
  return await validateFields(params.fields, params.state, params.ctx, params.apiFactory, params.parentPath)
}

export type FormFieldApiFactory = (path: readonly string[], field?: FormField) => FormFieldApi

export function fieldPath(parentPath: readonly string[], field: FormField) {
  return [...parentPath, field.key]
}

export function childParentPath(parentPath: readonly string[], field: FormField) {
  if (createFormFieldInstance(field).type.is('input-group')) return parentPath
  return fieldPath(parentPath, field)
}

export function shouldRenderField(field: FormField, params: FormFieldCallbackParams) {
  const condition = Object.getOwnPropertyDescriptor(field, 'condition')?.value
  if (typeof condition !== 'function') return true
  return condition(params) === true
}

function mergeMissingFieldDefaults(
  target: FormObject,
  fields: readonly FormField[],
  ctx: FormContextData,
  parentPath: readonly string[],
) {
  for (const field of fields) {
    const fieldInstance = createFormFieldInstance(field)
    if (fieldInstance.state.is('stateless')) continue
    if (fieldInstance.type.is('input-group')) {
      mergeMissingFieldDefaults(target, getChildFields(field), ctx, parentPath)
      continue
    }

    if (fieldInstance.type.is('object')) {
      const path = fieldPath(parentPath, field)
      if (!isRecord(getPathValue(target, path))) setPathValue(target, path, {})
      mergeMissingFieldDefaults(target, getChildFields(field), ctx, path)
      continue
    }

    if (fieldInstance.type.isAny(['array-list', 'array-tabs', 'array-variant'])) {
      const path = fieldPath(parentPath, field)
      if (!Array.isArray(getPathValue(target, path))) setPathValue(target, path, [])
      continue
    }

    const path = fieldPath(parentPath, field)
    if (typeof getPathValue(target, path) === 'undefined') setPathValue(target, path, resolveFieldDefault(field, ctx))
  }
}

function buildFieldsOutput(
  fields: readonly FormField[],
  state: FormObject,
  ctx: FormContextData,
  apiFactory: FormFieldApiFactory,
  parentPath: readonly string[],
) {
  const output: FormObject = {}

  for (const field of fields) {
    const fieldInstance = createFormFieldInstance(field)
    if (fieldInstance.state.is('stateless')) continue
    if (fieldInstance.type.is('input-group')) {
      mergeFormObjects(output, buildFieldsOutput(getChildFields(field), state, ctx, apiFactory, parentPath))
      continue
    }

    if (fieldInstance.capability.has('submit') && 'submit' in field && field.submit?.omit) continue

    const path = fieldPath(parentPath, field)
    const api = apiFactory(path, field)
    const params = callbackParams({
      field,
      state,
      ctx,
      api,
      parentPath,
    })
    if (!shouldRenderField(field, params)) continue

    if (fieldInstance.type.is('object')) {
      const objectValue = buildFieldsOutput(getChildFields(field), state, ctx, apiFactory, path)
      setPathValue(output, field.key, applyOutputTransform(field, objectValue, params))
      continue
    }

    setPathValue(output, field.key, applyOutputTransform(field, getPathValue(state, path), params))
  }

  return output
}

async function validateFields(
  fields: readonly FormField[],
  state: FormObject,
  ctx: FormContextData,
  apiFactory: FormFieldApiFactory,
  parentPath: readonly string[],
) {
  const errors: FormSubmitError[] = []

  for (const field of fields) {
    const fieldInstance = createFormFieldInstance(field)
    if (fieldInstance.state.is('stateless')) continue
    if (fieldInstance.type.is('input-group')) {
      errors.push(...await validateFields(getChildFields(field), state, ctx, apiFactory, parentPath))
      continue
    }

    const path = fieldPath(parentPath, field)
    const api = apiFactory(path, field)
    const params = callbackParams({
      field,
      state,
      ctx,
      api,
      parentPath,
    })
    if (!shouldRenderField(field, params)) continue

    if (fieldInstance.type.is('object')) {
      errors.push(...await validateFields(getChildFields(field), state, ctx, apiFactory, path))
      continue
    }

    const value = getPathValue(state, path)
    const required = resolveRequired(field, params)
    if (required && isEmptyValue(value)) {
      errors.push({
        path: path.join('.'),
        message: resolveRequiredMessage(field),
      })
    }

    errors.push(...await validateFieldRules(field, value, params, path))
  }

  return errors
}

function resolveFieldDefault(field: FormField, ctx: FormContextData) {
  const fieldInstance = createFormFieldInstance(field)
  const value = Object.getOwnPropertyDescriptor(field, 'default')?.value
  if (typeof value !== 'undefined')
    return typeof value === 'function' ? cloneFormValue(value({ ctx })) : cloneFormValue(value)

  if (fieldInstance.type.is('checkbox')) return false
  if (fieldInstance.type.is('tag')) return []
  if (fieldInstance.type.is('slider')) return 0
  return null
}

function applyOutputTransform(field: FormField, value: unknown, params: FormFieldCallbackParams) {
  const transform = Object.getOwnPropertyDescriptor(field, 'transform')?.value
  if (isRecord(transform) && typeof transform.output === 'function')
    return transform.output(value, params)

  return cloneFormValue(value)
}

function resolveRequired(field: FormField, params: FormFieldCallbackParams) {
  const validation = Object.getOwnPropertyDescriptor(field, 'validation')?.value
  if (!isRecord(validation)) return false
  const required = validation.required
  if (typeof required === 'function') return required(params)
  return required ?? false
}

function resolveRequiredMessage(field: FormField): string {
  const validation = Object.getOwnPropertyDescriptor(field, 'validation')?.value
  if (!isRecord(validation)) return 'This field is required.'
  const message = validation.requiredMessage
  if (typeof message === 'function') return String(message())
  if (typeof message === 'number') return String(message)
  if (typeof message === 'string') return message
  return 'This field is required.'
}

async function validateFieldRules(
  field: FormField,
  value: unknown,
  params: FormFieldCallbackParams,
  path: readonly string[],
) {
  const validation = Object.getOwnPropertyDescriptor(field, 'validation')?.value
  if (!isRecord(validation)) return []
  const rules = Object.getOwnPropertyDescriptor(validation, 'rules')?.value
  if (!Array.isArray(rules)) return []

  const errors: FormSubmitError[] = []
  for (const rule of rules) {
    if (!isRecord(rule)) continue
    const validate = Object.getOwnPropertyDescriptor(rule, 'validate')?.value
    if (typeof validate !== 'function') continue

    const result = await validate({
      ...params,
      api: params.api,
    })

    if (result === true || result === null || typeof result === 'undefined') continue

    errors.push({
      path: path.join('.'),
      message: typeof result === 'string' ? result : resolveRuleMessage(rule, value),
    })
  }

  return errors
}

function resolveRuleMessage(rule: FormObject, _value: unknown) {
  const message = Object.getOwnPropertyDescriptor(rule, 'message')?.value
  if (typeof message === 'function') return String(message())
  if (typeof message === 'string' || typeof message === 'number') return String(message)
  const name = Object.getOwnPropertyDescriptor(rule, 'name')?.value
  return typeof name === 'string' ? `Invalid value for ${name}.` : 'Invalid value.'
}

function isEmptyValue(value: unknown) {
  if (value === null || typeof value === 'undefined') return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  return false
}

function normalizeStep(value: unknown): RuntimeFormStep | null {
  if (!isRecord(value)) return null
  const fields = Object.getOwnPropertyDescriptor(value, 'fields')?.value
  const key = Object.getOwnPropertyDescriptor(value, 'key')?.value
  const title = Object.getOwnPropertyDescriptor(value, 'title')?.value
  const root = Object.getOwnPropertyDescriptor(value, 'root')?.value
  const layout = Object.getOwnPropertyDescriptor(value, 'layout')?.value

  return {
    key: typeof key === 'string' ? key : undefined,
    title: isFormText(title) ? title : undefined,
    root: typeof root === 'string' ? root : undefined,
    layout: normalizeLayout(layout),
    fields: Array.isArray(fields) ? fields.filter(isFormField) : [],
  }
}

function isRuntimeStep(value: RuntimeFormStep | null): value is RuntimeFormStep {
  return value !== null
}

function normalizeLayout(value: unknown): FormLayoutConfig | undefined {
  if (!isRecord(value)) return undefined

  const columns = Object.getOwnPropertyDescriptor(value, 'columns')?.value
  const fieldSpan = Object.getOwnPropertyDescriptor(value, 'fieldSpan')?.value
  const gap = Object.getOwnPropertyDescriptor(value, 'gap')?.value

  return {
    columns: typeof columns === 'string' || typeof columns === 'number' ? columns : undefined,
    fieldSpan: typeof fieldSpan === 'string' || typeof fieldSpan === 'number' ? fieldSpan : undefined,
    gap: typeof gap === 'string' || typeof gap === 'number' ? gap : undefined,
  }
}

function isFormText(value: unknown): value is FormText {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'function'
}

function isFormField(value: unknown): value is FormField {
  if (!isRecord(value)) return false
  const type = Object.getOwnPropertyDescriptor(value, 'type')?.value
  return typeof value.key === 'string' && typeof type === 'string' && isRegisteredFormFieldType(type)
}

function getChildFields(field: FormField) {
  const fields = Object.getOwnPropertyDescriptor(field, 'fields')?.value
  return Array.isArray(fields) ? fields.filter(isFormField) : []
}

function callbackParams(params: {
  field: FormField
  state: FormObject
  ctx: FormContextData
  api: FormFieldApi
  parentPath: readonly string[]
}): FormFieldCallbackParams {
  return {
    ctx: params.ctx,
    deps: resolveFieldDependencies(params),
    api: params.api,
  }
}
