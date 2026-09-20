/**
 * Layout options available at form or step level.
 */
export type FormLabelPosition = 'top' | 'left'

export interface FormLayoutConfig {
  /** Label placement for every field of the form. */
  labelPosition?: FormLabelPosition
  /** Label column width when labels sit on the left. */
  labelWidth?: number | string
  /** Number of columns used by the current field grid. */
  columns?: number | string
  /** Default column span used by fields that do not define `layout.span`. */
  fieldSpan?: number | string
  /** Gap between fields in the owning grid. */
  gap?: number | string
}

/**
 * Layout options available to normal form items.
 */
export interface FormItemLayout {
  /** Column span for this field inside the owning layout grid. Replaces legacy `size`. */
  span?: number | string
  /** Fixed width used by renderers that lay fields out as columns, such as array tables. */
  width?: number | string
  /** Label placement for this field. */
  labelPosition?: FormLabelPosition
  /** Label column width when the label sits on the left. */
  labelWidth?: number | string
}

/**
 * Layout options available to fields that render child fields.
 */
export interface FormContainerLayout extends FormItemLayout {
  /** Column definition for child fields. Replaces legacy `gridSize`. */
  columns?: number | string
  /** Visual variant used by structural field renderers. */
  variant?: 'plain' | 'card' | 'section' | 'fieldset'
}

/**
 * Rendering shell used by `<NutForm>` when the same form root is placed inline or inside
 * overlay layouts.
 */
export type FormRenderShell = 'inline' | 'drawer' | 'modal' | 'fullscreen'
