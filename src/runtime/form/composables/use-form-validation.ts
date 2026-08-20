import { useRegle } from '@regle/core'
import type { RegleRuleRaw } from '@regle/core'
import { withAsync, withMessage } from '@regle/rules'
import { computed, nextTick, ref, unref } from 'vue'
import type { Ref } from 'vue'

import type { FormValue } from '../types'
import type {
  FormField,
  FormObject,
  FormRuntimeContext,
  FormValidationError,
  FormValidationMode,
} from '../types'
import { resolveFieldDependencies } from '../utils/dependencies'
import { createFormFieldInstance } from '../utils/field-instance'
import { getPathValue, isRecord, pathSegments } from '../utils/path'
import {
  isBoolean,
  isFunction,
  isNumber,
  isObject,
  isString,
  isUndefined,
} from '../utils/predicate'
import {
  fieldPath,
  getArrayItemFields,
  getMatrixRows,
  isArrayField,
  isEmptyValue,
  isFlatPassthroughField,
  isObjectContainerField,
  resolveRequired,
  resolveRequiredMessage,
  shouldRenderField,
} from '../utils/state'
import type { FormFieldApiFactory } from './use-form-state'

type RegleRule = (value: FormValue) => boolean | Promise<boolean>
type RegleRuleValue = RegleRule | RegleRuleRaw
interface RegleRuleTree {
  [key: string]: RegleRuleValue | RegleRuleTree | RegleCollectionRules | undefined
  [key: number]: RegleRuleValue | RegleRuleTree | RegleCollectionRules | undefined
  [key: symbol]: RegleRuleValue | RegleRuleTree | RegleCollectionRules | undefined
}
interface RegleCollectionRules {
  $each: (item: { value: FormValue }, index: number) => RegleRuleTree
}
/**
 * Connects schema-owned field rules to Regle's validation tree.
 *
 * Regle owns validation execution, dirty state, async completion, and error collection. The
 * package-specific callback rules are converted to native Regle rules at the schema boundary,
 * so renderers only consume the resulting field errors.
 */
export function useFormValidation(params: {
  schema: () => FormValue
  state: FormObject
  context: FormRuntimeContext
  apiFactory: FormFieldApiFactory
  getValidationMode: () => FormValidationMode
}) {
  const customErrors = ref<readonly FormValidationError[]>([])
  const touchedPaths = ref<readonly string[]>([])
  const pendingPaths = ref<ReadonlyMap<string, ReadonlySet<string>>>(new Map())
  const dynamicMessages = ref<Map<string, string>>(new Map())
  const validatedMessages = ref<ReadonlyMap<string, readonly string[]>>(new Map())
  const validationRuns = new Map<string, number>()

  const regle = useRegle(
    params.state,
    () =>
      buildRegleRules({
        schema: params.schema(),
        state: params.state,
        context: params.context,
        apiFactory: params.apiFactory,
        includeAsync: true,
        mode: params.getValidationMode(),
        dynamicMessages,
      }),
    { autoDirty: false, debounce: 0, lazy: true },
  )
  const syncRegle = useRegle(
    params.state,
    () =>
      buildRegleRules({
        schema: params.schema(),
        state: params.state,
        context: params.context,
        apiFactory: params.apiFactory,
        includeAsync: false,
        mode: params.getValidationMode(),
        dynamicMessages,
      }),
    { autoDirty: false, debounce: 0, lazy: true },
  )

  const validationErrors = computed<readonly FormValidationError[]>(() =>
    collectFormFieldsPathsForSchema(params.schema(), params.state).flatMap((path: string) => {
      if (!touchedPaths.value.includes(path)) return []
      return resolveFieldErrors(path).map((message) => ({ path, message }))
    }),
  )
  const errors = computed(() => [...validationErrors.value, ...customErrors.value])

  async function validate() {
    const run = nextValidationRun(validationRuns, '$form')
    if (params.getValidationMode() === false) {
      regle.r$.$reset()
      return true
    }

    regle.r$.$reset()
    syncRegle.r$.$reset()
    const paths = collectFormFieldsPathsForSchema(params.schema(), params.state)
    clearDynamicMessages(paths)
    clearValidatedMessages(paths)
    const prepared = prepareReglePaths(regle.r$, syncRegle.r$, paths, params.state)
    const potentialAsyncPaths = prepared.regleStatuses
      .filter(({ status }) => hasAsyncRegleRule(status))
      .map(({ fieldPath: currentPath }) => currentPath)
    const pendingToken = `form:${run}`
    addPendingPaths(pendingPaths, potentialAsyncPaths, pendingToken)
    let asyncPaths: readonly string[] = []
    let asyncValid = true
    try {
      const syncResult = await validateSyncRegleStatuses(prepared.syncStatuses)
      prepared.syncResults = syncResult.results
      storeValidatedMessages(prepared.syncStatuses)
      touchPaths(paths)
      asyncPaths = prepared.regleStatuses
        .filter(
          ({ path, status }) =>
            prepared.syncResults.get(path) !== false && hasAsyncRegleRule(status),
        )
        .map(({ fieldPath: currentPath }) => currentPath)
      removePendingPaths(
        pendingPaths,
        potentialAsyncPaths.filter((path) => !asyncPaths.includes(path)),
        pendingToken,
      )
      const nextAsyncStatuses = prepared.regleStatuses.filter(
        ({ path }) => prepared.syncResults.get(path) !== false,
      )
      asyncValid = await validateRegleStatuses(nextAsyncStatuses.map(({ status }) => status))
      storeValidatedMessages(nextAsyncStatuses)
      if (validationRuns.get('$form') !== run) return asyncValid
      return syncResult.valid && asyncValid && customErrors.value.length === 0
    } finally {
      removePendingPaths(pendingPaths, potentialAsyncPaths, pendingToken)
    }
  }

  async function validateFields(fields: readonly FormField[], parentPath: readonly string[]) {
    const paths: readonly string[] = collectFormFieldsPathsForFields(
      fields,
      params.state,
      parentPath,
    )
    const scope = paths.join('|') || parentPath.join('.') || '$fields'
    const run = nextValidationRun(validationRuns, scope)
    if (params.getValidationMode() === false) return true

    clearDynamicMessages(paths)
    clearValidatedMessages(paths)
    const prepared = prepareReglePaths(regle.r$, syncRegle.r$, paths, params.state)
    const potentialAsyncPaths = prepared.regleStatuses
      .filter(({ status }) => hasAsyncRegleRule(status))
      .map(({ fieldPath: currentPath }) => currentPath)
    const pendingToken = `scope:${scope}:${run}`
    addPendingPaths(pendingPaths, potentialAsyncPaths, pendingToken)
    let asyncPaths: readonly string[] = []
    let asyncValid = true
    try {
      const syncResult = await validateSyncRegleStatuses(prepared.syncStatuses)
      prepared.syncResults = syncResult.results
      storeValidatedMessages(prepared.syncStatuses)
      touchPaths(paths)
      asyncPaths = prepared.regleStatuses
        .filter(
          ({ path, status }) =>
            prepared.syncResults.get(path) !== false && hasAsyncRegleRule(status),
        )
        .map(({ fieldPath: currentPath }) => currentPath)
      removePendingPaths(
        pendingPaths,
        potentialAsyncPaths.filter((path) => !asyncPaths.includes(path)),
        pendingToken,
      )
      const nextAsyncStatuses = prepared.regleStatuses.filter(
        ({ path }) => prepared.syncResults.get(path) !== false,
      )
      asyncValid = await validateRegleStatuses(nextAsyncStatuses.map(({ status }) => status))
      storeValidatedMessages(nextAsyncStatuses)
      if (validationRuns.get(scope) !== run)
        return !errors.value.some((error) => paths.some((path) => isScopedPath(error.path, path)))

      return (
        syncResult.valid &&
        asyncValid &&
        !errors.value.some((error) => paths.some((path) => isScopedPath(error.path, path)))
      )
    } finally {
      removePendingPaths(pendingPaths, potentialAsyncPaths, pendingToken)
    }
  }

  function getFieldError(path: readonly string[]) {
    const key = path.join('.')
    const customError = customErrors.value.find((error) => error.path === key)
    if (customError) return customError.message
    if (!touchedPaths.value.includes(key)) return undefined

    return resolveFieldErrors(key)[0]
  }

  function setError(path: readonly string[], message: string) {
    const key = path.join('.')
    customErrors.value = [
      ...customErrors.value.filter((error) => error.path !== key),
      { path: key, message },
    ]
  }

  function clearError(path?: readonly string[]) {
    if (!path) {
      customErrors.value = []
      touchedPaths.value = []
      dynamicMessages.value = new Map()
      validatedMessages.value = new Map()
      regle.r$.$reset()
      syncRegle.r$.$reset()
      return
    }

    const key = path.join('.')
    customErrors.value = customErrors.value.filter(
      (error) => error.path !== key && !error.path.startsWith(`${key}.`),
    )
    touchedPaths.value = touchedPaths.value.filter(
      (touchedPath) => touchedPath !== key && !touchedPath.startsWith(`${key}.`),
    )
    dynamicMessages.value = new Map(
      [...dynamicMessages.value.entries()].filter(
        ([messageKey]) => !messageKey.startsWith(`${key}:`),
      ),
    )
    validatedMessages.value = new Map(
      [...validatedMessages.value.entries()].filter(
        ([messagePath]) => messagePath !== key && !messagePath.startsWith(`${key}.`),
      ),
    )
  }

  function clearValidationState() {
    customErrors.value = []
    touchedPaths.value = []
    dynamicMessages.value = new Map()
    validatedMessages.value = new Map()
    regle.r$.$reset()
    syncRegle.r$.$reset()
  }

  function clearDynamicMessages(paths: readonly string[]) {
    dynamicMessages.value = new Map(
      [...dynamicMessages.value.entries()].filter(
        ([messageKey]) => !paths.some((path) => messageKey.startsWith(`${path}:`)),
      ),
    )
  }

  function clearValidatedMessages(paths: readonly string[]) {
    if (!paths.length) return
    validatedMessages.value = new Map(
      [...validatedMessages.value.entries()].filter(([path]) => !paths.includes(path)),
    )
  }

  function storeValidatedMessages(statuses: readonly ReglePathStatus[]) {
    const next = new Map(validatedMessages.value)
    for (const { fieldPath: path, status } of statuses)
      next.set(path, resolveRegleStatusErrors(status))
    validatedMessages.value = next
  }

  function resolveFieldErrors(path: string) {
    return validatedMessages.value.get(path) ?? []
  }

  function markTouched(path: readonly string[]) {
    touchPaths([path.join('.')])
  }

  function isTouched(path: readonly string[]) {
    return touchedPaths.value.includes(path.join('.'))
  }

  function isPending(path: readonly string[]) {
    const key = path.join('.')
    if (pendingPaths.value.get(key)?.size) return true
    const status = resolveRegleStatus(regle.r$, toReglePath(path.join('.'), params.state))
    if (!isPendingRegleStatus(status)) return false
    return (
      readBooleanProperty(status, '$pending') ||
      hasPendingRegleRule(readReactiveProperty(status, '$rules'))
    )
  }

  function touchPaths(paths: readonly string[]) {
    touchedPaths.value = unique([...touchedPaths.value, ...paths.filter(Boolean)])
  }

  return {
    errors,
    validate,
    validateFields,
    getFieldError,
    setError,
    clearError,
    clearValidationState,
    markTouched,
    isTouched,
    isPending,
  }
}

function buildRegleRules(params: {
  schema: FormValue
  state: FormObject
  context: FormRuntimeContext
  apiFactory: FormFieldApiFactory
  includeAsync: boolean
  mode: FormValidationMode
  dynamicMessages: Ref<Map<string, string>>
}): RegleRuleTree {
  const rules: RegleRuleTree = {}
  if (isSteppedSchemaForRules(params.schema)) {
    for (const step of getSchemaStepsForRules(params.schema)) {
      const stepRules = buildFieldRules({
        ...params,
        fields: step.fields,
        parentPath: step.root ? [step.root] : [],
      })
      for (const [key, value] of Object.entries(stepRules)) {
        if (value === undefined) continue
        setRegleRuleNode(rules, step.root ? `${step.root}.${key}` : key, value)
      }
    }
    return rules
  }

  return buildFieldRules({
    ...params,
    fields: getSchemaFieldsForRules(params.schema),
    parentPath: [],
  })
}

function buildFieldRules(params: {
  fields: readonly FormField[]
  parentPath: readonly string[]
  state: FormObject
  context: FormRuntimeContext
  apiFactory: FormFieldApiFactory
  includeAsync: boolean
  mode: FormValidationMode
  dynamicMessages: Ref<Map<string, string>>
}): RegleRuleTree {
  const rules: RegleRuleTree = {}

  for (const field of params.fields) {
    if (field.ignore === true) continue
    const fieldInstance = createFormFieldInstance(field)
    if (fieldInstance.state.is('stateless')) continue
    if (isFlatPassthroughField(field)) {
      const childRules = buildFieldRules({ ...params, fields: getChildFieldsForRules(field) })
      for (const [key, value] of Object.entries(childRules)) {
        if (value !== undefined) setRegleRuleNode(rules, key, value)
      }
      continue
    }

    const path = fieldPath(params.parentPath, field)
    const api = params.apiFactory(path, field)
    const callbackParams = {
      ctx: params.context,
      deps: resolveFieldDependencies({
        field,
        state: params.state,
        parentPath: params.parentPath,
      }),
      api,
    }
    if (!shouldRenderField(field, callbackParams)) continue

    if (isObjectContainerField(field)) {
      setRegleRuleNode(
        rules,
        field.key,
        buildFieldRules({
          ...params,
          fields: getChildFieldsForRules(field),
          parentPath: path,
        }),
      )
      continue
    }

    if (fieldInstance.type.is('matrix')) {
      const matrixRules: RegleRuleTree = {}
      for (const row of getMatrixRows(field))
        matrixRules[row] = buildFieldRules({
          ...params,
          fields: getChildFieldsForRules(field),
          parentPath: [...path, row],
        })
      setRegleRuleNode(rules, field.key, matrixRules)
      continue
    }

    if (isArrayField(field)) {
      setRegleRuleNode(rules, field.key, {
        $each: (item: { value: FormValue }, index: number) => {
          const itemValue = isRecord(item.value) ? item.value : {}
          return buildFieldRules({
            ...params,
            fields: getArrayItemFields(field, itemValue),
            parentPath: [...path, String(index)],
          })
        },
      })
      continue
    }

    const fieldRules = buildLeafRules({ ...params, field, path, callbackParams })
    if (Object.keys(fieldRules).length) setRegleRuleNode(rules, field.key, fieldRules)
  }

  return rules
}

function setRegleRuleNode(
  target: RegleRuleTree,
  key: string,
  value: Exclude<RegleRuleTree[string], undefined>,
) {
  const segments = pathSegments(key)
  const leaf = segments.pop()
  if (!leaf) return

  let current = target
  for (const segment of segments) {
    const existing = current[segment]
    if (isRegleRuleTreeNode(existing)) {
      current = existing
      continue
    }

    const branch: RegleRuleTree = {}
    current[segment] = branch
    current = branch
  }

  current[leaf] = value
}

function isRegleRuleTreeNode(value: RegleRuleTree[string]): value is RegleRuleTree {
  return isRecord(value) && !('$each' in value)
}

function buildLeafRules(params: {
  field: FormField
  path: readonly string[]
  callbackParams: {
    ctx: FormRuntimeContext
    deps: FormObject
    api: ReturnType<FormFieldApiFactory>
  }
  includeAsync: boolean
  mode: FormValidationMode
  dynamicMessages: Ref<Map<string, string>>
}): RegleRuleTree {
  const output: RegleRuleTree = {}
  const validation = Object.getOwnPropertyDescriptor(params.field, 'validation')?.value
  if (!isRecord(validation)) return output
  const key = params.path.join('.')

  if (params.mode !== 'rules' && resolveRequired(params.field, params.callbackParams))
    output.required = withMessage(
      (value: FormValue) => !isEmptyValue(value),
      resolveRequiredMessage(params.field),
    )

  if (params.mode === 'required') return output
  const authoredRules = Object.getOwnPropertyDescriptor(validation, 'rules')?.value
  if (!Array.isArray(authoredRules)) return output

  authoredRules.forEach((rule, index) => {
    if (!isRecord(rule)) return
    const validate = Object.getOwnPropertyDescriptor(rule, 'validate')?.value
    if (!isFunction(validate)) return
    if (!params.includeAsync && isAsyncFunction(validate)) return
    const ruleName = resolveRuleName(rule, index)
    const messageKey = `${key}:${ruleName}`
    const message = () =>
      params.dynamicMessages.value.get(messageKey) ?? resolveRuleMessage(rule, params.field)
    if (isAsyncFunction(validate)) {
      output[ruleName] = withMessage(
        withAsync(async () =>
          resolveRuleResult(
            await validate({ ...params.callbackParams, api: params.callbackParams.api }),
            messageKey,
            params.dynamicMessages,
          ),
        ),
        message,
      )
    } else {
      output[ruleName] = withMessage(
        () =>
          resolveRuleResult(
            validate({ ...params.callbackParams, api: params.callbackParams.api }),
            messageKey,
            params.dynamicMessages,
          ),
        message,
      )
    }
  })

  return output
}

function resolveRuleResult(
  result: FormValue,
  messageKey: string,
  dynamicMessages: Ref<Map<string, string>>,
) {
  if (isString(result)) {
    setDynamicMessage(dynamicMessages, messageKey, result)
    return false
  }
  clearDynamicMessage(dynamicMessages, messageKey)
  return result === true || result === null || isUndefined(result)
}

function isAsyncFunction(value: (...args: never[]) => FormValue) {
  return Object.getPrototypeOf(value)?.constructor?.name === 'AsyncFunction'
}

function setDynamicMessage(messages: Ref<Map<string, string>>, key: string, value: string) {
  const next = new Map(messages.value)
  next.set(key, value)
  messages.value = next
}

function clearDynamicMessage(messages: Ref<Map<string, string>>, key: string) {
  if (!messages.value.has(key)) return
  const next = new Map(messages.value)
  next.delete(key)
  messages.value = next
}

function resolveRuleName(rule: FormObject, index: number) {
  const name = Object.getOwnPropertyDescriptor(rule, 'name')?.value
  return isString(name) && name.length ? name : `rule-${index + 1}`
}

function resolveRuleMessage(rule: FormObject, field: FormField) {
  const message = Object.getOwnPropertyDescriptor(rule, 'message')?.value
  if (isFunction(message)) return String(message())
  if (isString(message) || isNumber(message)) return String(message)
  const name = Object.getOwnPropertyDescriptor(rule, 'name')?.value
  return isString(name) ? `Invalid value for ${name}.` : `Invalid value for ${field.key}.`
}

function resolveRegleStatusErrors(status: FormValue) {
  const errors = readReactiveProperty(status, '$errors')
  return Array.isArray(errors) ? errors.map(String) : []
}

function toReglePath(path: string, state: FormObject) {
  const reglePath: string[] = []
  let current: FormValue = state
  for (const segment of pathSegments(path)) {
    if (Array.isArray(current) && /^\d+$/.test(segment)) reglePath.push('$each')
    reglePath.push(segment)
    current = Array.isArray(current)
      ? current[Number(segment)]
      : isRecord(current)
        ? current[segment]
        : undefined
  }
  return reglePath.join('.')
}

function collectFormFieldsPathsForSchema(schema: FormValue, state: FormObject) {
  if (isSteppedSchemaForRules(schema))
    return getSchemaStepsForRules(schema).flatMap((step) =>
      collectFormFieldsPathsForFields(step.fields, state, step.root ? [step.root] : []),
    )
  return collectFormFieldsPathsForFields(getSchemaFieldsForRules(schema), state, [])
}

function collectFormFieldsPathsForFields(
  fields: readonly FormField[],
  state: FormObject,
  parentPath: readonly string[],
): readonly string[] {
  return fields.flatMap((field) => {
    if (field.ignore === true) return []
    const fieldInstance = createFormFieldInstance(field)
    if (fieldInstance.state.is('stateless')) return []
    if (isFlatPassthroughField(field))
      return collectFormFieldsPathsForFields(getChildFieldsForRules(field), state, parentPath)

    const path = fieldPath(parentPath, field)
    if (isObjectContainerField(field))
      return collectFormFieldsPathsForFields(getChildFieldsForRules(field), state, path)
    if (fieldInstance.type.is('matrix'))
      return getMatrixRows(field).flatMap((row) =>
        collectFormFieldsPathsForFields(getChildFieldsForRules(field), state, [...path, row]),
      )
    if (isArrayField(field)) {
      const value = getPathValue(state, path)
      if (!Array.isArray(value)) return []
      return value.flatMap((item, index) =>
        collectFormFieldsPathsForFields(
          getArrayItemFields(field, isRecord(item) ? item : {}),
          state,
          [...path, String(index)],
        ),
      )
    }
    return [path.join('.')]
  })
}

function isScopedPath(path: string, scope: string) {
  return path === scope || path.startsWith(`${scope}.`)
}

function getSchemaFieldsForRules(schema: FormValue) {
  if (!isRecord(schema)) return []
  const fields = Object.getOwnPropertyDescriptor(schema, 'fields')?.value
  return Array.isArray(fields) ? fields.filter(isFormFieldForRules) : []
}

function getSchemaStepsForRules(schema: FormValue) {
  if (!isRecord(schema)) return []
  const steps = Object.getOwnPropertyDescriptor(schema, 'steps')?.value
  if (!Array.isArray(steps)) return []
  return steps.flatMap((step) => {
    if (!isRecord(step)) return []
    const fields = Object.getOwnPropertyDescriptor(step, 'fields')?.value
    if (!Array.isArray(fields)) return []
    const root = Object.getOwnPropertyDescriptor(step, 'root')?.value
    return [
      {
        fields: fields.filter(isFormFieldForRules),
        root: isString(root) ? root : undefined,
      },
    ]
  })
}

function isSteppedSchemaForRules(schema: FormValue) {
  return getSchemaStepsForRules(schema).length > 0
}

function getChildFieldsForRules(field: FormField) {
  const fields = Object.getOwnPropertyDescriptor(field, 'fields')?.value
  return Array.isArray(fields) ? fields.filter(isFormFieldForRules) : []
}

function isFormFieldForRules(value: FormValue): value is FormField {
  if (!isRecord(value)) return false
  return isString(value.key) && isString(value.type)
}

function unique(values: readonly string[]) {
  return [...new Set(values)]
}

function nextValidationRun(runs: Map<string, number>, key: string) {
  const run = (runs.get(key) ?? 0) + 1
  runs.set(key, run)
  return run
}

function addPendingPaths(
  pendingPaths: Ref<ReadonlyMap<string, ReadonlySet<string>>>,
  paths: readonly string[],
  token: string,
) {
  if (!paths.length) return
  const next = new Map(pendingPaths.value)
  for (const path of paths) {
    const tokens = new Set(next.get(path) ?? [])
    tokens.add(token)
    next.set(path, tokens)
  }
  pendingPaths.value = next
}

function removePendingPaths(
  pendingPaths: Ref<ReadonlyMap<string, ReadonlySet<string>>>,
  paths: readonly string[],
  token: string,
) {
  if (!paths.length) return
  const next = new Map(pendingPaths.value)
  for (const path of paths) {
    const tokens = new Set(next.get(path) ?? [])
    tokens.delete(token)
    if (tokens.size) next.set(path, tokens)
    else next.delete(path)
  }
  pendingPaths.value = next
}

type RegleValidatableStatus = {
  readonly $errors: FormValue
  $invalid: boolean
  $touch: (runCommit?: boolean) => void
  $reset: () => void
  $validate: () => Promise<FormValue>
  $validateWithoutRaceconditions: () => Promise<FormValue>
}

function hasAsyncRegleRule(status: RegleValidatableStatus) {
  const rules = readReactiveProperty(status, '$rules')
  if (!isRecord(rules)) return false
  return Object.values(rules).some((rule) => readBooleanProperty(rule, '$haveAsync'))
}

type ReglePathStatus = {
  path: string
  fieldPath: string
  status: RegleValidatableStatus
}

function prepareReglePaths(
  regle: FormValue,
  syncRegle: FormValue,
  paths: readonly string[],
  state: FormObject,
) {
  const regleStatuses = collectRegleStatuses(regle, paths, state)
  const syncStatuses = collectRegleStatuses(syncRegle, paths, state)

  regleStatuses.forEach(({ status }) => status.$reset())
  syncStatuses.forEach(({ status }) => status.$reset())

  return {
    regleStatuses,
    syncStatuses,
    syncResults: new Map<string, boolean>(),
  }
}

async function validateSyncRegleStatuses(statuses: readonly ReglePathStatus[]) {
  const validations = statuses.map(({ status }) => status.$validateWithoutRaceconditions())
  await Promise.all(validations)
  const results = statuses.map(
    ({ path, status }) => [path, !readBooleanProperty(status, '$invalid')] as const,
  )
  return { valid: results.every(([, valid]) => valid), results: new Map(results) }
}

function collectRegleStatuses(
  regle: FormValue,
  paths: readonly string[],
  state: FormObject,
): readonly ReglePathStatus[] {
  return unique(paths).flatMap((candidatePath) => {
    const path = toReglePath(candidatePath, state)
    const status = resolveRegleStatus(regle, path)
    return isValidatableRegleStatus(status) ? [{ path, fieldPath: candidatePath, status }] : []
  })
}

async function validateRegleStatuses(statuses: readonly RegleValidatableStatus[]) {
  if (!statuses.length) return true
  statuses.forEach((status) => status.$touch(false))
  await nextTick()
  const validations = statuses.map((status) => status.$validateWithoutRaceconditions())
  await Promise.all(validations)
  return statuses.every((status) => !readBooleanProperty(status, '$invalid'))
}

function resolveRegleStatus(regle: FormValue, path: string): FormValue {
  return pathSegments(path).reduce<FormValue>((current, segment) => {
    if (Array.isArray(current)) return current[Number(segment)]
    if (!isObject(current)) return undefined
    return current[segment]
  }, regle)
}

function isValidatableRegleStatus(value: FormValue): value is RegleValidatableStatus {
  return (
    isObject(value) &&
    value !== null &&
    isBoolean(readReactiveProperty(value, '$invalid')) &&
    isFunction(readReactiveProperty(value, '$reset')) &&
    isFunction(readReactiveProperty(value, '$validate')) &&
    isFunction(readReactiveProperty(value, '$validateWithoutRaceconditions'))
  )
}

function isPendingRegleStatus(value: FormValue): value is {
  $pending: boolean
  $rules: FormValue
} {
  return (
    isObject(value) &&
    value !== null &&
    isBoolean(readReactiveProperty(value, '$pending')) &&
    isObject(readReactiveProperty(value, '$rules'))
  )
}

function hasPendingRegleRule(value: FormValue) {
  if (!isObject(value) || value === null) return false
  return Object.values(value).some(
    (rule) =>
      readBooleanProperty(rule, '$pending') ||
      readBooleanProperty(rule, '$validating') ||
      readBooleanProperty(rule, '$maybePending'),
  )
}

function readBooleanProperty(value: FormValue, key: string) {
  return readReactiveProperty(value, key) === true
}

function readReactiveProperty(value: FormValue, key: string) {
  if (!isRecord(value)) return undefined
  return unref(Object.getOwnPropertyDescriptor(value, key)?.value)
}
