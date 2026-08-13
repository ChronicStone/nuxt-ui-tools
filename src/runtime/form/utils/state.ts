import type {
  FormContextData,
  FormField,
  FormFieldApi,
  FormFieldCallbackParams,
  FormLayoutConfig,
  FormObject,
  FormText,
  FormValidationMode,
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

export function buildInitialFormFieldsState(fields: readonly FormField[], ctx: FormContextData) {
  const state: FormObject = {}
  mergeMissingFieldDefaults(state, fields, ctx, [])
  return state
}

export function buildFormOutput(
  schema: unknown,
  state: FormObject,
  ctx: FormContextData,
  apiFactory: FormFieldApiFactory,
) {
  const output: FormObject = {}

  if (isSteppedSchema(schema)) {
    for (const step of getSchemaSteps(schema))
      mergeFormObjects(
        output,
        buildFieldsOutput(step.fields, state, ctx, apiFactory, step.root ? [step.root] : []),
      )

    return output
  }

  return buildFieldsOutput(getSchemaFields(schema), state, ctx, apiFactory, [])
}

export async function validateFormState(
  schema: unknown,
  state: FormObject,
  ctx: FormContextData,
  apiFactory: FormFieldApiFactory,
  mode: FormValidationMode = true,
) {
  if (mode === false) return []
  const errors: FormSubmitError[] = []

  if (isSteppedSchema(schema)) {
    for (const step of getSchemaSteps(schema))
      errors.push(
        ...(await validateFields(
          step.fields,
          state,
          ctx,
          apiFactory,
          step.root ? [step.root] : [],
          mode,
        )),
      )

    return errors
  }

  return validateFields(getSchemaFields(schema), state, ctx, apiFactory, [], mode)
}

export function collectFormFieldPaths(schema: unknown) {
  if (isSteppedSchema(schema))
    return getSchemaSteps(schema).flatMap((step) =>
      collectFormFieldsPaths(step.fields, step.root ? [step.root] : []),
    )

  return collectFormFieldsPaths(getSchemaFields(schema), [])
}

export function collectFormFieldsPaths(
  fields: readonly FormField[],
  parentPath: readonly string[],
) {
  return collectFieldPaths(fields, parentPath)
}

export async function validateFormFields(params: {
  fields: readonly FormField[]
  state: FormObject
  ctx: FormContextData
  apiFactory: FormFieldApiFactory
  parentPath: readonly string[]
  mode?: FormValidationMode
}) {
  if (params.mode === false) return []
  return await validateFields(
    params.fields,
    params.state,
    params.ctx,
    params.apiFactory,
    params.parentPath,
    params.mode ?? true,
  )
}

export type FormFieldApiFactory = (path: readonly string[], field?: FormField) => FormFieldApi

export function fieldPath(parentPath: readonly string[], field: FormField) {
  return [...parentPath, field.key]
}

export function childParentPath(parentPath: readonly string[], field: FormField) {
  if (isFlatPassthroughField(field)) return parentPath
  return fieldPath(parentPath, field)
}

export function shouldRenderField(field: FormField, params: FormFieldCallbackParams) {
  if (field.ignore === true) return false
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
    if (field.ignore === true) continue
    const fieldInstance = createFormFieldInstance(field)
    if (fieldInstance.state.is('stateless')) continue
    if (isFlatPassthroughField(field)) {
      mergeMissingFieldDefaults(target, getChildFields(field), ctx, parentPath)
      continue
    }

    if (isObjectContainerField(field)) {
      const path = fieldPath(parentPath, field)
      if (!isRecord(getPathValue(target, path))) setPathValue(target, path, {})
      mergeMissingFieldDefaults(target, getChildFields(field), ctx, path)
      continue
    }

    if (fieldInstance.type.is('matrix')) {
      const path = fieldPath(parentPath, field)
      if (!isRecord(getPathValue(target, path))) setPathValue(target, path, {})
      for (const row of getMatrixRows(field)) {
        const rowPath = [...path, row]
        if (!isRecord(getPathValue(target, rowPath))) setPathValue(target, rowPath, {})
        mergeMissingFieldDefaults(target, getChildFields(field), ctx, rowPath)
      }
      continue
    }

    if (isArrayField(field)) {
      const path = fieldPath(parentPath, field)
      const value = getPathValue(target, path)
      if (!Array.isArray(value)) {
        setPathValue(target, path, [])
        continue
      }
      for (const [index, item] of value.entries()) {
        if (!isRecord(item)) continue
        mergeMissingFieldDefaults(target, getArrayItemFields(field, item), ctx, [
          ...path,
          String(index),
        ])
      }
      continue
    }

    const path = fieldPath(parentPath, field)
    if (typeof getPathValue(target, path) === 'undefined')
      setPathValue(target, path, resolveFieldDefault(field, ctx))
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
    if (field.ignore === true) continue
    const fieldInstance = createFormFieldInstance(field)
    if (fieldInstance.state.is('stateless')) continue
    if (isFlatPassthroughField(field)) {
      mergeFormObjects(
        output,
        buildFieldsOutput(getChildFields(field), state, ctx, apiFactory, parentPath),
      )
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

    if (isObjectContainerField(field)) {
      const objectValue = buildFieldsOutput(getChildFields(field), state, ctx, apiFactory, path)
      setPathValue(output, field.key, applyOutputTransform(field, objectValue, params))
      continue
    }

    if (isArrayField(field)) {
      const value = getPathValue(state, path)
      const items = Array.isArray(value)
        ? value.map((item, index) => {
            const itemValue = isRecord(item) ? item : {}
            const itemOutput = buildFieldsOutput(
              getArrayItemFields(field, itemValue),
              state,
              ctx,
              apiFactory,
              [...path, String(index)],
            )
            return completeArrayItemOutput(field, itemValue, itemOutput, index)
          })
        : []
      setPathValue(output, field.key, applyOutputTransform(field, items, params))
      continue
    }

    if (fieldInstance.type.is('matrix')) {
      const matrixValue: FormObject = {}
      for (const row of getMatrixRows(field))
        setPathValue(
          matrixValue,
          row,
          buildFieldsOutput(getChildFields(field), state, ctx, apiFactory, [...path, row]),
        )
      setPathValue(output, field.key, applyOutputTransform(field, matrixValue, params))
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
  mode: FormValidationMode,
) {
  const errors: FormSubmitError[] = []

  for (const field of fields) {
    if (field.ignore === true) continue
    const fieldInstance = createFormFieldInstance(field)
    if (fieldInstance.state.is('stateless')) continue
    if (isFlatPassthroughField(field)) {
      errors.push(
        ...(await validateFields(getChildFields(field), state, ctx, apiFactory, parentPath, mode)),
      )
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

    if (isObjectContainerField(field)) {
      errors.push(
        ...(await validateFields(getChildFields(field), state, ctx, apiFactory, path, mode)),
      )
      continue
    }

    if (isArrayField(field)) {
      const value = getPathValue(state, path)
      if (Array.isArray(value))
        for (const index of value.keys())
          errors.push(
            ...(await validateFields(
              getArrayItemFields(field, isRecord(value[index]) ? value[index] : {}),
              state,
              ctx,
              apiFactory,
              [...path, String(index)],
              mode,
            )),
          )
      continue
    }

    if (fieldInstance.type.is('matrix')) {
      for (const row of getMatrixRows(field))
        errors.push(
          ...(await validateFields(
            getChildFields(field),
            state,
            ctx,
            apiFactory,
            [...path, row],
            mode,
          )),
        )
      continue
    }

    const value = getPathValue(state, path)
    const required = mode !== 'rules' && resolveRequired(field, params)
    if (required && isEmptyValue(value)) {
      errors.push({
        path: path.join('.'),
        message: resolveRequiredMessage(field),
      })
    }

    if (mode !== 'required') errors.push(...(await validateFieldRules(field, value, params, path)))
  }

  return errors
}

function collectFieldPaths(
  fields: readonly FormField[],
  parentPath: readonly string[],
): readonly string[] {
  return fields.flatMap((field) => {
    if (field.ignore === true) return []
    const fieldInstance = createFormFieldInstance(field)
    if (fieldInstance.state.is('stateless')) return []
    if (isFlatPassthroughField(field)) return collectFieldPaths(getChildFields(field), parentPath)

    const path = fieldPath(parentPath, field)
    if (isObjectContainerField(field)) return collectFieldPaths(getChildFields(field), path)
    if (fieldInstance.type.is('matrix'))
      return getMatrixRows(field).flatMap((row) =>
        collectFieldPaths(getChildFields(field), [...path, row]),
      )
    return [path.join('.')]
  })
}

function isFlatPassthroughField(field: FormField) {
  return createFormFieldInstance(field).type.isAny(['input-group', 'card', 'column'])
}

function isObjectContainerField(field: FormField) {
  return createFormFieldInstance(field).type.isAny(['object', 'group'])
}

function isArrayField(field: FormField) {
  return createFormFieldInstance(field).type.isAny([
    'array-list',
    'array-table',
    'array-tabs',
    'array-variant',
  ])
}

function getMatrixRows(field: FormField) {
  if (!createFormFieldInstance(field).type.is('matrix')) return []
  const rows = Object.getOwnPropertyDescriptor(field, 'rows')?.value
  if (!Array.isArray(rows)) return []
  return rows.flatMap((row) => {
    if (!isRecord(row) || typeof row.key !== 'string') return []
    return row.key
  })
}

function resolveFieldDefault(field: FormField, ctx: FormContextData) {
  const fieldInstance = createFormFieldInstance(field)
  const value = Object.getOwnPropertyDescriptor(field, 'default')?.value
  if (typeof value !== 'undefined')
    return typeof value === 'function' ? cloneFormValue(value({ ctx })) : cloneFormValue(value)

  if (fieldInstance.type.is('checkbox')) return false
  if (fieldInstance.type.is('switch')) return resolveSwitchDefault(field)
  if (fieldInstance.type.isAny(['checkbox-group', 'checkbox-card', 'switch-group'])) return []
  if (
    fieldInstance.type.isAny([
      'auto-complete',
      'select',
      'file',
      'upload',
      'tree',
      'tree-select',
      'cascader',
    ]) &&
    Object.getOwnPropertyDescriptor(field, 'multiple')?.value === true
  )
    return []
  if (fieldInstance.type.is('tag')) return []
  if (fieldInstance.type.is('slider')) return 0
  if (fieldInstance.type.is('one-time-code')) return ''
  return null
}

function resolveSwitchDefault(field: FormField) {
  const trueValue = Object.getOwnPropertyDescriptor(field, 'trueValue')?.value
  return typeof trueValue === 'string' ||
    typeof trueValue === 'number' ||
    typeof trueValue === 'boolean'
    ? trueValue
    : false
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
    fieldSpan:
      typeof fieldSpan === 'string' || typeof fieldSpan === 'number' ? fieldSpan : undefined,
    gap: typeof gap === 'string' || typeof gap === 'number' ? gap : undefined,
  }
}

function isFormText(value: unknown): value is FormText {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'function'
}

function isFormField(value: unknown): value is FormField {
  if (!isRecord(value)) return false
  const type = Object.getOwnPropertyDescriptor(value, 'type')?.value
  return (
    typeof value.key === 'string' && typeof type === 'string' && isRegisteredFormFieldType(type)
  )
}

function getChildFields(field: FormField) {
  const fields = Object.getOwnPropertyDescriptor(field, 'fields')?.value
  return Array.isArray(fields) ? fields.filter(isFormField) : []
}

function getArrayItemFields(field: FormField, item: FormObject) {
  if (!createFormFieldInstance(field).type.is('array-variant')) return getChildFields(field)
  const variantKey = Object.getOwnPropertyDescriptor(field, 'variantKey')?.value
  const variants = Object.getOwnPropertyDescriptor(field, 'variants')?.value
  if (typeof variantKey !== 'string' || !Array.isArray(variants)) return []
  const value = item[variantKey]
  const variant = variants.find((candidate) => isRecord(candidate) && candidate.key === value)
  if (!isRecord(variant)) return []
  const fields = variant.fields
  return Array.isArray(fields) ? fields.filter(isFormField) : []
}

function completeArrayItemOutput(
  field: FormField,
  input: FormObject,
  output: FormObject,
  index: number,
) {
  const result: FormObject = arrayExtraProperties(field) ? { ...input, ...output } : output
  const variantKey = Object.getOwnPropertyDescriptor(field, 'variantKey')?.value
  if (typeof variantKey === 'string' && typeof input[variantKey] !== 'undefined')
    result[variantKey] = cloneFormValue(input[variantKey])

  const virtualFields = getArrayVirtualFields(field, input)
  for (const key of Object.keys(virtualFields)) {
    const resolver = virtualFields[key]
    if (typeof resolver === 'function') result[key] = resolver(index)
  }
  return result
}

function getArrayVirtualFields(field: FormField, item: FormObject) {
  const variantKey = Object.getOwnPropertyDescriptor(field, 'variantKey')?.value
  if (typeof variantKey === 'string') {
    const variants = Object.getOwnPropertyDescriptor(field, 'variants')?.value
    if (Array.isArray(variants)) {
      const variant = variants.find(
        (candidate) => isRecord(candidate) && candidate.key === item[variantKey],
      )
      if (isRecord(variant) && isRecord(variant.virtualFields)) return variant.virtualFields
    }
  }
  const virtualFields = Object.getOwnPropertyDescriptor(field, 'virtualFields')?.value
  return isRecord(virtualFields) ? virtualFields : {}
}

function arrayExtraProperties(field: FormField) {
  return Object.getOwnPropertyDescriptor(field, 'extraProperties')?.value === true
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
