import type { FormField } from '../../types/field'
import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FormText } from '../../types/utils'

export interface FormMatrixRow<TKey extends string = string> {
  key: TKey
  label: FormText
}

export interface FormMatrixProps {
  minWidth?: number | string
  rowHeaderWidth?: number | string
  bordered?: boolean
  striped?: boolean
  hoverable?: boolean
  compact?: boolean
}

export interface FormMatrixField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormStatefulFieldBase<'matrix', object, TContext, TDeps, FormMatrixProps> {
  rows: readonly FormMatrixRow[]
  fields: readonly FormField<TContext, TDeps>[]
}

export type MatrixFieldOutput<TRows extends readonly FormMatrixRow[], TChildren> = {
  [TRow in TRows[number] as TRow['key']]: TChildren
}
