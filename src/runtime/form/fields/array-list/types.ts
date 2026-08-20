import type { FormValue } from '../../types'
import type { FormContainerFieldBase } from '../../types/field-base'
import type { FormMaybePromise, FormObject, FormText } from '../../types/utils'

export interface FormArrayVirtualFields {
  [key: string]: (index: number) => FormValue
}

export interface FormArrayActionParams<TContext = {}, TDeps = {}> {
  index: number
  item: FormObject
  items: readonly FormObject[]
  ctx: TContext
  deps: TDeps
  getValue: (key: string) => FormValue
  setValue: (key: string, value: FormValue) => void
  getOptions: (key: string) => readonly FormValue[]
}

export interface FormArrayCustomAction<TContext = {}, TDeps = {}> {
  label: FormText
  icon?: string
  condition?: (params: FormArrayActionParams<TContext, TDeps>) => boolean
  action: (params: FormArrayActionParams<TContext, TDeps>) => FormMaybePromise<void>
}

export type FormArrayActionCondition<TContext = {}, TDeps = {}> =
  | boolean
  | ((params: FormArrayActionParams<TContext, TDeps>) => boolean)

export interface FormArrayBaseAction<TContext = {}, TDeps = {}> {
  label?: FormText
  icon?: string
  condition?: FormArrayActionCondition<TContext, TDeps>
}

export type FormArrayAction<TContext = {}, TDeps = {}> =
  | FormArrayActionCondition<TContext, TDeps>
  | FormArrayBaseAction<TContext, TDeps>

export interface FormArrayFieldActions<TContext = {}, TDeps = {}> {
  addItem?: FormArrayAction<TContext, TDeps>
  deleteItem?: FormArrayAction<TContext, TDeps>
  custom?: readonly FormArrayCustomAction<TContext, TDeps>[]
}

export interface FormArrayListField<TContext = {}, TDeps = {}> extends FormContainerFieldBase<
  'array-list',
  TContext,
  TDeps
> {
  addItemLabel?: FormText
  emptyLabel?: FormText
  itemLabel?: FormText
  compact?: boolean
  /** Enables drag-to-reorder. Defaults to `true`. */
  draggable?: boolean
  confirmDelete?: boolean | FormText
  headerTemplate?: (item: FormObject, index: number, deps: TDeps) => FormText
  transformOnCreate?: (item: FormObject, index: number, deps: TDeps) => FormObject
  virtualFields?: FormArrayVirtualFields
  extraProperties?: boolean
  actions?: FormArrayFieldActions<TContext, TDeps>
}

export type ArrayListFieldOutput<TChildren> = readonly TChildren[]
