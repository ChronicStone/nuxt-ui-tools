import type { BadgeProps } from '@nuxt/ui/components/Badge.vue'
import type { ButtonProps } from '@nuxt/ui/components/Button.vue'
import type { CheckboxProps } from '@nuxt/ui/components/Checkbox.vue'
import type { InputProps } from '@nuxt/ui/components/Input.vue'
import type { PaginationProps } from '@nuxt/ui/components/Pagination.vue'
import type { SelectProps } from '@nuxt/ui/components/Select.vue'

import type { TableLayout } from './utils'

export type DataListDensity = 'compact' | 'default' | 'comfortable'
export type DataListControlSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
/** Controls whether a granular content part owns its table boundary. */
export type DataListContentSurface = 'plain' | 'contained'
/** Selects the width contract for table popover content. */
export type DataListPopoverSizing = 'fit' | 'trigger' | 'independent'
export type DataListContentFit = 'content' | 'height' | 'fill'
export type DataListFilterPanelMode = 'drawer' | 'panel'
export type DataListFilterPanelCommitMode = 'live' | 'submit'

/** A Tailwind class override for a named DataList UI slot. */
export type DataListUiClass = string

/** UI slots rendered by the built-in DataList recipe. */
export interface DataListDefaultUi {
  root?: DataListUiClass
  header?: DataListUiClass
  heading?: DataListUiClass
  title?: DataListUiClass
  description?: DataListUiClass
  toolbar?: DataListUiClass
  primaryActions?: DataListUiClass
  secondaryActions?: DataListUiClass
}

/** UI slots forwarded to the underlying Nuxt UI input. */
export interface DataListSearchUi {
  [slot: string]: DataListUiClass | undefined
  root?: DataListUiClass
  base?: DataListUiClass
  leading?: DataListUiClass
  leadingIcon?: DataListUiClass
  leadingAvatar?: DataListUiClass
  leadingAvatarSize?: DataListUiClass
  trailing?: DataListUiClass
  trailingIcon?: DataListUiClass
}

/** Shared UI slots rendered by a progressive filter editor popover. */
export interface DataListFilterEditorUi {
  popoverContent?: DataListUiClass
  editorHeader?: DataListUiClass
  operatorContent?: DataListUiClass
  operatorItem?: DataListUiClass
  operatorLabel?: DataListUiClass
  operatorTrigger?: DataListUiClass
  editor?: DataListUiClass
  searchHeader?: DataListUiClass
  search?: DataListUiClass
  searchInput?: DataListUiClass
  scrollArea?: DataListUiClass
  scrollViewport?: DataListUiClass
  list?: DataListUiClass
  listDivider?: DataListUiClass
  option?: DataListUiClass
  optionCheckbox?: DataListUiClass
  optionExpander?: DataListUiClass
  optionSpacer?: DataListUiClass
  optionIcon?: DataListUiClass
  optionLabel?: DataListUiClass
  optionCount?: DataListUiClass
  empty?: DataListUiClass
  footer?: DataListUiClass
  clear?: DataListUiClass
  apply?: DataListUiClass
  inputs?: DataListUiClass
  presets?: DataListUiClass
  preset?: DataListUiClass
  calendar?: DataListUiClass
  slider?: DataListUiClass
}

/** UI slots rendered by filter tags, their editors, and adjacent actions. */
export interface DataListFilterTagsUi extends DataListFilterEditorUi {
  root?: DataListUiClass
  trigger?: DataListUiClass
  activeTrigger?: DataListUiClass
  activeRoot?: DataListUiClass
  sheetTrigger?: DataListUiClass
  sheetContent?: DataListUiClass
  label?: DataListUiClass
  value?: DataListUiClass
  dismiss?: DataListUiClass
  addTrigger?: DataListUiClass
  clearTrigger?: DataListUiClass
}

/** UI slots rendered by the progressive add-filter picker. */
export interface DataListAddFilterUi extends DataListFilterEditorUi {
  trigger?: DataListUiClass
  title?: DataListUiClass
  panel?: DataListUiClass
  optionTrailingIcon?: DataListUiClass
}

/** UI slots rendered by the filter slideover. */
export interface DataListFilterPanelUi {
  trigger?: DataListUiClass
  triggerContent?: DataListUiClass
  count?: DataListUiClass
  overlay?: DataListUiClass
  content?: DataListUiClass
  header?: DataListUiClass
  wrapper?: DataListUiClass
  body?: DataListUiClass
  footer?: DataListUiClass
  title?: DataListUiClass
  results?: DataListUiClass
  description?: DataListUiClass
  close?: DataListUiClass
  fields?: DataListUiClass
  section?: DataListUiClass
  sectionTitle?: DataListUiClass
  field?: DataListUiClass
  fieldLabel?: DataListUiClass
  fieldMeta?: DataListUiClass
  chips?: DataListUiClass
  chip?: DataListUiClass
  chipActive?: DataListUiClass
  matching?: DataListUiClass
  footerActions?: DataListUiClass
  clear?: DataListUiClass
  apply?: DataListUiClass
}

/** Component props exposed by the filter slideover. */
export interface DataListFilterPanelProps {
  trigger?: DataListButtonProps
  /** Active-filter badge inside the trigger; `false` hides it. */
  count?: DataListBadgeProps | false
  close?: DataListButtonProps
  clear?: DataListButtonProps
  apply?: DataListButtonProps
  /** Renders option filters as inline chips up to this many options; `false` always uses the picker. Defaults to 8. */
  chips?: number | false
}

export interface DataListFilterPanelConfig
  extends DataListPartConfig<DataListFilterPanelUi, DataListFilterPanelProps> {
  /** Renders the filter fields inline instead of inside a slideover. */
  mode?: DataListFilterPanelMode
  /** Applies each field change immediately or waits for the Apply command. */
  commitMode?: DataListFilterPanelCommitMode
}

/** UI slots rendered by the clear-filters control. */
export interface DataListClearFiltersUi {
  [slot: string]: DataListUiClass | undefined
  base?: DataListUiClass
  label?: DataListUiClass
  leadingIcon?: DataListUiClass
  trailingIcon?: DataListUiClass
}

/** UI slots rendered by the result count. */
export interface DataListResultCountUi {
  root?: DataListUiClass
}

/** UI slots rendered by the refresh control. */
export interface DataListRefreshUi {
  [slot: string]: DataListUiClass | undefined
  base?: DataListUiClass
  label?: DataListUiClass
  leadingIcon?: DataListUiClass
  trailingIcon?: DataListUiClass
}

/** UI slots rendered by the column picker. */
export interface DataListColumnPanelUi {
  trigger?: DataListUiClass
  count?: DataListUiClass
  title?: DataListUiClass
  close?: DataListUiClass
  popoverContent?: DataListUiClass
  panel?: DataListUiClass
  searchHeader?: DataListUiClass
  search?: DataListUiClass
  list?: DataListUiClass
  section?: DataListUiClass
  row?: DataListUiClass
  handle?: DataListUiClass
  icon?: DataListUiClass
  label?: DataListUiClass
  stateIcon?: DataListUiClass
  empty?: DataListUiClass
  footer?: DataListUiClass
  footerSummary?: DataListUiClass
  reset?: DataListUiClass
}

/** UI slots rendered by the sort dropdown. */
export interface DataListSortMenuUi {
  trigger?: DataListUiClass
  triggerLabel?: DataListUiClass
  triggerLeadingIcon?: DataListUiClass
  triggerTrailingIcon?: DataListUiClass
  content?: DataListUiClass
  group?: DataListUiClass
  item?: DataListUiClass
  itemLeadingIcon?: DataListUiClass
  itemLabel?: DataListUiClass
  itemTrailingIcon?: DataListUiClass
}

/** UI slots rendered by the table/grid switcher. */
export interface DataListLayoutSwitchUi {
  root?: DataListUiClass
  trigger?: DataListUiClass
  triggerLabel?: DataListUiClass
  triggerLeadingIcon?: DataListUiClass
  triggerTrailingIcon?: DataListUiClass
}

/** UI slots rendered by the content state boundary. */
export interface DataListContentUi {
  root?: DataListUiClass
  error?: DataListUiClass
  errorBody?: DataListUiClass
  errorIcon?: DataListUiClass
  errorCopy?: DataListUiClass
  errorTitle?: DataListUiClass
  errorDescription?: DataListUiClass
  retry?: DataListUiClass
}

/** Render the content boundary here or leave it to the surrounding composition. */
export interface DataListContentOptions {
  /** Use `contained` for an assembled boundary, or `plain` for consumer-owned composition. */
  surface?: DataListContentSurface
}

/** UI slots rendered by the table mode. Nuxt UI table slots are forwarded unchanged. */
export interface DataListTableUi {
  wrapper?: DataListUiClass
  root?: DataListUiClass
  base?: DataListUiClass
  caption?: DataListUiClass
  thead?: DataListUiClass
  tbody?: DataListUiClass
  tfoot?: DataListUiClass
  tr?: DataListUiClass
  th?: DataListUiClass
  td?: DataListUiClass
  separator?: DataListUiClass
  empty?: DataListUiClass
  loading?: DataListUiClass
  loadingOverlay?: DataListUiClass
  emptyOverlay?: DataListUiClass
}

/** UI slots rendered by the grid mode and its built-in states. */
export interface DataListGridUi {
  root?: DataListUiClass
  viewport?: DataListUiClass
  canvas?: DataListUiClass
  row?: DataListUiClass
  item?: DataListUiClass
  flowRoot?: DataListUiClass
  flow?: DataListUiClass
  loading?: DataListUiClass
  error?: DataListUiClass
  errorCard?: DataListUiClass
  errorIcon?: DataListUiClass
  errorCopy?: DataListUiClass
  errorTitle?: DataListUiClass
  errorDescription?: DataListUiClass
  retry?: DataListUiClass
  empty?: DataListUiClass
  emptyCard?: DataListUiClass
  emptyIcon?: DataListUiClass
  emptyCopy?: DataListUiClass
  emptyTitle?: DataListUiClass
  emptyDescription?: DataListUiClass
  refreshing?: DataListUiClass
  refreshingLine?: DataListUiClass
  refreshingVeil?: DataListUiClass
}

/** UI slots rendered by offset pagination. */
export interface DataListPaginationUi {
  root?: DataListUiClass
  inner?: DataListUiClass
  summary?: DataListUiClass
  controls?: DataListUiClass
  pageSize?: DataListUiClass
  pages?: DataListUiClass
  button?: DataListUiClass
}

/** UI slots rendered by cursor pagination's automatic or manual loader. */
export interface DataListInfiniteLoaderUi {
  root?: DataListUiClass
  loading?: DataListUiClass
  retry?: DataListUiClass
  loadMore?: DataListUiClass
  end?: DataListUiClass
}

/** Nuxt UI props forwarded to one control rendered by a DataList part. */
export type DataListControlProps<TProps> = Partial<Omit<TProps, 'ui'>>
export type DataListButtonProps = DataListControlProps<ButtonProps>
export type DataListBadgeProps = DataListControlProps<BadgeProps>
export type DataListInputProps = DataListControlProps<InputProps>
export type DataListCheckboxProps = DataListControlProps<CheckboxProps>
export type DataListPaginationControlProps = DataListControlProps<PaginationProps>
export type DataListSelectControlProps = DataListControlProps<SelectProps>

/** Component props exposed by the search input. */
export interface DataListSearchProps {
  input?: DataListInputProps
}

/** Component props exposed by filter tags and their adjacent actions. */
export interface DataListFilterTagsProps {
  /** Renders the filter kind icon before the label; defaults to true. */
  icon?: boolean
  /** Dormant tag: the filter is configured but has no value yet. */
  trigger?: DataListButtonProps
  /** Active tag segments once the filter holds a value. */
  activeTrigger?: DataListButtonProps
  operatorTrigger?: DataListButtonProps
  value?: DataListButtonProps
  dismiss?: DataListButtonProps
  previewBadge?: DataListBadgeProps
  /** Checkboxes inside option editors. */
  optionCheckbox?: DataListCheckboxProps
  /** Renders a label + clear header above option editors; defaults to true. */
  editorHeader?: boolean
  addTrigger?: DataListButtonProps
  clearTrigger?: DataListButtonProps
  /** Mobile bottom-sheet trigger. */
  sheetTrigger?: DataListButtonProps
}

/** Component props exposed by the add-filter picker. */
export interface DataListAddFilterProps {
  trigger?: DataListButtonProps
  /** Shows the filter search box; a number enables it above that many filters. Defaults to 8. */
  search?: boolean | number
  /** Shows the picker title; defaults to true. */
  title?: boolean
  /** Row icon: a plus sign (default) or the filter kind icon. */
  icon?: 'plus' | 'kind'
}

/** Component props exposed by the column picker trigger. */
export interface DataListColumnPanelProps {
  /** Shows the column search box; a number enables it above that many columns. Defaults to 30. */
  search?: boolean | number
  checkbox?: DataListCheckboxProps
  trigger?: DataListButtonProps
  /** Visible-column count badge inside the trigger; `false` hides it. */
  count?: DataListBadgeProps | false
  reset?: DataListButtonProps
}

/** Component props exposed by the sort menu trigger. */
export interface DataListSortMenuProps {
  trigger?: DataListButtonProps
  /** Mobile bottom-sheet trigger (icon-only by default). */
  sheetTrigger?: DataListButtonProps
}

/** Component props exposed by the layout switcher. */
export interface DataListLayoutSwitchProps {
  trigger?: DataListButtonProps
  activeTrigger?: DataListButtonProps
  /** Icons per layout; defaults to list and box icons. */
  icons?: Partial<Record<TableLayout, string>>
}

/** Component props exposed by the table renderer controls. */
export interface DataListTableProps {
  checkbox?: DataListCheckboxProps
  rowActions?: DataListButtonProps
  /** Empty state copy; `description: false` hides the second line. */
  empty?: { icon?: string; title?: string; description?: string | false }
}

/** Component props exposed by offset pagination. */
export interface DataListPaginationProps {
  pagination?: DataListPaginationControlProps
  pageSize?: DataListSelectControlProps
  /** Renders the first/last page buttons; defaults to true. */
  firstLast?: boolean
}

/** Component props exposed by the floating selection bar. */
export interface DataListSelectionActionsProps {
  action?: DataListButtonProps
  overflow?: DataListButtonProps
  dismiss?: DataListButtonProps
  scope?: DataListButtonProps
}

/** Component props exposed by the refresh control. */
export interface DataListRefreshProps {
  button?: DataListButtonProps
}

/** Component props exposed by the clear-filters control. */
export interface DataListClearFiltersProps {
  button?: DataListButtonProps
}

/** Component props exposed by the cursor loader. */
export interface DataListInfiniteLoaderProps {
  loadMore?: DataListButtonProps
  retry?: DataListButtonProps
}

export interface DataListPartConfig<TUi, TProps = Record<string, never>> {
  /** Overrides the control size derived from the DataList density. */
  size?: DataListControlSize
  /** Named class slots for this granular component. */
  ui?: TUi
  /** Nuxt UI component props (variant, color, size…) for the controls this part renders. */
  props?: TProps
}

export interface DataListSearchConfig
  extends DataListPartConfig<DataListSearchUi, DataListSearchProps> {
  /** CSS width for the search input; it remains capped to its container. */
  width?: string
}

/**
 * Page-wide defaults for the granular DataList components.
 *
 * Values from `app.config.nuxtUiTools.dataList` are merged first, then the
 * `DataListRoot` prop, then a granular component's own props and `ui` slots.
 */
export interface DataListUiConfig {
  /** Default control density for the composed page. */
  density?: DataListDensity
  /** Shared size fallback for controls that do not declare their own size. */
  control?: { size?: DataListControlSize }
  default?: { ui?: DataListDefaultUi }
  search?: DataListSearchConfig
  filterTags?: DataListPartConfig<DataListFilterTagsUi, DataListFilterTagsProps>
  addFilter?: DataListPartConfig<DataListAddFilterUi, DataListAddFilterProps>
  filterPanel?: DataListFilterPanelConfig
  clearFilters?: DataListPartConfig<DataListClearFiltersUi, DataListClearFiltersProps>
  resultCount?: DataListPartConfig<DataListResultCountUi>
  refresh?: DataListPartConfig<DataListRefreshUi, DataListRefreshProps>
  columnPanel?: DataListPartConfig<DataListColumnPanelUi, DataListColumnPanelProps>
  sortMenu?: DataListPartConfig<DataListSortMenuUi, DataListSortMenuProps>
  layoutSwitch?: DataListPartConfig<DataListLayoutSwitchUi, DataListLayoutSwitchProps>
  content?: DataListPartConfig<DataListContentUi>
  table?: DataListTableConfig
  grid?: DataListGridConfig
  pagination?: DataListPartConfig<DataListPaginationUi, DataListPaginationProps>
  infiniteLoader?: DataListPartConfig<DataListInfiniteLoaderUi, DataListInfiniteLoaderProps>
  selectionActions?: DataListPartConfig<DataListSelectionActionsUi, DataListSelectionActionsProps>
  /** Overrides merged on top of this config while the viewport is below the `md` breakpoint. */
  mobile?: Omit<DataListUiConfig, 'mobile'>
}

export interface DataListGridConfig extends DataListPartConfig<DataListGridUi> {
  /** Gap between cards in px; defaults to 16. */
  gap?: number
}

export interface DataListTableConfig extends DataListPartConfig<DataListTableUi, DataListTableProps> {
  /** Horizontal padding of the first and last cells, in px; defaults to the cell padding. */
  gutter?: number
}

/** UI slots rendered by the floating selection bar. */
export interface DataListSelectionActionsUi {
  root?: DataListUiClass
  bar?: DataListUiClass
  count?: DataListUiClass
  scope?: DataListUiClass
  actions?: DataListUiClass
  action?: DataListUiClass
  overflow?: DataListUiClass
  dismiss?: DataListUiClass
}
