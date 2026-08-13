import type { FormField } from '../../types/field'
import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FormText } from '../../types/utils'

export interface FormMatrixRow<TKey extends string = string> {
  key: TKey
  label: FormText
}

export interface FormMatrixField<TContext = {}, TDeps = {}> extends FormStatefulFieldBase<
  'matrix',
  object,
  TContext,
  TDeps
> {
  rows: readonly FormMatrixRow[]
  fields: readonly FormField<TContext, TDeps>[]
  minWidth?: number | string
}

export type MatrixFieldOutput<TRows extends readonly FormMatrixRow[], TChildren> = {
  [TRow in TRows[number] as TRow['key']]: TChildren
}
