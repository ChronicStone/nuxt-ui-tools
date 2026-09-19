import type { FormContainerFieldBase } from '../../types/field-base'
import type { FormRenderable, FormText, FormObject } from '../../types/utils'
import type {
  FormArrayActionParams,
  FormArrayFieldActions,
  FormArrayVirtualFields,
} from '../array-list/types'

export interface FormArrayTabActionParams<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormArrayActionParams<TContext, TDeps> {
  setActiveTab: (index: number) => void
}

export interface FormArrayTabsField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormContainerFieldBase<'array-tabs', TContext, TDeps> {
  addItemLabel?: FormText
  emptyLabel?: FormText
  itemLabel?: FormText
  compact?: boolean
  /** Enables drag-to-reorder tabs. Defaults to `true`. */
  draggable?: boolean
  confirmDelete?: boolean | FormText
  headerTemplate?: (item: FormObject, index: number, deps: TDeps) => FormText
  tabAction?: (
    item: FormObject,
    index: number,
    params: FormArrayTabActionParams<TContext, TDeps>,
  ) => FormRenderable
  transformOnCreate?: (item: FormObject, index: number, deps: TDeps) => FormObject
  virtualFields?: FormArrayVirtualFields
  extraProperties?: boolean
  actions?: FormArrayFieldActions<TContext, TDeps>
}

export type ArrayTabsFieldOutput<TChildren> = readonly TChildren[]
