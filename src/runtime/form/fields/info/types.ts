import type { DisplayKind, DisplayPropsMap } from '../../../display/types'
import type { FormFieldCallback, FormFieldCallbackParams } from '../../types/callbacks'
import type { FormQueryOptions } from '../../types/context'
import type {
  FormFieldDescription,
  FormFieldProps,
  FormStatelessFieldBase,
} from '../../types/field-base'
import type { FormDynamic, FormRenderable, FormText } from '../../types/utils'

/** Props of a notice field: its `content` drawn in an alert. */
export interface FormInfoProps {
  title?: FormText
  icon?: string | false
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  variant?: 'solid' | 'outline' | 'soft' | 'subtle'
}

interface FormInfoFieldBase<TContext, TDeps> extends Omit<
  FormStatelessFieldBase<'info', TContext, TDeps>,
  'props'
> {
  /** Raw dependency paths read before evaluating `props`, `content` and `condition`. */
  dependencies?: readonly (string | readonly [string, string])[]
  /**
   * Draws the field inside the standard label wrapper, like an input, for a read-only value that
   * belongs in the form grid. `description`, `hint` and `help` do the same.
   */
  label?: FormText
  description?: FormText | FormFieldDescription
  hint?: FormText
  help?: FormText
}

/** A notice: `content` in an alert, styled by `props`. */
export interface FormInfoNoticeField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormInfoFieldBase<TContext, TDeps> {
  display?: undefined
  preset?: undefined
  content: FormRenderable | FormFieldCallback<FormRenderable, TContext, TDeps>
  props?: FormFieldProps<FormInfoProps, TContext, TDeps>
}

/**
 * Props of a display block, or a way to load them: a promise, or TanStack Query options whose
 * data (after `select`) is the props, cached under their `queryKey`.
 */
export type FormInfoDisplaySource<TProps> = TProps | Promise<TProps> | FormQueryOptions<TProps>

/**
 * A display block: `display` picks the kind and `props` configure it, statically or from the
 * field's dependencies, so the block follows the form values. `props` may also load them: a
 * callback returning a promise or query options runs again when a dependency changes, shows the
 * block's skeleton until they arrive, drops a late answer to an older run, and shows a compact
 * error with a retry button when loading fails.
 *
 * @example
 * ```ts
 * {
 *   key: 'quote',
 *   type: 'info',
 *   display: 'breakdown',
 *   dependencies: ['seats'],
 *   props: ({ deps }) => ({
 *     lines: [{ label: 'Licences', detail: `${deps.get<number>('seats')} × 96 €`, value: '…' }],
 *     total: { label: 'Total', value: '…' },
 *   }),
 * }
 *
 * {
 *   key: 'accountNote',
 *   type: 'info',
 *   display: 'text',
 *   dependencies: ['accountId'],
 *   props: ({ deps }) =>
 *     queryOptions({
 *       queryKey: ['accounts', deps.get('accountId'), 'note'],
 *       queryFn: () => fetchAccountNote(deps.get('accountId')),
 *       select: (note) => ({ appearance: 'quote', text: note.body, author: note.author }),
 *     }),
 * }
 * ```
 */
export type FormInfoDisplayField<TContext = NonNullable<unknown>, TDeps = NonNullable<unknown>> = {
  [TKind in DisplayKind]: FormInfoFieldBase<TContext, TDeps> & {
    display: TKind
    /** Name of a preset in `appConfig.nuxtUiTools.display.presets[display]`; `props` override it. */
    preset?: string
    content?: undefined
    /**
     * The block's props, or a callback receiving `{ ctx, deps, api }` that returns them, a promise
     * of them, or query options. `api.form` sets values, submits, or closes the form, so a block
     * action can act on it.
     */
    props: FormDynamic<
      FormInfoDisplaySource<DisplayPropsMap[TKind]>,
      FormFieldCallbackParams<TContext, TDeps>
    >
  }
}[DisplayKind]

export type FormInfoField<TContext = NonNullable<unknown>, TDeps = NonNullable<unknown>> =
  | FormInfoNoticeField<TContext, TDeps>
  | FormInfoDisplayField<TContext, TDeps>
