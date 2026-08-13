import type {
  TableFilterOperator,
  TableQueryStateFilterRule,
  TableQueryStateFilterValue,
} from './query-state'
import type {
  TableFacetExecutionResult,
  TableFacetRequestDescriptor,
  TableFacetsContext,
  TableQueryDefinition,
} from './source'
import type {
  GenericObject,
  RenderableType,
  TableFieldPath,
  TableKnownFieldPath,
  TableTextValue,
} from './utils'

export interface TableSearchFilter<TRow extends GenericObject = GenericObject> {
  fields: TableFieldPath<TRow>[]
  placeholder?: TableTextValue
}

export type TableFilterPrimitiveValue = string | number | boolean

export type TableTextFilterOperator = 'contains' | 'is' | 'isNot'
export type TableOptionFilterOperator = 'is' | 'isAnyOf' | 'isNot'
export type TableBooleanFilterOperator = 'is' | 'isNot'
export type TableNumberFilterOperator = 'is' | 'isNot' | 'gt' | 'gte' | 'lt' | 'lte' | 'between'
export type TableDateFilterOperator = 'is' | 'isNot' | 'before' | 'after' | 'between'
export type TableScalarDateFilterOperator = Exclude<TableDateFilterOperator, 'between'>
export type TableFilterCommitMode = 'manual' | 'auto'
export type TableFilterPreviewMode = 'auto' | 'summary' | 'tags'
export type TableFilterDisplayLocation = 'tag' | 'panel' | 'tag-dynamic'
export type TableFilterDisplayLocationValue = TableFilterDisplayLocation | string

export interface TableFilterBehaviorCommon<
  TOperator extends TableFilterOperator = TableFilterOperator,
> {
  defaultValue?: TableQueryStateFilterValue
  operators?: TOperator[]
  defaultOperator?: TOperator
  commitMode?: TableFilterCommitMode
  clearOnOperatorChange?: boolean
  reopenOnOperatorChange?: boolean
}

export interface TableFilterUiActionLabelsConfig {
  actions?: {
    clear?: TableTextValue
    apply?: TableTextValue
  }
}

export interface TableFilterDisplayConfig {
  location?: TableFilterDisplayLocationValue
  icon?: string
  order?: number
  group?: string
  triggerLabel?: TableTextValue
  panel?: {
    section?: string
    title?: TableTextValue
  }
}

export interface TableFilterPreviewConfig {
  mode?: TableFilterPreviewMode
  label?: TableTextValue
  empty?: TableTextValue
}

export interface TableTagFilterPreviewConfig extends TableFilterPreviewConfig {
  maxTags?: number
}

export interface TableNumberFilterPreviewConfig extends TableFilterPreviewConfig {
  formatter?: (value: number) => string
  rangeFormatter?: (value: { from?: number; to?: number }) => string
}

export interface TableDateFilterPreviewConfig extends TableFilterPreviewConfig {
  formatter?: (value: Date) => string
  rangeFormatter?: (value: { from?: Date; to?: Date }) => string
}

export interface TableTextFilterUiInputConfig {
  autofocus?: boolean
  highlight?: boolean
  fixed?: boolean
}

export interface TableTextFilterEditorConfig {
  placeholder?: TableTextValue
  inputType?: 'text' | 'search' | 'email' | 'url' | 'tel'
  leadingIcon?: string
  autocomplete?: 'on' | 'off' | string
  input?: TableTextFilterUiInputConfig
  operators?: Partial<
    Record<
      TableTextFilterOperator,
      {
        placeholder?: TableTextValue
      }
    >
  >
}

export type TableOptionFilterSelectionMode = 'auto' | 'single' | 'multiple'
export type TableOptionFilterPresentation = 'list' | 'tree'
export type TableOptionFilterTreeSelectable = 'all' | 'leaf-only'
export type TableOptionFilterTreeSearchMode = 'auto' | 'local' | 'remote'
export type TableOptionFilterTreeBranchSelection = 'off' | 'children'

export interface TableOptionFilterUiSelectionConfig {
  mode?: TableOptionFilterSelectionMode
  allowEmpty?: boolean
  max?: number
}

export interface TableOptionFilterUiTreeConfig {
  selectable?: TableOptionFilterTreeSelectable
  expandedByDefault?: boolean
  searchMode?: TableOptionFilterTreeSearchMode
  branchSelection?: TableOptionFilterTreeBranchSelection
}

export interface TableOptionFilterUiRowConfig {
  showCounts?: boolean
  selectedIcon?: string
  truncate?: boolean
  getIcon?: (entry: TableFilterOptionEntry) => string | undefined
}

export interface TableOptionFilterUiLabels {
  searchPlaceholder?: TableTextValue
  empty?: TableTextValue
  clear?: TableTextValue
  apply?: TableTextValue
}

export interface TableOptionFilterUiOperatorConfig {
  selection?: TableOptionFilterUiSelectionConfig
  row?: TableOptionFilterUiRowConfig
  labels?: TableOptionFilterUiLabels
}

export interface TableOptionFilterEditorConfig<
  TPresentation extends TableOptionFilterPresentation = TableOptionFilterPresentation,
> {
  searchable?: boolean
  closeOnSelect?: boolean
  presentation?: TPresentation
  tree?: TPresentation extends 'tree' ? TableOptionFilterUiTreeConfig : never
  selection?: TableOptionFilterUiSelectionConfig
  row?: TableOptionFilterUiRowConfig
  labels?: TableOptionFilterUiLabels
  operators?: Partial<Record<TableOptionFilterOperator, TableOptionFilterUiOperatorConfig>>
}

export interface TableBooleanFilterUiLabels {
  true?: TableTextValue
  false?: TableTextValue
  empty?: TableTextValue
  clear?: TableTextValue
  apply?: TableTextValue
}

export interface TableBooleanFilterUiIcons {
  true?: string
  false?: string
}

export interface TableBooleanFilterUiSelectionConfig {
  allowEmpty?: boolean
}

export interface TableBooleanFilterUiOperatorConfig {
  labels?: TableBooleanFilterUiLabels
  icons?: TableBooleanFilterUiIcons
  selection?: TableBooleanFilterUiSelectionConfig
}

export interface TableBooleanFilterEditorConfig {
  labels?: TableBooleanFilterUiLabels
  icons?: TableBooleanFilterUiIcons
  selection?: TableBooleanFilterUiSelectionConfig
  operators?: Partial<Record<TableBooleanFilterOperator, TableBooleanFilterUiOperatorConfig>>
}

export type TableNumberScalarDisplay = 'input' | 'slider' | 'input-slider'
export type TableNumberRangeDisplay = 'inputs' | 'slider' | 'inputs-slider'

export interface TableNumberFilterUiInputCommonConfig {
  hideStepper?: boolean
  disableWheelChange?: boolean
}

export interface TableNumberFilterUiSliderConfig {
  min?: number
  max?: number
  step?: number
  showTooltip?: boolean
}

export interface TableNumberFilterUiScalarInputConfig extends TableNumberFilterUiInputCommonConfig {
  placeholder?: TableTextValue
}

export interface TableNumberFilterUiRangeInputConfig extends TableNumberFilterUiInputCommonConfig {
  fromPlaceholder?: TableTextValue
  toPlaceholder?: TableTextValue
}

export interface TableNumberFilterUiScalarConfig {
  display?: TableNumberScalarDisplay
  input?: TableNumberFilterUiScalarInputConfig
  slider?: TableNumberFilterUiSliderConfig
}

export interface TableNumberFilterUiRangeConfig {
  display?: TableNumberRangeDisplay
  minGap?: number
  inputs?: TableNumberFilterUiRangeInputConfig
  slider?: TableNumberFilterUiSliderConfig
}

export interface TableNumberFilterUiScalarOperatorConfig {
  scalar?: TableNumberFilterUiScalarConfig
}

export interface TableNumberFilterUiRangeOperatorConfig {
  range?: TableNumberFilterUiRangeConfig
}

export interface TableNumberFilterUiOperators {
  is?: TableNumberFilterUiScalarOperatorConfig
  isNot?: TableNumberFilterUiScalarOperatorConfig
  gt?: TableNumberFilterUiScalarOperatorConfig
  gte?: TableNumberFilterUiScalarOperatorConfig
  lt?: TableNumberFilterUiScalarOperatorConfig
  lte?: TableNumberFilterUiScalarOperatorConfig
  between?: TableNumberFilterUiRangeOperatorConfig
}

export interface TableNumberFilterEditorConfig {
  min?: number
  max?: number
  step?: number
  formatOptions?: Intl.NumberFormatOptions
  scalar?: TableNumberFilterUiScalarConfig
  range?: TableNumberFilterUiRangeConfig
  operators?: TableNumberFilterUiOperators
}

export interface TableDateFilterPresetContext {
  now: Date
}

export interface TableDateFilterScalarPreset {
  label: TableTextValue
  description?: TableTextValue
  value: Date | ((context: TableDateFilterPresetContext) => Date)
  operators?: TableScalarDateFilterOperator[]
}

export interface TableDateFilterRangePreset {
  label: TableTextValue
  description?: TableTextValue
  value:
    | {
        from?: Date
        to?: Date
      }
    | ((context: TableDateFilterPresetContext) => {
        from?: Date
        to?: Date
      })
}

export type TableDateFilterResponsivePanels =
  | 1
  | 2
  | {
      mobile?: 1 | 2
      desktop?: 1 | 2
    }

export type TableDateScalarDisplay = 'calendar' | 'input' | 'input-calendar'
export type TableDateRangeDisplay = 'calendar' | 'inputs' | 'inputs-calendar'
export type TableDatePresetPlacement = 'top' | 'side'
export type TableDateInputGranularity = 'day' | 'hour' | 'minute' | 'second'

export interface TableDateFilterUiCalendarConfig {
  months?: TableDateFilterResponsivePanels
  pagedNavigation?: boolean
  fixedWeeks?: boolean
  min?: Date
  max?: Date
  maxRangeDays?: number
}

export interface TableDateFilterUiScalarInputConfig {
  placeholder?: TableTextValue
  granularity?: TableDateInputGranularity
  hideTimeZone?: boolean
  hourCycle?: 12 | 24
  fixed?: boolean
  highlight?: boolean
}

export interface TableDateFilterUiRangeInputConfig {
  fromPlaceholder?: TableTextValue
  toPlaceholder?: TableTextValue
  granularity?: TableDateInputGranularity
  hideTimeZone?: boolean
  hourCycle?: 12 | 24
  fixed?: boolean
  highlight?: boolean
}

export interface TableDateFilterUiScalarConfig {
  display?: TableDateScalarDisplay
  presets?: boolean | TableDateFilterScalarPreset[]
  input?: TableDateFilterUiScalarInputConfig
  calendar?: TableDateFilterUiCalendarConfig
}

export interface TableDateFilterUiRangeConfig {
  display?: TableDateRangeDisplay
  presets?: boolean | TableDateFilterRangePreset[]
  presetsPlacement?: TableDatePresetPlacement
  input?: TableDateFilterUiRangeInputConfig
  calendar?: TableDateFilterUiCalendarConfig
}

export interface TableDateFilterUiScalarOperatorConfig {
  scalar?: TableDateFilterUiScalarConfig
}

export interface TableDateFilterUiRangeOperatorConfig {
  range?: TableDateFilterUiRangeConfig
}

export interface TableDateFilterUiOperators {
  is?: TableDateFilterUiScalarOperatorConfig
  isNot?: TableDateFilterUiScalarOperatorConfig
  before?: TableDateFilterUiScalarOperatorConfig
  after?: TableDateFilterUiScalarOperatorConfig
  between?: TableDateFilterUiRangeOperatorConfig
}

export interface TableDateFilterEditorConfig {
  scalar?: TableDateFilterUiScalarConfig
  range?: TableDateFilterUiRangeConfig
  operators?: TableDateFilterUiOperators
}

export interface TableFilterUiActionLabelsResolved {
  clear: string
  apply: string
}

export interface TableFilterPreviewConfigResolved {
  mode: TableFilterPreviewMode
  label: string
  empty: string
}

export interface TableNumberFilterPreviewConfigResolved extends TableFilterPreviewConfigResolved {
  formatter?: (value: number) => string
  rangeFormatter?: (value: { from?: number; to?: number }) => string
}

export interface TableDateFilterPreviewConfigResolved extends TableFilterPreviewConfigResolved {
  formatter?: (value: Date) => string
  rangeFormatter?: (value: { from?: Date; to?: Date }) => string
}

export interface TableTagFilterPreviewConfigResolved extends TableFilterPreviewConfigResolved {
  maxTags: number
}

export interface TableResolvedFilterPresentation<TKey extends string = string> {
  key: TKey
  location: TableFilterDisplayLocation
  order: number
  group?: string
  panelSection?: string
  active: boolean
  visible: boolean
}

export interface TableTextFilterUiResolved {
  commitMode: TableFilterCommitMode
  clearOnOperatorChange: boolean
  reopenOnOperatorChange: boolean
  actions: TableFilterUiActionLabelsResolved
  placeholder: string
  inputType: NonNullable<TableTextFilterEditorConfig['inputType']>
  leadingIcon: string
  autocomplete: NonNullable<TableTextFilterEditorConfig['autocomplete']>
  input: {
    autofocus: boolean
    highlight: boolean
    fixed: boolean
  }
  preview: TableFilterPreviewConfigResolved
}

export interface TableOptionFilterUiResolved {
  commitMode: TableFilterCommitMode
  clearOnOperatorChange: boolean
  reopenOnOperatorChange: boolean
  actions: TableFilterUiActionLabelsResolved
  searchable: boolean
  closeOnSelect: boolean
  presentation: TableOptionFilterPresentation
  tree: {
    selectable: TableOptionFilterTreeSelectable
    expandedByDefault: boolean
    searchMode: TableOptionFilterTreeSearchMode
    branchSelection: TableOptionFilterTreeBranchSelection
  }
  selection: {
    mode: 'single' | 'multiple'
    allowEmpty: boolean
    max: number | undefined
  }
  row: {
    showCounts: boolean
    selectedIcon: string
    truncate: boolean
    getIcon: ((entry: TableFilterOptionEntry) => string | undefined) | undefined
  }
  labels: {
    searchPlaceholder: string
    empty: string
  }
  preview: TableTagFilterPreviewConfigResolved
}

export interface TableBooleanFilterUiResolved {
  commitMode: TableFilterCommitMode
  clearOnOperatorChange: boolean
  reopenOnOperatorChange: boolean
  actions: TableFilterUiActionLabelsResolved
  labels: {
    true: string
    false: string
    empty: string
  }
  icons: {
    true: string | undefined
    false: string | undefined
  }
  selection: {
    allowEmpty: boolean
  }
  preview: TableTagFilterPreviewConfigResolved
}

export interface TableNumberFilterUiResolved {
  commitMode: TableFilterCommitMode
  clearOnOperatorChange: boolean
  reopenOnOperatorChange: boolean
  actions: TableFilterUiActionLabelsResolved
  min: number | undefined
  max: number | undefined
  step: number
  formatOptions: Intl.NumberFormatOptions | undefined
  preview: TableNumberFilterPreviewConfigResolved
  scalar: {
    display: TableNumberScalarDisplay
    input: {
      placeholder: string
      hideStepper: boolean
      disableWheelChange: boolean
    }
    slider: {
      min: number | undefined
      max: number | undefined
      step: number | undefined
      showTooltip: boolean
    }
    preview: TableNumberFilterPreviewConfigResolved
  }
  range: {
    display: TableNumberRangeDisplay
    minGap: number | undefined
    inputs: {
      fromPlaceholder: string
      toPlaceholder: string
      hideStepper: boolean
      disableWheelChange: boolean
    }
    slider: {
      min: number | undefined
      max: number | undefined
      step: number | undefined
      showTooltip: boolean
    }
    preview: TableNumberFilterPreviewConfigResolved
  }
}

export interface TableDateFilterUiResolved {
  commitMode: TableFilterCommitMode
  clearOnOperatorChange: boolean
  reopenOnOperatorChange: boolean
  actions: TableFilterUiActionLabelsResolved
  preview: TableDateFilterPreviewConfigResolved
  scalar: {
    display: TableDateScalarDisplay
    presets: boolean | TableDateFilterScalarPreset[] | undefined
    input: {
      placeholder: string
      granularity: TableDateInputGranularity
      hideTimeZone: boolean
      hourCycle: 12 | 24 | undefined
      fixed: boolean
      highlight: boolean
    }
    calendar: {
      months: TableDateFilterResponsivePanels | undefined
      pagedNavigation: boolean | undefined
      fixedWeeks: boolean
      min: Date | undefined
      max: Date | undefined
      maxRangeDays: number | undefined
    }
    preview: TableDateFilterPreviewConfigResolved
  }
  range: {
    display: TableDateRangeDisplay
    presets: boolean | TableDateFilterRangePreset[] | undefined
    presetsPlacement: TableDatePresetPlacement
    input: {
      fromPlaceholder: string
      toPlaceholder: string
      granularity: TableDateInputGranularity
      hideTimeZone: boolean
      hourCycle: 12 | 24 | undefined
      fixed: boolean
      highlight: boolean
    }
    calendar: {
      months: TableDateFilterResponsivePanels | undefined
      pagedNavigation: boolean | undefined
      fixedWeeks: boolean
      min: Date | undefined
      max: Date | undefined
      maxRangeDays: number | undefined
    }
    preview: TableDateFilterPreviewConfigResolved
  }
}

export interface TableFilterOptionValueEntry<TValue = TableFilterPrimitiveValue> {
  label: TableTextValue
  value: TValue
  icon?: string
  count?: number
  children?: ReadonlyArray<TableFilterOptionEntry<TValue>>
}

export interface TableFilterOptionGroupEntry<TValue = TableFilterPrimitiveValue> {
  label: TableTextValue
  value?: undefined
  icon?: string
  count?: number
  children: ReadonlyArray<TableFilterOptionEntry<TValue>>
}

export type TableFilterOptionEntry<TValue = TableFilterPrimitiveValue> =
  | TableFilterOptionValueEntry<TValue>
  | TableFilterOptionGroupEntry<TValue>

export type TableOptionEntryForPresentation<
  TValue = TableFilterPrimitiveValue,
  TPresentation extends TableOptionFilterPresentation = TableOptionFilterPresentation,
> = TPresentation extends 'tree'
  ? TableFilterOptionEntry<TValue>
  : TableFilterOptionValueEntry<TValue>

export interface TableFilterOptionQueryResultForPresentation<
  TValue = TableFilterPrimitiveValue,
  TPresentation extends TableOptionFilterPresentation = TableOptionFilterPresentation,
> {
  options: ReadonlyArray<TableOptionEntryForPresentation<TValue, TPresentation>>
  nextCursor?: string | null
  total?: number
}

export interface TableResolvedFilterOptionEntry<TValue = TableFilterPrimitiveValue> {
  id: string
  label: string
  value?: TValue
  icon?: string
  count?: number
  selected: boolean
  children: Array<TableResolvedFilterOptionEntry<TValue>>
}

export interface TableVisibleFilterOptionEntry<TValue = TableFilterPrimitiveValue> {
  id: string
  label: string
  value?: TValue
  icon?: string
  count?: number
  selected: boolean
  depth: number
  expandable: boolean
  selectable: boolean
  branchSelectable: boolean
}

export interface TableFilterOptionQueryContext {
  search?: string
  limit?: number
  cursor?: string | null
}

export type TableFilterOptionQueryResult<TValue = TableFilterPrimitiveValue> =
  TableFilterOptionQueryResultForPresentation<TValue, TableOptionFilterPresentation>

export type TableFilterFacetMode = boolean | 'exclude-self' | 'include-self'

export interface TableFilterFacetQueryContext<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> {
  table: Omit<TableFacetsContext<TRow, TContext, TKey>, 'facets'>
  facets: TableFacetRequestDescriptor<TKey>[]
}

export interface TableFilterFacetConfig<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> {
  mode?: 'exclude-self' | 'include-self'
  limit?: number
  query?: {
    bivarianceHack(
      context: TableFilterFacetQueryContext<TRow, TContext, TKey>,
    ): TableQueryDefinition<TableFacetExecutionResult<TKey>>
  }['bivarianceHack']
}

export type TableFilterFacetSpec<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> = TableFilterFacetMode | TableFilterFacetConfig<TRow, TContext, TKey>

export interface TableStaticFilterRule<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> {
  key: TKey
  operator: TableFilterOperator
  value: unknown | ((context: TContext) => unknown)
}

export interface TableResolvedFilterCondition<TKey extends string = string, TValue = unknown> {
  type: 'condition'
  key: TKey
  operator: TableFilterOperator
  value: TValue
}

export interface TableResolvedFilterGroup<TKey extends string = string> {
  type: 'group'
  combinator: 'and' | 'or'
  children: TableResolvedFilterNode<TKey>[]
}

export type TableResolvedFilterNode<TKey extends string = string> =
  | TableResolvedFilterCondition<TKey>
  | TableResolvedFilterGroup<TKey>

export type TableStaticFilterNode<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> = TableStaticFilterRule<TRow, TContext, TKey> | TableResolvedFilterGroup<TKey>

export interface TableFilterResolveContext<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> {
  rule: TableQueryStateFilterRule<TKey, TableFilterOperator, TableQueryStateFilterValue>
  definition: TableUiFilterDefinition<TRow, TContext, TKey>
  context?: TContext
}

export type TableFilterResolveResult<TKey extends string = string> =
  TableResolvedFilterNode<TKey> | null

interface TableFilterDefinitionBase<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
  TValue = unknown,
  TOperator extends TableFilterOperator = TableFilterOperator,
> {
  key: TKey
  label: TableTextValue | (() => RenderableType)
  behavior?: TableFilterBehaviorCommon<TOperator> & {
    defaultValue?: TValue
  }
  display?: TableFilterDisplayConfig
  preview?: TableFilterPreviewConfig
  actions?: TableFilterUiActionLabelsConfig['actions']
  resolve?: {
    bivarianceHack(
      params: TableFilterResolveContext<TRow, TContext, TKey>,
    ): TableFilterResolveResult<string>
  }['bivarianceHack']
}

export interface TableTextFilterDefinition<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> extends TableFilterDefinitionBase<TRow, TContext, TKey, string, TableTextFilterOperator> {
  kind: 'text'
  editor?: TableTextFilterEditorConfig
}

export interface TableOptionFilterDefinition<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
  TValue = TableFilterPrimitiveValue,
  TPresentation extends TableOptionFilterPresentation = TableOptionFilterPresentation,
> extends TableFilterDefinitionBase<TRow, TContext, TKey, TValue[], TableOptionFilterOperator> {
  kind: 'option'
  source?: {
    options?: ReadonlyArray<TableOptionEntryForPresentation<TValue, TPresentation>>
    query?: (
      context: TableFilterOptionQueryContext,
    ) => TableQueryDefinition<
      | TableOptionEntryForPresentation<TValue, TPresentation>[]
      | TableFilterOptionQueryResultForPresentation<TValue, TPresentation>
    >
    facet?: TableFilterFacetSpec<TRow, TContext, TKey>
    sort?: 'alpha' | 'count'
  }
  editor?: TableOptionFilterEditorConfig<TPresentation>
}

export interface TableBooleanFilterDefinition<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> extends TableFilterDefinitionBase<TRow, TContext, TKey, boolean, TableBooleanFilterOperator> {
  kind: 'boolean'
  source?: {
    facet?: TableFilterFacetSpec<TRow, TContext, TKey>
  }
  editor?: TableBooleanFilterEditorConfig
}

export interface TableNumberFilterDefinition<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> extends TableFilterDefinitionBase<
  TRow,
  TContext,
  TKey,
  number | { min?: number; max?: number },
  TableNumberFilterOperator
> {
  kind: 'number'
  editor?: TableNumberFilterEditorConfig
  preview?: TableNumberFilterPreviewConfig
}

export interface TableDateFilterDefinition<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> extends TableFilterDefinitionBase<
  TRow,
  TContext,
  TKey,
  Date | { from?: Date; to?: Date },
  TableDateFilterOperator
> {
  kind: 'date'
  editor?: TableDateFilterEditorConfig
  preview?: TableDateFilterPreviewConfig
}

export type TableUiFilterDefinition<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> =
  | TableTextFilterDefinition<TRow, TContext, TKey>
  | TableOptionFilterDefinition<
      TRow,
      TContext,
      TKey,
      TableFilterPrimitiveValue,
      TableOptionFilterPresentation
    >
  | TableBooleanFilterDefinition<TRow, TContext, TKey>
  | TableNumberFilterDefinition<TRow, TContext, TKey>
  | TableDateFilterDefinition<TRow, TContext, TKey>

export type { TableFilterOperator }

export type TableTextFilterOptions<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> = Omit<TableTextFilterDefinition<TRow, TContext, TKey>, 'key' | 'kind'>

export type TableOptionFilterOptions<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
  TValue = TableFilterPrimitiveValue,
  TPresentation extends TableOptionFilterPresentation = TableOptionFilterPresentation,
> = Omit<TableOptionFilterDefinition<TRow, TContext, TKey, TValue, TPresentation>, 'key' | 'kind'>

export type TableBooleanFilterOptions<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> = Omit<TableBooleanFilterDefinition<TRow, TContext, TKey>, 'key' | 'kind'>

export type TableNumberFilterOptions<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> = Omit<TableNumberFilterDefinition<TRow, TContext, TKey>, 'key' | 'kind'>

export type TableDateFilterOptions<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> = Omit<TableDateFilterDefinition<TRow, TContext, TKey>, 'key' | 'kind'>

export interface TableFilterBuilder<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
> {
  text<TKey extends TableKnownFieldPath<TRow>>(
    key: TKey,
    options: TableTextFilterOptions<TRow, TContext, TKey>,
  ): TableTextFilterDefinition<TRow, TContext, TKey>
  option<
    TKey extends TableKnownFieldPath<TRow>,
    TValue extends TableFilterPrimitiveValue,
    TPresentation extends TableOptionFilterPresentation = TableOptionFilterPresentation,
  >(
    key: TKey,
    options: TableOptionFilterOptions<TRow, TContext, TKey, TValue, TPresentation>,
  ): TableOptionFilterDefinition<TRow, TContext, TKey, TValue, TPresentation>
  boolean<TKey extends TableKnownFieldPath<TRow>>(
    key: TKey,
    options: TableBooleanFilterOptions<TRow, TContext, TKey>,
  ): TableBooleanFilterDefinition<TRow, TContext, TKey>
  number<TKey extends TableKnownFieldPath<TRow>>(
    key: TKey,
    options: TableNumberFilterOptions<TRow, TContext, TKey>,
  ): TableNumberFilterDefinition<TRow, TContext, TKey>
  date<TKey extends TableKnownFieldPath<TRow>>(
    key: TKey,
    options: TableDateFilterOptions<TRow, TContext, TKey>,
  ): TableDateFilterDefinition<TRow, TContext, TKey>
}

export type TableUiFilterCollection<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> =
  | TableUiFilterDefinition<TRow, TContext, TKey>[]
  | ((
      filter: TableFilterBuilder<TRow, TContext>,
    ) => TableUiFilterDefinition<TRow, TContext, TKey>[])

export interface TableFiltersSchema<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow>,
> {
  search?: TableSearchFilter<TRow>
  static?: TableStaticFilterNode<TRow, TContext, TKey>[]
  ui?: TableUiFilterCollection<TRow, TContext, TKey>
}
