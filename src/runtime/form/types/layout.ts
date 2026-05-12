/**
 * Layout options available at form or step level.
 */
export interface FormLayoutConfig {
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
