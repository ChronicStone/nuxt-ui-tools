export type DataListDensity = 'compact' | 'default' | 'comfortable'
export type DataListControlSize = 'xs' | 'sm' | 'md' | 'lg'
export type DataListContentFit = 'content' | 'height' | 'fill'

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

/** UI slots rendered by filter tags and their adjacent actions. */
export interface DataListFilterTagsUi {
  root?: DataListUiClass
  trigger?: DataListUiClass
  label?: DataListUiClass
  value?: DataListUiClass
  dismiss?: DataListUiClass
  addTrigger?: DataListUiClass
  clearTrigger?: DataListUiClass
}

/** UI slots rendered by the add-filter picker. */
export interface DataListAddFilterUi {
  trigger?: DataListUiClass
  popoverContent?: DataListUiClass
  panel?: DataListUiClass
  option?: DataListUiClass
  optionIcon?: DataListUiClass
  optionLabel?: DataListUiClass
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
  description?: DataListUiClass
  close?: DataListUiClass
  fields?: DataListUiClass
  footerActions?: DataListUiClass
  clear?: DataListUiClass
  apply?: DataListUiClass
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
  errorTitle?: DataListUiClass
  retry?: DataListUiClass
}

/** UI slots rendered by the table mode. Nuxt UI table slots are forwarded unchanged. */
export interface DataListTableUi {
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

export interface DataListPartConfig<TUi> {
  /** Overrides the control size derived from the DataList density. */
  size?: DataListControlSize
  /** Named class slots for this granular component. */
  ui?: TUi
}

export interface DataListSearchConfig extends DataListPartConfig<DataListSearchUi> {
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
  filterTags?: DataListPartConfig<DataListFilterTagsUi>
  addFilter?: DataListPartConfig<DataListAddFilterUi>
  filterPanel?: DataListPartConfig<DataListFilterPanelUi>
  clearFilters?: DataListPartConfig<DataListClearFiltersUi>
  resultCount?: { ui?: DataListResultCountUi }
  refresh?: DataListPartConfig<DataListRefreshUi>
  columnPanel?: DataListPartConfig<DataListColumnPanelUi>
  sortMenu?: DataListPartConfig<DataListSortMenuUi>
  layoutSwitch?: DataListPartConfig<DataListLayoutSwitchUi>
  content?: { ui?: DataListContentUi }
  table?: { ui?: DataListTableUi }
  grid?: { ui?: DataListGridUi }
  pagination?: DataListPartConfig<DataListPaginationUi>
  infiniteLoader?: DataListPartConfig<DataListInfiniteLoaderUi>
}
