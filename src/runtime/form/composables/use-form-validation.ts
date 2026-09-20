import { useRegle } from '@regle/core'
import type { RegleRuleRaw } from '@regle/core'
import { withAsync, withMessage } from '@regle/rules'
import { computed, nextTick, reactive, ref, unref, watch } from 'vue'
import type { Ref } from 'vue'

import { calendarSeedFromValue, isDateFamilyRange } from '../fields/date-family/utils'
import type { FormDateFamilyType, FormDateSeedValue } from '../fields/date-family/utils'
import type {
  FormValue,
  FormErrorOptions,
  FormField,
  FormObject,
  FormRuntimeContext,
  FormValidationError,
  FormValidationMode,
  FormValidators,
  FormValidatorsConfig,
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
  getPrimitiveArrayItemField,
  isArrayField,
  isEmptyValue,
  isFlatPassthroughField,
  isObjectContainerField,
  isPrimitiveArrayField,
  resolveRequired,
  resolveRequiredMessage,
  shouldRenderField,
} from '../utils/state'
import { resolveFormBoundaryText } from '../utils/text'
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
  [key: string]: RegleRuleValue | RegleCollectionRules['$each'] | undefined
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
  getRequiredMessage?: () => string
  getUniqueMessage?: () => string
  getDateMinMessage?: (bound: string) => string
  getDateMaxMessage?: (bound: string) => string
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
        apiFactory: params.apiFactory,
        context: params.context,
        dynamicMessages,
        getDateMaxMessage: params.getDateMaxMessage,
        getDateMinMessage: params.getDateMinMessage,
        getRequiredMessage: params.getRequiredMessage,
        getUniqueMessage: params.getUniqueMessage,
        includeAsync: true,
        mode: params.getValidationMode(),
        schema: params.schema(),
        state: params.state,
      }),
    { autoDirty: false, debounce: 0, lazy: true },
  )
  const syncRegle = useRegle(
    params.state,
    () =>
      buildRegleRules({
        apiFactory: params.apiFactory,
        context: params.context,
        dynamicMessages,
        getDateMaxMessage: params.getDateMaxMessage,
        getDateMinMessage: params.getDateMinMessage,
        getRequiredMessage: params.getRequiredMessage,
        getUniqueMessage: params.getUniqueMessage,
        includeAsync: false,
        mode: params.getValidationMode(),
        schema: params.schema(),
        state: params.state,
      }),
    { autoDirty: false, debounce: 0, lazy: true },
  )

  const itemsMirror = reactive<FormObject>({})
  const itemsRegle = useRegle(
    itemsMirror,
    () =>
      buildPrimitiveItemRules({
        apiFactory: params.apiFactory,
        context: params.context,
        dynamicMessages,
        getDateMaxMessage: params.getDateMaxMessage,
        getDateMinMessage: params.getDateMinMessage,
        getRequiredMessage: params.getRequiredMessage,
        getUniqueMessage: params.getUniqueMessage,
        includeAsync: true,
        mode: params.getValidationMode(),
        schema: params.schema(),
        state: params.state,
      }),
    { autoDirty: false, debounce: 0, lazy: true },
  )
  const itemsSyncRegle = useRegle(
    itemsMirror,
    () =>
      buildPrimitiveItemRules({
        apiFactory: params.apiFactory,
        context: params.context,
        dynamicMessages,
        getDateMaxMessage: params.getDateMaxMessage,
        getDateMinMessage: params.getDateMinMessage,
        getRequiredMessage: params.getRequiredMessage,
        getUniqueMessage: params.getUniqueMessage,
        includeAsync: false,
        mode: params.getValidationMode(),
        schema: params.schema(),
        state: params.state,
      }),
    { autoDirty: false, debounce: 0, lazy: true },
  )

  watch(
    () =>
      collectPrimitiveArraysForSchema(params.schema(), params.state).map((target) => ({
        items: getPathValue(params.state, target.path),
        key: target.key,
      })),
    syncItemsMirror,
    { deep: true, flush: 'sync', immediate: true },
  )

  function syncItemsMirror(targets: readonly { key: string; items: FormValue }[]) {
    const keys = new Set(targets.map((target) => target.key))
    for (const key of Object.keys(itemsMirror)) {
      if (!keys.has(key)) {
        Reflect.deleteProperty(itemsMirror, key)
      }
    }
    for (const target of targets) {
      const items = Array.isArray(target.items) ? target.items : []
      if (!Array.isArray(itemsMirror[target.key])) {
        itemsMirror[target.key] = []
      }
      const holders = itemsMirror[target.key]
      if (!Array.isArray(holders)) {
        continue
      }
      for (const [index, item] of items.entries()) {
        const holder = holders[index]
        if (isRecord(holder)) {
          holder.value = item
        } else {
          holders[index] = { value: item }
        }
      }
      if (holders.length > items.length) {
        holders.splice(items.length)
      }
    }
  }

  function resetRegleRoots() {
    regle.r$.$reset()
    syncRegle.r$.$reset()
    itemsRegle.r$.$reset()
    itemsSyncRegle.r$.$reset()
  }

  const validationErrors = computed<readonly FormValidationError[]>(() =>
    collectFormFieldsPathsForSchema(params.schema(), params.state).flatMap((path: string) => {
      if (!touchedPaths.value.includes(path)) {
        return []
      }
      return resolveFieldErrors(path).map((message) => ({ message, path }))
    }),
  )
  const errors = computed(() => [...validationErrors.value, ...customErrors.value])

  async function validate() {
    const run = nextValidationRun(validationRuns, '$form')
    if (params.getValidationMode() === false) {
      resetRegleRoots()
      return true
    }

    resetRegleRoots()
    const paths = collectFormFieldsPathsForSchema(params.schema(), params.state)
    clearDynamicMessages(paths)
    clearValidatedMessages(paths)
    const prepared = prepareReglePaths(
      { items: itemsRegle.r$, main: regle.r$ },
      { items: itemsSyncRegle.r$, main: syncRegle.r$ },
      paths,
      params.state,
    )
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
      if (validationRuns.get('$form') !== run) {
        return asyncValid
      }
      return syncResult.valid && asyncValid && !hasBlockingErrors(paths)
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
    if (params.getValidationMode() === false) {
      return true
    }

    clearDynamicMessages(paths)
    clearValidatedMessages(paths)
    const prepared = prepareReglePaths(
      { items: itemsRegle.r$, main: regle.r$ },
      { items: itemsSyncRegle.r$, main: syncRegle.r$ },
      paths,
      params.state,
    )
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
      if (validationRuns.get(scope) !== run) {
        return !validationErrors.value.some((error) =>
          paths.some((path) => isScopedPath(error.path, path)),
        )
      }

      return syncResult.valid && asyncValid && !hasBlockingErrors(paths)
    } finally {
      removePendingPaths(pendingPaths, potentialAsyncPaths, pendingToken)
    }
  }

  function getFieldError(path: readonly string[]) {
    const key = path.join('.')
    const customError = customErrors.value.find((error) => error.path === key)
    if (customError) {
      return customError.message
    }
    if (!touchedPaths.value.includes(key)) {
      return
    }

    return resolveFieldErrors(key)[0]
  }

  function setError(path: readonly string[], message: string, options?: FormErrorOptions) {
    const key = path.join('.')
    customErrors.value = [
      ...customErrors.value.filter((error) => error.path !== key),
      { blocking: options?.blocking === true, message, path: key },
    ]
  }

  function hasBlockingErrors(paths: readonly string[]) {
    return customErrors.value.some(
      (error) => error.blocking === true && paths.some((path) => isScopedPath(error.path, path)),
    )
  }

  function clearError(path?: readonly string[]) {
    if (!path) {
      customErrors.value = []
      touchedPaths.value = []
      dynamicMessages.value = new Map()
      validatedMessages.value = new Map()
      resetRegleRoots()
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
    resetRegleRoots()
  }

  function clearDynamicMessages(paths: readonly string[]) {
    dynamicMessages.value = new Map(
      [...dynamicMessages.value.entries()].filter(
        ([messageKey]) => !paths.some((path) => messageKey.startsWith(`${path}:`)),
      ),
    )
  }

  function clearValidatedMessages(paths: readonly string[]) {
    if (!paths.length) {
      return
    }
    validatedMessages.value = new Map(
      [...validatedMessages.value.entries()].filter(([path]) => !paths.includes(path)),
    )
  }

  function storeValidatedMessages(statuses: readonly ReglePathStatus[]) {
    const next = new Map(validatedMessages.value)
    for (const { fieldPath: path, status } of statuses) {
      next.set(path, resolveRegleStatusErrors(status))
    }
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
    if (pendingPaths.value.get(key)?.size) {
      return true
    }
    const status =
      resolveRegleStatus(regle.r$, toReglePath(path.join('.'), params.state)) ??
      resolvePrimitiveItemStatus(itemsRegle.r$, path.join('.'))
    if (!isPendingRegleStatus(status)) {
      return false
    }
    return (
      readBooleanProperty(status, '$pending') ||
      hasPendingRegleRule(readReactiveProperty(status, '$rules'))
    )
  }

  function touchPaths(paths: readonly string[]) {
    touchedPaths.value = unique([...touchedPaths.value, ...paths.filter(Boolean)])
  }

  return {
    clearError,
    clearValidationState,
    errors,
    getFieldError,
    isPending,
    isTouched,
    markTouched,
    setError,
    validate,
    validateFields,
    validationErrors,
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
  getRequiredMessage?: () => string
  getUniqueMessage?: () => string
  getDateMinMessage?: (bound: string) => string
  getDateMaxMessage?: (bound: string) => string
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
        if (value === undefined) {
          continue
        }
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
  getRequiredMessage?: () => string
  getUniqueMessage?: () => string
  getDateMinMessage?: (bound: string) => string
  getDateMaxMessage?: (bound: string) => string
}): RegleRuleTree {
  const rules: RegleRuleTree = {}

  for (const field of params.fields) {
    if (field.ignore === true) {
      continue
    }
    const fieldInstance = createFormFieldInstance(field)
    if (fieldInstance.state.is('stateless')) {
      continue
    }
    if (isFlatPassthroughField(field)) {
      const childRules = buildFieldRules({ ...params, fields: getChildFieldsForRules(field) })
      for (const [key, value] of Object.entries(childRules)) {
        if (value !== undefined) {
          setRegleRuleNode(rules, key, value)
        }
      }
      continue
    }

    const path = fieldPath(params.parentPath, field)
    const api = params.apiFactory(path, field)
    const callbackParams = {
      api,
      ctx: params.context,
      deps: resolveFieldDependencies({
        field,
        parentPath: params.parentPath,
        state: params.state,
      }),
    }
    if (!shouldRenderField(field, callbackParams)) {
      continue
    }

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
      for (const row of getMatrixRows(field)) {
        matrixRules[row] = buildFieldRules({
          ...params,
          fields: getChildFieldsForRules(field),
          parentPath: [...path, row],
        })
      }
      setRegleRuleNode(rules, field.key, matrixRules)
      continue
    }

    if (isPrimitiveArrayField(field)) {
      setRegleRuleNode(rules, field.key, buildLeafRules({ ...params, callbackParams, field, path }))
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

    const fieldRules = buildLeafRules({ ...params, callbackParams, field, path })
    if (Object.keys(fieldRules).length) {
      setRegleRuleNode(rules, field.key, fieldRules)
    }
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
  if (!leaf) {
    return
  }

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
  getRequiredMessage?: () => string
  getUniqueMessage?: () => string
  getDateMinMessage?: (bound: string) => string
  getDateMaxMessage?: (bound: string) => string
}): RegleRuleTree {
  const output: RegleRuleTree = {}
  const validation = Object.getOwnPropertyDescriptor(params.field, 'validation')?.value
  const key = params.path.join('.')

  if (params.mode !== 'rules' && resolveRequired(params.field, params.callbackParams)) {
    output.required = withMessage(
      (value: FormValue) => !isEmptyValue(value),
      resolveRequiredMessage(params.field, params.getRequiredMessage?.()),
    )
  }

  if (params.mode === 'required') {
    return output
  }

  applyDateBoundsRules(output, params)

  const authoredValidators: FormValidatorsConfig | undefined =
    'validators' in params.field ? params.field.validators : undefined
  let validators: FormValidators | undefined
  if (isValidatorMap(authoredValidators)) {
    validators = authoredValidators
  } else if (isFunction(authoredValidators)) {
    validators = authoredValidators(params.callbackParams)
  }
  if (validators) {
    for (const name in validators) {
      const rule = validators[name]
      if (rule) {
        output[name] = rule
      }
    }
  }

  const authoredRules = isRecord(validation)
    ? Object.getOwnPropertyDescriptor(validation, 'rules')?.value
    : undefined
  if (!Array.isArray(authoredRules)) {
    return output
  }

  authoredRules.forEach((rule, index) => {
    if (!isRecord(rule)) {
      return
    }
    const validate = Object.getOwnPropertyDescriptor(rule, 'validate')?.value
    if (!isFunction(validate)) {
      return
    }
    if (!params.includeAsync && isAsyncFunction(validate)) {
      return
    }
    const ruleName = resolveRuleName(rule, index)
    const messageKey = `${key}:${ruleName}`
    function message() {
      return params.dynamicMessages.value.get(messageKey) ?? resolveRuleMessage(rule, params.field)
    }
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

function isValidatorMap(value: FormValidatorsConfig | undefined): value is FormValidators {
  return isObject(value)
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
  if (!messages.value.has(key)) {
    return
  }
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
  if (isFunction(message)) {
    return String(message())
  }
  if (isString(message) || isNumber(message)) {
    return String(message)
  }
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
    if (Array.isArray(current) && /^\d+$/u.test(segment)) {
      reglePath.push('$each')
    }
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
  if (isSteppedSchemaForRules(schema)) {
    return getSchemaStepsForRules(schema).flatMap((step) =>
      collectFormFieldsPathsForFields(step.fields, state, step.root ? [step.root] : []),
    )
  }
  return collectFormFieldsPathsForFields(getSchemaFieldsForRules(schema), state, [])
}

function collectFormFieldsPathsForFields(
  fields: readonly FormField[],
  state: FormObject,
  parentPath: readonly string[],
): readonly string[] {
  return fields.flatMap((field) => {
    if (field.ignore === true) {
      return []
    }
    const fieldInstance = createFormFieldInstance(field)
    if (fieldInstance.state.is('stateless')) {
      return []
    }
    if (isFlatPassthroughField(field)) {
      return collectFormFieldsPathsForFields(getChildFieldsForRules(field), state, parentPath)
    }

    const path = fieldPath(parentPath, field)
    if (isObjectContainerField(field)) {
      return collectFormFieldsPathsForFields(getChildFieldsForRules(field), state, path)
    }
    if (fieldInstance.type.is('matrix')) {
      return getMatrixRows(field).flatMap((row) =>
        collectFormFieldsPathsForFields(getChildFieldsForRules(field), state, [...path, row]),
      )
    }
    if (isPrimitiveArrayField(field)) {
      const value = getPathValue(state, path)
      const itemPaths = Array.isArray(value)
        ? value.map((_item, index) => [...path, String(index)].join('.'))
        : []
      return [path.join('.'), ...itemPaths]
    }
    if (isArrayField(field)) {
      const value = getPathValue(state, path)
      if (!Array.isArray(value)) {
        return []
      }
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
  if (!isRecord(schema)) {
    return []
  }
  const fields = Object.getOwnPropertyDescriptor(schema, 'fields')?.value
  return Array.isArray(fields) ? fields.filter(isFormFieldForRules) : []
}

function getSchemaStepsForRules(schema: FormValue) {
  if (!isRecord(schema)) {
    return []
  }
  const steps = Object.getOwnPropertyDescriptor(schema, 'steps')?.value
  if (!Array.isArray(steps)) {
    return []
  }
  return steps.flatMap((step) => {
    if (!isRecord(step)) {
      return []
    }
    const fields = Object.getOwnPropertyDescriptor(step, 'fields')?.value
    if (!Array.isArray(fields)) {
      return []
    }
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
  const tabs = Object.getOwnPropertyDescriptor(field, 'tabs')?.value
  if (Array.isArray(tabs)) {
    return tabs.flatMap((tab) => {
      const fields = isRecord(tab) ? tab.fields : undefined
      return Array.isArray(fields) ? fields.filter(isFormFieldForRules) : []
    })
  }
  const fields = Object.getOwnPropertyDescriptor(field, 'fields')?.value
  return Array.isArray(fields) ? fields.filter(isFormFieldForRules) : []
}

function isFormFieldForRules(value: FormValue): value is FormField {
  if (!isRecord(value)) {
    return false
  }
  return isString(value.key) && isString(value.type)
}

interface PrimitiveArrayTarget {
  field: FormField
  path: readonly string[]
  key: string
}

function mirrorKey(path: readonly string[]) {
  return path.join('/')
}

function resolvePrimitiveItemStatus(root: FormValue, path: string): FormValue {
  const segments = pathSegments(path)
  const index = segments.at(-1)
  if (index === undefined || !/^\d+$/u.test(index)) {
    return undefined
  }
  const key = mirrorKey(segments.slice(0, -1))
  if (resolveRegleStatus(root, key) === undefined) {
    return undefined
  }
  return resolveRegleStatus(root, `${key}.$each.${index}.value`)
}

function collectPrimitiveArraysForSchema(
  schema: FormValue,
  state: FormObject,
): readonly PrimitiveArrayTarget[] {
  if (isSteppedSchemaForRules(schema)) {
    return getSchemaStepsForRules(schema).flatMap((step) =>
      collectPrimitiveArraysForFields(step.fields, state, step.root ? [step.root] : []),
    )
  }
  return collectPrimitiveArraysForFields(getSchemaFieldsForRules(schema), state, [])
}

function collectPrimitiveArraysForFields(
  fields: readonly FormField[],
  state: FormObject,
  parentPath: readonly string[],
): readonly PrimitiveArrayTarget[] {
  return fields.flatMap((field) => {
    if (field.ignore === true) {
      return []
    }
    const fieldInstance = createFormFieldInstance(field)
    if (fieldInstance.state.is('stateless')) {
      return []
    }
    if (isFlatPassthroughField(field)) {
      return collectPrimitiveArraysForFields(getChildFieldsForRules(field), state, parentPath)
    }
    const path = fieldPath(parentPath, field)
    if (isObjectContainerField(field)) {
      return collectPrimitiveArraysForFields(getChildFieldsForRules(field), state, path)
    }
    if (fieldInstance.type.is('matrix')) {
      return getMatrixRows(field).flatMap((row) =>
        collectPrimitiveArraysForFields(getChildFieldsForRules(field), state, [...path, row]),
      )
    }
    if (isPrimitiveArrayField(field)) {
      return [{ field, key: mirrorKey(path), path }]
    }
    if (isArrayField(field)) {
      const value = getPathValue(state, path)
      if (!Array.isArray(value)) {
        return []
      }
      return value.flatMap((item, index) =>
        collectPrimitiveArraysForFields(
          getArrayItemFields(field, isRecord(item) ? item : {}),
          state,
          [...path, String(index)],
        ),
      )
    }
    return []
  })
}

function buildPrimitiveItemRules(params: {
  schema: FormValue
  state: FormObject
  context: FormRuntimeContext
  apiFactory: FormFieldApiFactory
  includeAsync: boolean
  mode: FormValidationMode
  dynamicMessages: Ref<Map<string, string>>
  getRequiredMessage?: () => string
  getUniqueMessage?: () => string
  getDateMinMessage?: (bound: string) => string
  getDateMaxMessage?: (bound: string) => string
}): RegleRuleTree {
  const rules: RegleRuleTree = {}
  for (const target of collectPrimitiveArraysForSchema(params.schema, params.state)) {
    const deps = resolveFieldDependencies({
      field: target.field,
      parentPath: target.path.slice(0, -1),
      state: params.state,
    })
    const collection: RegleCollectionRules = {
      $each: (_item: { value: FormValue }, index: number) => {
        const itemField = getPrimitiveArrayItemField(target.field, index)
        if (!itemField) {
          return {}
        }
        const itemPath = [...target.path, String(index)]
        const itemRules = buildLeafRules({
          ...params,
          callbackParams: {
            api: params.apiFactory(itemPath, itemField),
            ctx: params.context,
            deps,
          },
          field: itemField,
          path: itemPath,
        })
        if (params.mode !== 'required' && isUniqueArrayField(target.field)) {
          itemRules.unique = withMessage(
            (value: FormValue) =>
              countArrayValue(getPathValue(params.state, target.path), value) <= 1,
            resolveUniqueMessage(target.field, params.getUniqueMessage?.()),
          )
        }
        return { value: itemRules }
      },
    }
    rules[target.key] = collection
  }
  return rules
}

const DATE_VALIDATION_TYPES = new Set([
  'date',
  'datetime',
  'daterange',
  'monthrange',
  'datetimerange',
  'month',
  'year',
])

function isDateFamilyField(field: FormField): field is FormField & { type: FormDateFamilyType } {
  const type = Object.getOwnPropertyDescriptor(field, 'type')?.value
  return isString(type) && DATE_VALIDATION_TYPES.has(type)
}

function applyDateBoundsRules(
  output: RegleRuleTree,
  params: {
    field: FormField
    callbackParams: {
      ctx: FormRuntimeContext
      deps: FormObject
      api: ReturnType<FormFieldApiFactory>
    }
    getDateMinMessage?: (bound: string) => string
    getDateMaxMessage?: (bound: string) => string
  },
) {
  if (!isDateFamilyField(params.field)) {
    return
  }
  const dateField = params.field
  const bounds = resolveDateFieldBounds(dateField, params.callbackParams)
  if (bounds.min !== undefined) {
    output.dateMin = withMessage(
      (value: FormValue) => isWithinDateMin(value, bounds.min, dateField.type),
      params.getDateMinMessage?.(bounds.minLabel ?? '') ?? `Must be on or after ${bounds.minLabel}`,
    )
  }
  if (bounds.max !== undefined) {
    output.dateMax = withMessage(
      (value: FormValue) => isWithinDateMax(value, bounds.max, dateField.type),
      params.getDateMaxMessage?.(bounds.maxLabel ?? '') ??
        `Must be on or before ${bounds.maxLabel}`,
    )
  }
}

interface ResolvedDateBounds {
  min?: string | number
  max?: string | number
  minLabel?: string
  maxLabel?: string
}

function resolveDateFieldBounds(
  field: FormField & { type: FormDateFamilyType },
  callbackParams: {
    ctx: FormRuntimeContext
    deps: FormObject
    api: ReturnType<FormFieldApiFactory>
  },
): ResolvedDateBounds {
  const rawProps = Object.getOwnPropertyDescriptor(field, 'props')?.value
  const resolved = isFunction(rawProps) ? rawProps(callbackParams) : rawProps
  const propsRecord = isRecord(resolved) ? resolved : {}
  if (field.type === 'year') {
    const min = isNumber(propsRecord.min) ? propsRecord.min : undefined
    const max = isNumber(propsRecord.max) ? propsRecord.max : undefined
    return {
      max,
      maxLabel: max === undefined ? undefined : String(max),
      min,
      minLabel: min === undefined ? undefined : String(min),
    }
  }
  const minSeed = isDateSeedValue(propsRecord.min) ? propsRecord.min : null
  const maxSeed = isDateSeedValue(propsRecord.max) ? propsRecord.max : null
  const min = calendarSeedFromValue(minSeed, field.type) || undefined
  const max = calendarSeedFromValue(maxSeed, field.type) || undefined
  return { max, maxLabel: max, min, minLabel: min }
}

function isDateSeedValue(value: FormValue): value is FormDateSeedValue {
  return (
    value instanceof Date ||
    isString(value) ||
    isNumber(value) ||
    value === null ||
    value === undefined
  )
}

function dateFieldBoundValue(value: FormValue, type: FormDateFamilyType, edge: 'start' | 'end') {
  if (!isDateFamilyRange(type)) {
    return value
  }
  return Array.isArray(value) ? value[edge === 'start' ? 0 : 1] : undefined
}

function isWithinDateMin(
  value: FormValue,
  min: string | number | undefined,
  type: FormDateFamilyType,
) {
  if (min === undefined) {
    return true
  }
  const bound = dateFieldBoundValue(value, type, 'start')
  if (isEmptyValue(bound)) {
    return true
  }
  if (isNumber(min)) {
    const numeric = isString(bound) ? Number(bound) : Number.NaN
    return Number.isNaN(numeric) || numeric >= min
  }
  const canonical = calendarSeedFromValue(isDateSeedValue(bound) ? bound : null, type)
  return !canonical || canonical >= min
}

function isWithinDateMax(
  value: FormValue,
  max: string | number | undefined,
  type: FormDateFamilyType,
) {
  if (max === undefined) {
    return true
  }
  const bound = dateFieldBoundValue(value, type, 'end')
  if (isEmptyValue(bound)) {
    return true
  }
  if (isNumber(max)) {
    const numeric = isString(bound) ? Number(bound) : Number.NaN
    return Number.isNaN(numeric) || numeric <= max
  }
  const canonical = calendarSeedFromValue(isDateSeedValue(bound) ? bound : null, type)
  return !canonical || canonical <= max
}

function isUniqueArrayField(field: FormField) {
  return Object.getOwnPropertyDescriptor(field, 'unique')?.value === true
}

function resolveUniqueMessage(field: FormField, fallback: string | undefined) {
  const message = Object.getOwnPropertyDescriptor(field, 'uniqueMessage')?.value
  return resolveFormBoundaryText(message) ?? fallback ?? 'This value is already in the list'
}

function sameArrayValue(left: FormValue, right: FormValue) {
  if (left === right) {
    return true
  }
  if (!isRecord(left) && !Array.isArray(left)) {
    return false
  }
  return JSON.stringify(left) === JSON.stringify(right)
}

function countArrayValue(values: FormValue, value: FormValue) {
  if (!Array.isArray(values) || isEmptyValue(value)) {
    return 0
  }
  return values.filter((candidate) => sameArrayValue(candidate, value)).length
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
  if (!paths.length) {
    return
  }
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
  if (!paths.length) {
    return
  }
  const next = new Map(pendingPaths.value)
  for (const path of paths) {
    const tokens = new Set(next.get(path) ?? [])
    tokens.delete(token)
    if (tokens.size) {
      next.set(path, tokens)
    } else {
      next.delete(path)
    }
  }
  pendingPaths.value = next
}

interface RegleValidatableStatus {
  readonly $errors: FormValue
  $invalid: boolean
  $touch: (runCommit?: boolean) => void
  $reset: () => void
  $validate: () => Promise<FormValue>
  $validateWithoutRaceconditions: () => Promise<FormValue>
}

function hasAsyncRegleRule(status: RegleValidatableStatus) {
  const rules = readReactiveProperty(status, '$rules')
  if (!isRecord(rules)) {
    return false
  }
  return Object.values(rules).some((rule) => readBooleanProperty(rule, '$haveAsync'))
}

interface ReglePathStatus {
  path: string
  fieldPath: string
  status: RegleValidatableStatus
}

interface RegleRoots {
  main: FormValue
  items: FormValue
}

function prepareReglePaths(
  regle: RegleRoots,
  syncRegle: RegleRoots,
  paths: readonly string[],
  state: FormObject,
) {
  const regleStatuses = collectRegleStatuses(regle, paths, state)
  const syncStatuses = collectRegleStatuses(syncRegle, paths, state)

  regleStatuses.forEach(({ status }) => status.$reset())
  syncStatuses.forEach(({ status }) => status.$reset())

  return {
    regleStatuses,
    syncResults: new Map<string, boolean>(),
    syncStatuses,
  }
}

async function validateSyncRegleStatuses(statuses: readonly ReglePathStatus[]) {
  const validations = statuses.map(({ status }) => status.$validateWithoutRaceconditions())
  await Promise.all(validations)
  const results = statuses.map(
    ({ path, status }) => [path, !readBooleanProperty(status, '$invalid')] as const,
  )
  return { results: new Map(results), valid: results.every(([, valid]) => valid) }
}

function collectRegleStatuses(
  regle: RegleRoots,
  paths: readonly string[],
  state: FormObject,
): readonly ReglePathStatus[] {
  return unique(paths).flatMap((candidatePath) => {
    const path = toReglePath(candidatePath, state)
    const status =
      resolveRegleStatus(regle.main, path) ?? resolvePrimitiveItemStatus(regle.items, candidatePath)
    return isValidatableRegleStatus(status) ? [{ fieldPath: candidatePath, path, status }] : []
  })
}

async function validateRegleStatuses(statuses: readonly RegleValidatableStatus[]) {
  if (!statuses.length) {
    return true
  }
  statuses.forEach((status) => status.$touch(false))
  await nextTick()
  const validations = statuses.map((status) => status.$validateWithoutRaceconditions())
  await Promise.all(validations)
  return statuses.every((status) => !readBooleanProperty(status, '$invalid'))
}

function resolveRegleStatus(regle: FormValue, path: string): FormValue {
  return pathSegments(path).reduce<FormValue>((current, segment) => {
    if (Array.isArray(current)) {
      return current[Number(segment)]
    }
    if (!isObject(current)) {
      return
    }
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
  if (!isObject(value) || value === null) {
    return false
  }
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
  if (!isRecord(value)) {
    return
  }
  return unref(Object.getOwnPropertyDescriptor(value, key)?.value)
}
