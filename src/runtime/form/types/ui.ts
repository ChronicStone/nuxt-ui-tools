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
  eyebrow?: FormUiClass
  title?: FormUiClass
  description?: FormUiClass
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
  pending?: FormUiClass
  collapsible?: FormUiClass
  collapseTrigger?: FormUiClass
  reset?: FormUiClass
}

export interface FormSectionUi {
  root?: FormUiClass
  label?: FormUiClass
  description?: FormUiClass
}

export interface FormTabsUi {
  root?: FormUiClass
  list?: FormUiClass
  trigger?: FormUiClass
  content?: FormUiClass
  fields?: FormUiClass
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

export interface FormArrayCollapseUi {
  root?: FormUiClass
  header?: FormUiClass
  title?: FormUiClass
  description?: FormUiClass
  empty?: FormUiClass
  list?: FormUiClass
  item?: FormUiClass
  itemHeader?: FormUiClass
  trigger?: FormUiClass
  arrow?: FormUiClass
  itemTitle?: FormUiClass
  summary?: FormUiClass
  itemActions?: FormUiClass
  body?: FormUiClass
  fields?: FormUiClass
  add?: FormUiClass
  action?: FormUiClass
}

export interface FormArrayPrimitiveUi {
  root?: FormUiClass
  empty?: FormUiClass
  list?: FormUiClass
  item?: FormUiClass
  preview?: FormUiClass
  control?: FormUiClass
  action?: FormUiClass
  add?: FormUiClass
}

export interface FormArrayTableUi {
  root?: FormUiClass
  header?: FormUiClass
  title?: FormUiClass
  description?: FormUiClass
  frame?: FormUiClass
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
  error?: FormUiClass
  empty?: FormUiClass
  addCell?: FormUiClass
  add?: FormUiClass
  action?: FormUiClass
}

export interface FormOverlayUi {
  overlay?: FormUiClass
  content?: FormUiClass
}

/**
 * Slots of a form page and its parts. Data attributes carry the live state, so a slot can
 * restyle one state: `data-active` on the current navigation entry, `data-state`
 * (`complete`, `invalid`, `pending`) on entries and indicators, `data-dirty` on modified
 * sections and entries.
 *
 * Two CSS variables place sections under the pinned header: `--nut-form-page-header` (its
 * measured height, set by the page) and `--nut-form-page-gap` (the room below it, `24px` by
 * default). Set them on an element around the navigation and sections, such as the root.
 */
export interface FormPageUi {
  /** The `<form>` element, which scrolls on its own and is the container of the page queries. */
  root?: FormUiClass
  /** Grid holding the navigation and the sections. */
  body?: FormUiClass
  header?: FormUiClass
  headerContent?: FormUiClass
  heading?: FormUiClass
  eyebrow?: FormUiClass
  title?: FormUiClass
  /** Line under the title: the description and the unsaved-changes badge. */
  meta?: FormUiClass
  unsaved?: FormUiClass
  actions?: FormUiClass
  navigation?: FormUiClass
  /** Holds the navigation title and the entries. */
  navigationGroup?: FormUiClass
  navigationTitle?: FormUiClass
  navigationList?: FormUiClass
  /** List item around each entry. */
  navigationEntry?: FormUiClass
  navigationItem?: FormUiClass
  navigationIndicator?: FormUiClass
  /** Check of a complete section in the indicator. */
  navigationIndicatorIcon?: FormUiClass
  /** Dot in the indicator of the current section while it is pending. */
  navigationIndicatorMarker?: FormUiClass
  navigationLabel?: FormUiClass
  navigationOptional?: FormUiClass
  navigationDirty?: FormUiClass
  /** Wrapper under the entries, whose padding insets the summary. */
  navigationFooter?: FormUiClass
  /** The summary, with its top border: "3 sections left to complete". */
  navigationSummary?: FormUiClass
  /** The bold "3 sections" of the summary. */
  navigationSummaryCount?: FormUiClass
  sections?: FormUiClass
  /** Placeholder card shown while the schema context loads. */
  sectionSkeleton?: FormUiClass
  section?: FormUiClass
  sectionHeader?: FormUiClass
  sectionTitle?: FormUiClass
  sectionDescription?: FormUiClass
  sectionOptional?: FormUiClass
  sectionActions?: FormUiClass
  sectionReset?: FormUiClass
  sectionBody?: FormUiClass
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
  section?: FormUiPartConfig<FormSectionUi>
  tabs?: FormUiPartConfig<FormTabsUi>
  group?: FormUiPartConfig<FormGroupUi>
  tree?: FormUiPartConfig<FormTreeUi>
  treeSelect?: FormUiPartConfig<FormTreeSelectUi>
  matrix?: FormUiPartConfig<FormMatrixUi>
  arrayList?: FormUiPartConfig<FormArrayListUi>
  arrayTable?: FormUiPartConfig<FormArrayTableUi>
  arrayCollapse?: FormUiPartConfig<FormArrayCollapseUi>
  arrayPrimitive?: FormUiPartConfig<FormArrayPrimitiveUi>
  modal?: FormUiPartConfig<FormOverlayUi>
  drawer?: FormUiPartConfig<FormOverlayUi>
  fullscreen?: FormUiPartConfig<FormOverlayUi>
  /** Form page rendered by `FormPage` and its parts. */
  page?: FormUiPartConfig<FormPageUi>
}
