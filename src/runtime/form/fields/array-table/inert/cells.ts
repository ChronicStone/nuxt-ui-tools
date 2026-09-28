import { h } from 'vue'
import type { VNode } from 'vue'

import { isOptionValue } from '../../../composables/use-field-options'
import type { useFormUi } from '../../../composables/use-form-ui'
import type {
  FormControlUi,
  FormField,
  FormFieldCallbackParams,
  FormObject,
  FormOptionValue,
  FormRuntime,
  FormUiClass,
  FormValue,
} from '../../../types'
import {
  isDisabledByField,
  resolveControlPlaceholder,
  resolveControlProps,
  resolveFieldProps,
} from '../../../utils/field-control'
import type { FormControlProps } from '../../../utils/field-control'
import { createFormFieldInstance } from '../../../utils/field-instance'
import { formOptionKey } from '../../../utils/options'
import type { ResolvedFormOption } from '../../../utils/options'
import { isRecord } from '../../../utils/path'
import { isNumber, isString } from '../../../utils/predicate'
import { resolveRequired } from '../../../utils/state'
import { resolveFormBoundaryText, resolveFormText } from '../../../utils/text'
import { mergeFormUiClass } from '../../../utils/ui'
import type { InertIcons } from './icon'
import type { InertOptions } from './options'
import type { InertClass, InertTheme, InertVariants } from './theme'

/** What inert cells of one table share: the form, its UI settings, and cached resolvers. */
export interface InertEnvironment {
  /**
   * `'always'` renders every row inert; `'auto'` renders rows live while the render of the frame
   * has time left in its budget, and inert after.
   */
  mode: 'always' | 'auto'
  form: FormRuntime
  formUi: ReturnType<typeof useFormUi>
  theme: InertTheme
  icons: InertIcons
  options: InertOptions
  /** Locale of the form, used to format numbers as the live control does. */
  locale: () => string
  text: (key: 'placeholder' | 'increment' | 'decrement') => string
  icon: (name: 'chevronDown' | 'loading' | 'plus' | 'minus' | 'check') => string
}

/** A table cell to render inert. */
export interface InertCellTarget {
  field: FormField
  path: readonly string[]
  /** `ui.control` of the table, which the live cell adds to its wrapper. */
  controlClass: FormUiClass | undefined
  /** Receives clicks on the inert control, such as a tap, to render the cell live. */
  onClick: (event: MouseEvent) => void
}

interface InertControl {
  env: InertEnvironment
  field: FormField
  path: readonly string[]
  pathKey: string
  params: FormFieldCallbackParams
  fieldProps: FormObject
  value: FormValue
  invalid: boolean
  disabled: boolean
  /** Accessible name of the control, as a bare control receives it from its cell. */
  label: string
  onClick: (event: MouseEvent) => void
}

type InertRenderer = (control: InertControl) => VNode | undefined

const RENDERERS: Readonly<Record<string, InertRenderer>> = {
  checkbox: renderCheckbox,
  number: renderNumber,
  select: renderSelect,
  switch: renderSwitch,
  text: renderText,
}

/** True when the field type has an inert look; other cells render their live control. */
export function hasInertRenderer(field: FormField) {
  return Object.hasOwn(RENDERERS, field.type)
}

/**
 * Renders the content of an array-table cell as the same markup its live control produces, from
 * the same props, theme, and state, without mounting the control. A cell whose `condition` hides
 * its field keeps the empty field wrapper, as the live cell does. Returns `undefined` when the
 * cell uses something only its live control renders, such as a clear button or a remote source,
 * so the caller renders that cell live.
 */
export function renderInertCell(env: InertEnvironment, target: InertCellTarget) {
  const renderer = RENDERERS[target.field.type]
  if (!renderer) {
    return
  }
  const params = env.form.getFieldCallbackParams(target.path, target.field)
  const error = env.form.getFieldError(target.path)
  const control = env.form.shouldRender(target.field, target.path)
    ? renderer({
        disabled: isDisabledByField(target.field, params) || env.form.actionPending.value !== null,
        env,
        field: target.field,
        fieldProps: resolveFieldProps(target.field, params),
        invalid: Boolean(error),
        label: controlLabel(target.field),
        onClick: target.onClick,
        params,
        path: target.path,
        pathKey: target.path.join('.'),
        value: env.form.getValue(target.path),
      })
    : null
  if (control === undefined) {
    return
  }
  const formField = env.theme.slots('formField', { orientation: 'vertical' })
  return h(
    'div',
    {
      class: mergeFormUiClass(
        'relative flex w-full items-center [&>*]:w-full',
        target.controlClass,
      ),
      'data-form-cell-invalid': error ? target.path.join('.') : undefined,
    },
    h(
      'div',
      {
        class: formField.root({ class: 'w-full' }),
        'data-orientation': 'vertical',
        'data-slot': 'root',
      },
      [
        h('div', { class: formField.wrapper(), 'data-slot': 'wrapper' }),
        h('div', { class: '' }, [
          control,
          isString(error) && error
            ? h(
                'div',
                { class: formField.error({ class: 'sr-only' }), 'data-slot': 'error' },
                error,
              )
            : null,
        ]),
      ],
    ),
  )
}

function renderSelect(control: InertControl) {
  const { env, fieldProps } = control
  if (fieldProps.icon || fieldProps.leadingIcon || fieldProps.avatar) {
    return
  }
  const optionState = env.options.resolve(control.field, control.params)
  if (!optionState) {
    return
  }
  const multiple = fieldProps.multiple === true
  const selected = selectedValues(control.value, multiple)
  if (fieldProps.clearable === true && selected.length > 0 && !control.disabled) {
    return
  }
  const props = controlProps(control, ['createItem', 'max', 'searchable', 'clearable'])
  const optionConfig = Object.getOwnPropertyDescriptor(control.field, 'options')?.value
  const disableOnLoading = !isRecord(optionConfig) || optionConfig.disableOnLoading !== false
  const disabled =
    control.disabled || (disableOnLoading && optionState.loading && !optionState.items.length)
  const loading = optionState.loading || validationPending(control)
  const ui = env.theme.slots('selectMenu', {
    ...stateVariants(control, props),
    fieldGroup: undefined,
    leading: false,
    loading,
    multiple,
    size: props.size,
    trailing: true,
    variant: stringProp(props.variant),
    virtualize: false,
  })
  const overrides = slotOverrides(props.ui)
  const label = displayLabel(optionState.items, selected, multiple)
  const trailingIcon = loading
    ? (stringProp(fieldProps.loadingIcon) ?? env.icon('loading'))
    : (stringProp(fieldProps.trailingIcon) ?? env.icon('chevronDown'))
  return h(
    'button',
    {
      ...controlAttrs(control),
      'aria-controls': '',
      'aria-disabled': disabled ? 'true' : 'false',
      'aria-expanded': 'false',
      'aria-haspopup': 'listbox',
      class: ui.base({ class: [overrides.base, props.class, 'w-full'] }),
      'data-slot': 'base',
      'data-state': 'closed',
      dir: 'ltr',
      disabled: disabled || undefined,
      onClick: control.onClick,
      tabindex: 0,
      type: 'button',
    },
    [
      label === undefined
        ? h(
            'span',
            { class: ui.placeholder({ class: overrides.placeholder }), 'data-slot': 'placeholder' },
            placeholder(control) || ' ',
          )
        : h('span', { class: ui.value({ class: overrides.value }), 'data-slot': 'value' }, label),
      h('span', { class: ui.trailing({ class: overrides.trailing }), 'data-slot': 'trailing' }, [
        env.icons.render(trailingIcon, {
          class: ui.trailingIcon({ class: overrides.trailingIcon }),
          slot: 'trailingIcon',
        }),
      ]),
    ],
  )
}

function renderNumber(control: InertControl) {
  const { env, fieldProps } = control
  const props = controlProps(control, ['prefix', 'suffix', 'format', 'controls', 'mono'])
  const prefix = resolveFormBoundaryText(fieldProps.prefix)
  const suffix = resolveFormBoundaryText(fieldProps.suffix)
  const controls = fieldProps.controls !== false
  const hasAffix = Boolean(prefix) || Boolean(suffix)
  const inlineAffix = hasAffix && !controls
  const overrides = slotOverrides(props.ui)
  const base = mergeFormUiClass(
    mergeFormUiClass(overrides.base, fieldProps.mono ? 'font-mono tabular-nums' : undefined),
    mergeFormUiClass(
      inlineAffix && prefix ? 'ps-(--nut-form-prefix-width)' : undefined,
      inlineAffix && suffix ? 'pe-(--nut-form-suffix-width)' : undefined,
    ),
  )
  const orientation = stringProp(props.orientation) ?? 'horizontal'
  const ui = env.theme.slots('inputNumber', {
    ...stateVariants(control, props),
    decrement: orientation === 'vertical' ? false : controls,
    fieldGroup: undefined,
    fixed: props.fixed === true || undefined,
    increment: controls,
    orientation,
    size: props.size,
    variant: stringProp(props.variant),
  })
  const value = isNumber(control.value) ? control.value : undefined
  const formatter = numberFormatter(
    env.locale(),
    isRecord(fieldProps.format) ? fieldProps.format : undefined,
  )
  const affixClass = (side: 'start' | 'end') =>
    inlineAffix
      ? `pointer-events-none absolute inset-y-0 ${side}-3 z-[1] flex items-center text-sm text-muted`
      : 'shrink-0 text-sm text-muted'
  return h(
    'div',
    {
      class: mergeFormUiClass(
        'relative flex w-full items-center',
        hasAffix && !inlineAffix ? 'gap-2' : undefined,
      ),
      style: {
        '--nut-form-prefix-width': `${Math.max(2.25, (prefix?.length ?? 0) * 0.6 + 1.5)}rem`,
        '--nut-form-suffix-width': `${Math.max(2.25, (suffix?.length ?? 0) * 0.6 + 1.5)}rem`,
      },
    },
    [
      prefix ? h('span', { class: affixClass('start'), 'data-form-prefix': '' }, prefix) : null,
      h(
        'div',
        {
          class: ui.root({ class: [overrides.root, props.class, 'min-w-0 flex-1'] }),
          'data-slot': 'root',
          role: 'group',
        },
        [
          h('input', {
            ...controlAttrs(control),
            'aria-roledescription': 'Number field',
            'aria-valuemax': numberProp(fieldProps.max),
            'aria-valuemin': numberProp(fieldProps.min),
            'aria-valuenow': value,
            autocomplete: 'off',
            autocorrect: 'off',
            class: ui.base({ class: base }),
            'data-slot': 'base',
            disabled: control.disabled || undefined,
            inputmode:
              (formatter.resolvedOptions().maximumFractionDigits ?? 0) > 0 ? 'decimal' : 'numeric',
            placeholder: placeholder(control),
            role: 'spinbutton',
            spellcheck: 'false',
            tabindex: 0,
            type: 'text',
            value: value === undefined ? '' : formatter.format(value),
          }),
          controls
            ? h(
                'div',
                { class: ui.increment({ class: overrides.increment }), 'data-slot': 'increment' },
                [
                  renderButton(env, {
                    ariaLabel: env.text('increment'),
                    color: control.invalid ? 'error' : stringProp(props.color),
                    disabled: control.disabled,
                    icon: orientation === 'horizontal' ? env.icon('plus') : env.icon('chevronDown'),
                    size: props.size,
                    tabindex: -1,
                    variant: 'link',
                  }),
                ],
              )
            : null,
          controls && orientation !== 'vertical'
            ? h(
                'div',
                { class: ui.decrement({ class: overrides.decrement }), 'data-slot': 'decrement' },
                [
                  renderButton(env, {
                    ariaLabel: env.text('decrement'),
                    color: control.invalid ? 'error' : stringProp(props.color),
                    disabled: control.disabled,
                    icon: env.icon('minus'),
                    size: props.size,
                    tabindex: -1,
                    variant: 'link',
                  }),
                ],
              )
            : null,
        ],
      ),
      suffix ? h('span', { class: affixClass('end'), 'data-form-suffix': '' }, suffix) : null,
    ],
  )
}

function renderText(control: InertControl) {
  const { env, fieldProps } = control
  if (fieldProps.icon || fieldProps.trailingIcon || fieldProps.mask !== undefined) {
    return
  }
  const value = isString(control.value) ? control.value : undefined
  if (fieldProps.clearable === true && !control.disabled && Boolean(value)) {
    return
  }
  const props = controlProps(control, [
    'inputType',
    'prefix',
    'suffix',
    'mono',
    'clearable',
    'mask',
    'maskOutput',
  ])
  const prefix = resolveFormBoundaryText(fieldProps.prefix)
  const suffix = resolveFormBoundaryText(fieldProps.suffix)
  const type = stringProp(fieldProps.inputType) ?? 'text'
  const overrides = slotOverrides(props.ui)
  const ui = env.theme.slots('input', {
    ...stateVariants(control, props),
    fieldGroup: undefined,
    fixed: props.fixed === true || undefined,
    leading: Boolean(prefix),
    loading: undefined,
    size: props.size,
    trailing: Boolean(suffix),
    type,
    variant: stringProp(props.variant),
  })
  return h(
    'div',
    {
      class: ui.root({
        class: [
          overrides.root,
          mergeFormUiClass(
            mergeFormUiClass('w-full', fieldProps.mono ? 'font-mono tabular-nums' : undefined),
            props.class,
          ),
        ],
      }),
      'data-slot': 'root',
    },
    [
      h('input', {
        ...controlAttrs(control),
        class: ui.base({ class: overrides.base }),
        'data-slot': 'base',
        disabled: control.disabled || undefined,
        maxlength: numberProp(fieldProps.maxlength),
        placeholder: placeholder(control),
        type,
        value: value ?? '',
      }),
      prefix
        ? h('span', { class: ui.leading({ class: overrides.leading }), 'data-slot': 'leading' }, [
            h('span', { class: 'text-sm text-muted', 'data-form-prefix': '' }, prefix),
          ])
        : null,
      suffix
        ? h(
            'span',
            { class: ui.trailing({ class: overrides.trailing }), 'data-slot': 'trailing' },
            [h('span', { class: 'text-sm text-muted', 'data-form-suffix': '' }, suffix)],
          )
        : null,
    ],
  )
}

function renderSwitch(control: InertControl) {
  const { env, fieldProps } = control
  if (fieldProps.checkedIcon || fieldProps.uncheckedIcon) {
    return
  }
  const loading = validationPending(control) || fieldProps.loading === true
  if (loading) {
    return
  }
  const props = controlProps(control, ['trueValue', 'falseValue'])
  const checked = control.value === (fieldProps.trueValue ?? true)
  const state = checked ? 'checked' : 'unchecked'
  const overrides = slotOverrides(props.ui)
  const ui = env.theme.slots('switch', {
    ...stateVariants(control, props),
    disabled: control.disabled,
    loading: false,
    required: isRequired(control),
    size: props.size,
  })
  return h(
    'div',
    { class: ui.root({ class: [overrides.root, props.class] }), 'data-slot': 'root' },
    [
      h('div', { class: ui.container({ class: overrides.container }), 'data-slot': 'container' }, [
        h(
          'button',
          {
            ...controlAttrs(control),
            'aria-checked': checked ? 'true' : 'false',
            'aria-required': isRequired(control) ? 'true' : 'false',
            class: ui.base({ class: overrides.base }),
            'data-slot': 'base',
            'data-state': state,
            disabled: control.disabled || undefined,
            onClick: control.onClick,
            role: 'switch',
            type: 'button',
            value: 'on',
          },
          [
            h('span', {
              class: ui.thumb({ class: overrides.thumb }),
              'data-slot': 'thumb',
              'data-state': state,
            }),
          ],
        ),
      ]),
    ],
  )
}

function renderCheckbox(control: InertControl) {
  const { env } = control
  const props = controlProps(control)
  const checked = control.value === true
  const state = checked ? 'checked' : 'unchecked'
  const overrides = slotOverrides(props.ui)
  const indicator = stringProp(props.indicator)
  const ui = env.theme.slots('checkbox', {
    ...stateVariants(control, props),
    disabled: control.disabled,
    indicator,
    required: isRequired(control),
    size: props.size,
    variant: stringProp(props.variant),
  })
  return h(
    'div',
    { class: ui.root({ class: [overrides.root, props.class, 'w-full'] }), 'data-slot': 'root' },
    [
      h('div', { class: ui.container({ class: overrides.container }), 'data-slot': 'container' }, [
        h(
          'button',
          {
            ...controlAttrs(control),
            'aria-checked': checked ? 'true' : 'false',
            'aria-required': isRequired(control) ? 'true' : 'false',
            class: ui.base({ class: overrides.base }),
            'data-slot': 'base',
            'data-state': state,
            disabled: control.disabled || undefined,
            onClick: control.onClick,
            role: 'checkbox',
            type: 'button',
            value: 'on',
          },
          checked && indicator !== 'hidden'
            ? [
                h(
                  'span',
                  {
                    class: ui.indicator({ class: overrides.indicator }),
                    'data-slot': 'indicator',
                    'data-state': state,
                  },
                  [
                    env.icons.render(stringProp(props.icon) ?? env.icon('check'), {
                      class: ui.icon({ class: overrides.icon }),
                      slot: 'icon',
                    }),
                  ],
                ),
              ]
            : [],
        ),
      ]),
    ],
  )
}

/** Renders a Nuxt UI button with an icon and no label, as `UButton` does for icon-only buttons. */
export function renderButton(
  env: InertEnvironment,
  button: {
    icon: string
    ariaLabel?: string
    color?: string
    variant?: string
    size?: string
    class?: InertClass
    disabled?: boolean
    label?: string
    tabindex?: number
    onClick?: (event: MouseEvent) => void
  },
) {
  const hasLabel = button.label !== undefined
  const ui = env.theme.slots('button', {
    block: undefined,
    color: button.color,
    fieldGroup: undefined,
    leading: true,
    loading: false,
    size: button.size,
    square: !hasLabel,
    trailing: false,
    variant: button.variant,
  })
  return h(
    'button',
    {
      'aria-label': button.ariaLabel,
      class: ui.base({ active: false, class: button.class }),
      'data-slot': 'base',
      disabled: button.disabled || undefined,
      onClick: button.onClick,
      tabindex: button.tabindex,
      type: 'button',
    },
    [
      env.icons.render(button.icon, {
        class: ui.leadingIcon({ active: false }),
        slot: 'leadingIcon',
      }),
      hasLabel
        ? h('span', { class: ui.label({ active: false }), 'data-slot': 'label' }, button.label)
        : null,
    ],
  )
}

function controlProps(control: InertControl, omit?: readonly string[]): FormControlProps {
  return resolveControlProps({
    attrs: controlAttrs(control),
    field: control.field,
    fieldProps: control.fieldProps,
    omit,
    size: control.env.formUi.controlSize.value,
    ui: control.env.formUi.ui.value,
  })
}

function controlAttrs(control: InertControl) {
  return {
    'aria-invalid': control.invalid ? 'true' : 'false',
    'aria-label': control.label,
    'data-form-field': control.pathKey,
  }
}

/** Color and highlight as Nuxt UI derives them from the surrounding form field and the props. */
function stateVariants(control: InertControl, props: FormControlProps): InertVariants {
  return {
    color: control.invalid ? 'error' : stringProp(props.color),
    highlight: control.invalid ? true : props.highlight === true || undefined,
  }
}

function slotOverrides(
  ui: FormControlUi | undefined,
): Readonly<Record<string, string | undefined>> {
  return ui ?? {}
}

function placeholder(control: InertControl) {
  return resolveControlPlaceholder({
    fallback: control.env.text('placeholder'),
    field: control.field,
    params: control.params,
  })
}

function validationPending(control: InertControl) {
  return control.env.form.getFieldApi(control.path, control.field).validation.pending()
}

function isRequired(control: InertControl) {
  if (!createFormFieldInstance(control.field).capability.has('validation')) {
    return false
  }
  return resolveRequired(control.field, control.params) === true
}

function controlLabel(field: FormField) {
  return 'label' in field ? (resolveFormText(field.label) ?? field.key) : field.key
}

function selectedValues(value: FormValue, multiple: boolean): readonly FormOptionValue[] {
  if (multiple) {
    return Array.isArray(value) ? value.filter(isOptionValue) : []
  }
  return isOptionValue(value) && value !== '' ? [value] : []
}

function displayLabel(
  items: readonly ResolvedFormOption[],
  selected: readonly FormOptionValue[],
  multiple: boolean,
) {
  if (!selected.length) {
    return
  }
  const byKey = new Map(items.map((item) => [formOptionKey(item.value), item]))
  const labels = selected.map((value) => {
    const item = byKey.get(formOptionKey(value))
    return item ? resolveFormText(item.label) : String(value)
  })
  const text = labels.filter((label) => label !== undefined && label !== '').join(', ')
  return multiple && !text ? undefined : text
}

const numberFormatters = new Map<string, Intl.NumberFormat>()

/** Formats numbers as the live control shows them, one formatter per locale and options. */
function numberFormatter(locale: string, options: FormObject | undefined) {
  const key = `${locale}|${JSON.stringify(options ?? {})}`
  let formatter = numberFormatters.get(key)
  if (!formatter) {
    // SAFETY: `format` is the field's authored Intl.NumberFormat options, which the live control
    // passes to its formatter the same way.
    formatter = new Intl.NumberFormat(locale, options as Intl.NumberFormatOptions | undefined)
    numberFormatters.set(key, formatter)
  }
  return formatter
}

function stringProp(value: FormValue) {
  return isString(value) ? value : undefined
}

function numberProp(value: FormValue) {
  return isNumber(value) ? value : undefined
}
