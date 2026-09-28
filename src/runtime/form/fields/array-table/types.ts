import type { FormContainerFieldBase } from '../../types/field-base'
import type { FormArrayListField, FormArrayListProps } from '../array-list/types'

export interface FormArrayTableProps extends FormArrayListProps {
  minWidth?: number | string
  /**
   * Renders rows as the markup of their controls until they are used, so a long table paints in
   * one fast frame: a row renders its live controls when a pointer or focus enters it, a click
   * reaches it, or the form focuses one of its fields. Cells look and behave the same either way.
   *
   * - `'auto'` (default): rows render live until the render of the frame has used its time budget,
   *   and the rows after that render inert, so a small table is fully live and a large one still
   *   paints in one frame, whatever the device.
   * - `true`: every row renders inert.
   * - `false`: every row renders live.
   *
   * The server renders every row live, and hydration keeps them exactly as the server rendered
   * them, so only renders in the browser, such as a client-side navigation or rows added later,
   * produce inert rows.
   */
  inert?: boolean | 'auto'
}

export interface FormArrayTableField<TContext = NonNullable<unknown>, TDeps = NonNullable<unknown>>
  extends
    Omit<FormArrayListField<TContext, TDeps>, 'type' | 'props'>,
    Pick<
      FormContainerFieldBase<'array-table', TContext, TDeps, FormArrayTableProps>,
      'type' | 'props'
    > {}

export type ArrayTableFieldOutput<TChildren> = readonly TChildren[]
