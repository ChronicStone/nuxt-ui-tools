import { computed } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import { useFormRuntimeContext } from '../../composables/use-form-runtime'
import { useFormUi } from '../../composables/use-form-ui'
import type {
  FormValue,
  FormArrayCollapseField,
  FormArrayListField,
  FormArrayTableField,
  FormArrayTabsField,
  FormArrayVariantField,
  FormField,
} from '../../types'
import type { FormObject } from '../../types/utils'
import { syncFormArrayItems } from '../../utils/array'
import { isBoolean, isFunction, isNumber, isObject, isString } from '../../utils/predicate'
import { buildInitialFormFieldsState } from '../../utils/state'
import { resolveFormBoundaryText, resolveFormText } from '../../utils/text'
import type { FormArrayAction, FormArrayBaseAction } from './types'

export type FormArrayItemsField =
  | FormArrayListField
  | FormArrayTableField
  | FormArrayTabsField
  | FormArrayVariantField
  | FormArrayCollapseField

export function isFormObject(value: FormValue): value is FormObject {
  return isObject(value) && value !== null && !Array.isArray(value)
}

export function isArrayActionConfig(
  action: FormArrayAction | undefined,
): action is FormArrayBaseAction {
  return isObject(action) && !isFunction(action)
}

export function useFormArrayItems(field: () => FormArrayItemsField, path: () => readonly string[]) {
  const form = useFormRuntimeContext()
  const formUi = useFormUi()
  const { t } = useUiToolsLocale()
  const itemKeys = new WeakMap<FormObject, string>()
  let nextItemKey = 0

  const items = computed<readonly FormObject[]>(() => {
    const value = form.getValue(path())
    return Array.isArray(value) ? value.filter(isFormObject) : []
  })
  const title = computed(() => resolveFormText(field().label))
  const description = computed(() => resolveFormText(field().description))
  const addItemLabel = computed(() =>
    resolveArrayActionLabel(
      field().actions?.addItem,
      resolveFormText(field().addItemLabel) ?? t('form.fields.array.addItem'),
    ),
  )
  const addItemIcon = computed(() =>
    resolveArrayActionIcon(field().actions?.addItem, 'i-lucide-plus'),
  )
  const emptyLabel = computed(
    () => resolveFormText(field().emptyLabel) ?? t('form.fields.array.empty'),
  )
  const itemLabel = computed(
    () => resolveFormText(field().itemLabel) ?? t('form.fields.array.item'),
  )
  const canAdd = computed<boolean>(() => resolveAction(field().actions?.addItem, -1))
  const isDraggable = computed<boolean>(() => field().draggable !== false)
  const variantItems = computed(() => {
    const current = field()
    return current.type === 'array-variant'
      ? current.variants.map((variant) => ({
          label: resolveFormText(variant.label) ?? String(variant.key),
          value: variant.key,
        }))
      : []
  })

  function createItem(index: number, variantKey?: string | number) {
    const current = field()
    const variant =
      current.type === 'array-variant'
        ? (current.variants.find((candidate) => candidate.key === variantKey) ??
          current.variants[0])
        : undefined
    const fields = variant?.fields ?? fieldsForItem({})
    let item = buildInitialFormFieldsState(fields, form.context)
    if (variant && current.type === 'array-variant') {
      item[current.variantKey] = variant.key
    }
    item = applyVirtualFields(item, index)
    if (current.transformOnCreate) {
      item = current.transformOnCreate(item, index, actionParams(index).deps)
    }
    return item
  }

  function addItem(variantKey?: string | number) {
    const index = items.value.length
    updateItems([...items.value, createItem(index, variantKey)])
    return index
  }

  function confirmRemoval() {
    const current = field()
    if (!current.confirmDelete) {
      return true
    }
    const message =
      resolveFormBoundaryText(current.confirmDelete) ?? t('form.fields.array.confirmDelete')
    // oxlint-disable-next-line no-alert -- confirmation stays native until the engine ships its own confirm overlay
    return window.confirm(message)
  }

  function removeItem(index: number) {
    if (!confirmRemoval()) {
      return false
    }
    updateItems(items.value.filter((_, itemIndex) => itemIndex !== index))
    return true
  }

  function fieldsForItem(item: FormObject): readonly FormField[] {
    const current = field()
    if (current.type !== 'array-variant') {
      return current.fields
    }
    const variant = current.variants.find((candidate) => candidate.key === item[current.variantKey])
    return variant?.fields ?? []
  }

  function applyVirtualFields(item: FormObject, index: number) {
    const current = field()
    const fields =
      current.type === 'array-variant'
        ? current.variants.find((variant) => variant.key === item[current.variantKey])
            ?.virtualFields
        : current.virtualFields
    if (!fields) {
      return item
    }
    for (const [key, resolver] of Object.entries(fields)) {
      item[key] = resolver(index)
    }
    return item
  }

  function itemHeading(item: FormObject, index: number) {
    return (
      resolveFormText(field().headerTemplate?.(item, index, actionParams(index).deps)) ??
      `${itemLabel.value} ${index + 1}`
    )
  }

  function resolveAction(action: FormArrayAction | undefined, index: number) {
    const condition = isArrayActionConfig(action) ? action.condition : action
    if (isBoolean(condition)) {
      return condition
    }
    if (!isFunction(condition)) {
      return true
    }
    return condition(actionParams(index))
  }

  function canDelete(index: number) {
    return resolveAction(field().actions?.deleteItem, index)
  }

  function updateVariant(index: number, value: string | number) {
    const current = field()
    if (current.type !== 'array-variant') {
      return
    }
    if (!current.variants.some((candidate) => candidate.key === value)) {
      return
    }
    const nextItems = [...items.value]
    nextItems[index] = createItem(index, value)
    updateItems(nextItems)
  }

  function variantValue(item: FormObject | undefined) {
    const current = field()
    if (current.type !== 'array-variant' || !item) {
      return
    }
    const value = item[current.variantKey]
    return isString(value) || isNumber(value) ? value : undefined
  }

  async function runCustomAction(index: number, actionIndex: number) {
    const action = field().actions?.custom?.[actionIndex]
    const item = items.value[index]
    if (!action || !item) {
      return
    }
    await action.action(actionParams(index))
  }

  function customActionVisible(index: number, actionIndex: number) {
    const action = field().actions?.custom?.[actionIndex]
    const item = items.value[index]
    if (!action || !item) {
      return false
    }
    return action.condition?.(actionParams(index)) ?? true
  }

  function hasCustomActions(index: number) {
    return Boolean(
      field().actions?.custom?.some((_action, actionIndex) =>
        customActionVisible(index, actionIndex),
      ),
    )
  }

  function updateItems(value: readonly FormObject[]) {
    const current = form.getValue(path())
    if (!syncFormArrayItems(current, value)) {
      form.setValue(
        path(),
        value.map((item, index) => applyVirtualFields(item, index)),
      )
      return
    }

    if (!Array.isArray(current)) {
      return
    }
    for (const [index, item] of current.entries()) {
      if (isFormObject(item)) {
        applyVirtualFields(item, index)
      }
    }
  }

  function itemPath(index: number) {
    return [...path(), String(index)]
  }

  function itemKey(item: FormObject) {
    const existing = itemKeys.get(item)
    if (existing) {
      return existing
    }
    nextItemKey += 1
    const key = `array-item-${nextItemKey}`
    itemKeys.set(item, key)
    return key
  }

  function itemRenderKey(item: FormObject, index: number) {
    return `${itemKey(item)}:${index}`
  }

  function itemHasError(index: number) {
    const prefix = `${itemPath(index).join('.')}.`
    return form.errors.value.some((error) => error.path.startsWith(prefix))
  }

  function actionParams(index: number) {
    const item = items.value[index] ?? {}
    const callback = form.getFieldCallbackParams(path(), field())
    return {
      ctx: callback.ctx,
      deps: callback.deps,
      getOptions: (key: string) =>
        form.getFieldApi([...itemPath(index), ...key.split('.')]).options.get(),
      getValue: (key: string) => form.getValue([...itemPath(index), ...key.split('.')]),
      index,
      item,
      items: items.value,
      setValue: (key: string, value: FormValue) =>
        form.setValue([...itemPath(index), ...key.split('.')], value),
    }
  }

  return {
    actionParams,
    addItem,
    addItemIcon,
    addItemLabel,
    applyVirtualFields,
    canAdd,
    canDelete,
    customActionVisible,
    description,
    emptyLabel,
    fieldsForItem,
    form,
    formUi,
    hasCustomActions,
    isDraggable,
    itemHasError,
    itemHeading,
    itemKey,
    itemLabel,
    itemPath,
    itemRenderKey,
    items,
    removeItem,
    resolveAction,
    runCustomAction,
    t,
    title,
    updateItems,
    updateVariant,
    variantItems,
    variantValue,
  }
}

function resolveArrayActionLabel(action: FormArrayAction | undefined, fallback: string) {
  if (!isArrayActionConfig(action)) {
    return fallback
  }
  return resolveFormText(action.label) ?? fallback
}

function resolveArrayActionIcon(action: FormArrayAction | undefined, fallback: string) {
  if (!isArrayActionConfig(action) || !isString(action.icon)) {
    return fallback
  }
  return action.icon
}
