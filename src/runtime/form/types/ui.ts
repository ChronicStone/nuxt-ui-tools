import type { FormFieldType } from './field-base'

export type FormDensity = 'compact' | 'default' | 'comfortable'
export type FormControlSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type FormUiClass = string

export interface FormControlUi {
  [slot: string]: FormUiClass | undefined
}

export interface FormFieldControlConfig {
  size?: FormControlSize
  class?: FormUiClass
  ui?: FormControlUi
}

export type FormFieldControlConfigs = Partial<Record<FormFieldType, FormFieldControlConfig>> & {
  [type: string]: FormFieldControlConfig | undefined
}

export interface FormRootUi {
  root?: FormUiClass
  header?: FormUiClass
  headerContent?: FormUiClass
  heading?: FormUiClass
  title?: FormUiClass
  stepper?: FormUiClass
  step?: FormUiClass
  viewport?: FormUiClass
  grid?: FormUiClass
  skeleton?: FormUiClass
  skeletonField?: FormUiClass
  skeletonLabel?: FormUiClass
  skeletonControl?: FormUiClass
  footer?: FormUiClass
  close?: FormUiClass
}

/** Slots forwarded to UFormField plus form-engine-owned body controls. */
export interface FormFieldUi {
  root?: FormUiClass
  wrapper?: FormUiClass
  labelWrapper?: FormUiClass
  label?: FormUiClass
  container?: FormUiClass
  description?: FormUiClass
  error?: FormUiClass
  hint?: FormUiClass
  labelExtra?: FormUiClass
  help?: FormUiClass
  body?: FormUiClass
  content?: FormUiClass
  collapsible?: FormUiClass
  collapseTrigger?: FormUiClass
  reset?: FormUiClass
}

export interface FormActionsUi {
  root?: FormUiClass
  left?: FormUiClass
  right?: FormUiClass
  button?: FormUiClass
}

/** Slots for a group and its underlying UFieldGroup. */
export interface FormGroupUi {
  root?: FormUiClass
  base?: FormUiClass
}

export interface FormTreeSelectUi {
  root?: FormUiClass
  trigger?: FormUiClass
  triggerLabel?: FormUiClass
  content?: FormUiClass
  search?: FormUiClass
  tree?: FormUiClass
  empty?: FormUiClass
}

/** Slots for the inline tree and its underlying Nuxt UI tree. */
export interface FormTreeUi {
  root?: FormUiClass
  item?: FormUiClass
  itemWithChildren?: FormUiClass
  listWithChildren?: FormUiClass
  link?: FormUiClass
  linkLeadingIcon?: FormUiClass
  linkLabel?: FormUiClass
  linkTrailing?: FormUiClass
  linkTrailingIcon?: FormUiClass
  selectionControl?: FormUiClass
}

export interface FormMatrixUi {
  root?: FormUiClass
  table?: FormUiClass
  head?: FormUiClass
  headerRow?: FormUiClass
  corner?: FormUiClass
  columnHeader?: FormUiClass
  body?: FormUiClass
  row?: FormUiClass
  rowHeader?: FormUiClass
  cell?: FormUiClass
  control?: FormUiClass
}

export interface FormArrayListUi {
  root?: FormUiClass
  header?: FormUiClass
  title?: FormUiClass
  description?: FormUiClass
  empty?: FormUiClass
  tabs?: FormUiClass
  tab?: FormUiClass
  item?: FormUiClass
  itemHeader?: FormUiClass
  itemTitle?: FormUiClass
  itemActions?: FormUiClass
  variant?: FormUiClass
  fields?: FormUiClass
  list?: FormUiClass
  add?: FormUiClass
  action?: FormUiClass
}

export interface FormArrayTableUi {
  root?: FormUiClass
  viewport?: FormUiClass
  table?: FormUiClass
  head?: FormUiClass
  headerRow?: FormUiClass
  headerCell?: FormUiClass
  actionsHeader?: FormUiClass
  body?: FormUiClass
  row?: FormUiClass
  cell?: FormUiClass
  control?: FormUiClass
  actionsCell?: FormUiClass
  empty?: FormUiClass
  add?: FormUiClass
  action?: FormUiClass
}

export interface FormOverlayUi {
  overlay?: FormUiClass
  content?: FormUiClass
}

export interface FormUiPartConfig<TUi> {
  ui?: TUi
}

/**
 * Form-engine presentation defaults.
 *
 * Values from `app.config.nuxtUiTools.form` are merged first, then schema `ui`, then the
 * rendered form's `ui` prop. Individual field `props` remain the final override for the
 * underlying Nuxt UI control.
 */
export interface FormUiConfig {
  /** Maps the whole form to a consistent control size. */
  density?: FormDensity
  /** Explicit control-size override. */
  control?: { size?: FormControlSize; ui?: FormControlUi }
  /** Defaults for every control of a field kind, applied after shared control defaults. */
  fields?: FormFieldControlConfigs
  root?: FormUiPartConfig<FormRootUi>
  field?: FormUiPartConfig<FormFieldUi>
  actions?: FormUiPartConfig<FormActionsUi>
  group?: FormUiPartConfig<FormGroupUi>
  tree?: FormUiPartConfig<FormTreeUi>
  treeSelect?: FormUiPartConfig<FormTreeSelectUi>
  matrix?: FormUiPartConfig<FormMatrixUi>
  arrayList?: FormUiPartConfig<FormArrayListUi>
  arrayTable?: FormUiPartConfig<FormArrayTableUi>
  modal?: FormUiPartConfig<FormOverlayUi>
  drawer?: FormUiPartConfig<FormOverlayUi>
  fullscreen?: FormUiPartConfig<FormOverlayUi>
}
