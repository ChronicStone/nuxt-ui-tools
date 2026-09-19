import type { FormValue } from '../../types'
import type { FormFieldApi } from '../../types/api'
import type { FormField } from '../../types/field'
import type { FormStatefulFieldBase } from '../../types/field-base'
import type { ResolveFormFieldValue } from '../../types/field-output'
import type { FormObject, FormRenderable, FormText } from '../../types/utils'

type ContainerFieldType =
  | 'array-list'
  | 'array-table'
  | 'array-tabs'
  | 'array-variant'
  | 'array-collapse'
  | 'array-primitive'
  | 'object'
  | 'group'
  | 'input-group'
  | 'card'
  | 'column'
  | 'matrix'
  | 'info'
  | 'divider'
  | 'section'
  | 'button'
  | 'hidden'

type ItemFieldChrome = 'key' | 'label' | 'description' | 'hint' | 'help' | 'labelExtra' | 'layout'

type DistributiveOmit<TValue, TKey extends PropertyKey> = TValue extends unknown
  ? Omit<TValue, TKey>
  : never

export type FormArrayPrimitiveItemField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = DistributiveOmit<
  Exclude<FormField<TContext, TDeps>, { type: ContainerFieldType }>,
  ItemFieldChrome
>

export interface FormArrayPrimitivePreviewParams<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> {
  value: FormValue
  index: number
  option: FormObject | undefined
  ctx: TContext
  deps: TDeps
}

export interface FormArrayPrimitiveActionParams<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> {
  values: readonly FormValue[]
  ctx: TContext
  deps: TDeps
  api: FormFieldApi<FormValue, FormValue, TContext>
}

export interface FormArrayPrimitiveItemActionParams<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormArrayPrimitiveActionParams<TContext, TDeps> {
  value: FormValue
  index: number
}

export interface FormArrayPrimitiveActions<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> {
  addItem?: boolean | ((params: FormArrayPrimitiveActionParams<TContext, TDeps>) => boolean)
  deleteItem?: boolean | ((params: FormArrayPrimitiveItemActionParams<TContext, TDeps>) => boolean)
}

export interface FormArrayPrimitiveField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormStatefulFieldBase<'array-primitive', readonly FormValue[] | null, TContext, TDeps> {
  field: FormArrayPrimitiveItemField<TContext, TDeps>
  preview?: (params: FormArrayPrimitivePreviewParams<TContext, TDeps>) => FormRenderable
  addItemLabel?: FormText
  emptyLabel?: FormText
  confirmDelete?: boolean | FormText
  unique?: boolean
  uniqueMessage?: FormText
  actions?: FormArrayPrimitiveActions<TContext, TDeps>
}

type ItemField<TField> = TField extends { field: infer TItem } ? TItem : never

export type ArrayPrimitiveFieldOutput<TField> = readonly NonNullable<
  ResolveFormFieldValue<ItemField<TField>>
>[]
