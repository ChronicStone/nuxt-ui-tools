import type { GenericObject, RenderableType, TableKnownFieldPath } from './utils'

/** What a group's `label`, `summary` and `collapsed` receive. */
export interface TableGroupParams<TRow extends GenericObject = GenericObject> {
  /** The value its rows share; `undefined` for rows that have none. */
  value: unknown
  /** Its rows among those loaded, in display order. */
  rows: TRow[]
}

/**
 * Gathers rows that share a value under a header row that folds them.
 *
 * Groups exist only on screen: the data stays flat, so filters, pagination and bulk actions keep
 * working on rows. They cover the rows that are loaded, so a remote source needs a page large
 * enough to hold a whole group. A column sort applies inside each group.
 *
 * @example
 * ```ts
 * table: {
 *   groupBy: {
 *     key: 'country',
 *     label: ({ value }) => countryName(value),
 *   },
 * }
 * ```
 */
export interface TableGroupBySchema<TRow extends GenericObject = GenericObject> {
  /** The row field to group on, or a function for a value the row does not hold as a field. */
  key: TableKnownFieldPath<TRow> | ((row: TRow) => unknown)
  /** The header's text. Defaults to the value, or the locale's "Other" for rows with none. */
  label?: (params: TableGroupParams<TRow>) => RenderableType
  /** Shown next to the label. Defaults to the number of rows. */
  summary?: (params: TableGroupParams<TRow>) => RenderableType
  /** Values listed here come first, in this order. The rest follow by value, empty ones last. */
  order?: readonly unknown[]
  /** Whether a group starts folded. A group the reader has toggled keeps that state. */
  collapsed?: boolean | ((params: TableGroupParams<TRow>) => boolean)
}

/** One group of the loaded rows, resolved once per data change. */
export interface TableGroup<TRow extends GenericObject = GenericObject> {
  readonly key: string
  readonly value: unknown
  readonly rows: TRow[]
  readonly rowIds: string[]
}
