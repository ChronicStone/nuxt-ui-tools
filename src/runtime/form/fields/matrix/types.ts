import type { FormField } from '../../types/field'
import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FormText } from '../../types/utils'

export interface FormMatrixRow<TKey extends string = string> {
  key: TKey
  label: FormText
  /** Supporting copy rendered under the row label. */
  description?: FormText
}

/** Full-width row that opens a group of matrix rows. It holds no value. */
export interface FormMatrixSection {
  type: 'section'
  label: FormText
  description?: FormText
}

export type FormMatrixEntry = FormMatrixRow | FormMatrixSection

export interface FormMatrixProps {
  minWidth?: number | string
  rowHeaderWidth?: number | string
  /** Heading of the row label column, shown in the header corner. */
  rowHeaderLabel?: FormText
  bordered?: boolean
  striped?: boolean
  hoverable?: boolean
  compact?: boolean
}

export interface FormMatrixField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormStatefulFieldBase<'matrix', object, TContext, TDeps, FormMatrixProps> {
  /** Value rows, optionally grouped by section entries placed before the rows they head. */
  rows: readonly FormMatrixEntry[]
  fields: readonly FormField<TContext, TDeps>[]
}

export type MatrixFieldOutput<TRows extends readonly object[], TChildren> = {
  [TRow in Extract<TRows[number], { key: string }> as TRow['key']]: TChildren
}
