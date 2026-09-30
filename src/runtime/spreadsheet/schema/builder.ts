import type {
  SpreadsheetColumnConfig,
  SpreadsheetColumnEntry,
  SpreadsheetColumnFactory,
  SpreadsheetColumnKind,
  SpreadsheetColumnsBuilder,
  SpreadsheetDynamicEntry,
  SpreadsheetEntry,
  SpreadsheetGroupOptions,
} from '../types'

/** The builder as the runtime sees it: every type parameter erased. */
interface SpreadsheetLooseColumns<TResult> {
  text(key: string, options?: SpreadsheetColumnConfig): TResult
  number(key: string, options?: SpreadsheetColumnConfig): TResult
  date(key: string, options?: SpreadsheetColumnConfig): TResult
  boolean(key: string, options?: SpreadsheetColumnConfig): TResult
  select(key: string, options: SpreadsheetColumnConfig): TResult
}

interface SpreadsheetLooseBuilder extends SpreadsheetLooseColumns<SpreadsheetLooseBuilder> {
  readonly '~entries': readonly SpreadsheetEntry[]
  group(
    key: string,
    options: SpreadsheetGroupOptions<unknown>,
    build: (group: SpreadsheetLooseBuilder) => { readonly '~entries': readonly SpreadsheetEntry[] },
  ): SpreadsheetLooseBuilder
  dynamic(key: string, options: SpreadsheetDynamicEntry['config']): SpreadsheetLooseBuilder
}

function createColumn(
  kind: SpreadsheetColumnKind,
  key: string,
  config: SpreadsheetColumnConfig | undefined,
): SpreadsheetColumnEntry {
  return { config: config ?? {}, entry: 'column', key, kind }
}

function columnMethods<TResult>(
  add: (column: SpreadsheetColumnEntry) => TResult,
): SpreadsheetLooseColumns<TResult> {
  return {
    boolean: (key, options) => add(createColumn('boolean', key, options)),
    date: (key, options) => add(createColumn('date', key, options)),
    number: (key, options) => add(createColumn('number', key, options)),
    select: (key, options) => add(createColumn('select', key, options)),
    text: (key, options) => add(createColumn('text', key, options)),
  }
}

function createBuilder(entries: readonly SpreadsheetEntry[]): SpreadsheetLooseBuilder {
  return {
    ...columnMethods((column) => createBuilder([...entries, column])),
    '~entries': entries,
    dynamic: (key, options) =>
      createBuilder([...entries, { config: options, entry: 'dynamic', key }]),
    group: (key, options, build) => {
      const children = build(createBuilder([]))['~entries'].filter(
        (entry): entry is SpreadsheetColumnEntry => entry.entry === 'column',
      )
      return createBuilder([...entries, { children, config: options, entry: 'group', key }])
    },
  }
}

/**
 * The `c` passed to `columns`. Each method records a column and returns a new builder; the
 * runtime reads the columns from `'~entries'`.
 */
export function createSpreadsheetColumnsBuilder<TContext>(): SpreadsheetColumnsBuilder<
  TContext,
  NonNullable<unknown>
>
// The overload carries the types; the implementation records plain column descriptions.
export function createSpreadsheetColumnsBuilder(): unknown {
  return createBuilder([])
}

/** The `c` passed to a dynamic group's `column`: each method returns one column. */
export function createSpreadsheetColumnFactory(): SpreadsheetColumnFactory<never, never>
// The overload carries the types; the implementation returns plain column descriptions.
export function createSpreadsheetColumnFactory(): unknown {
  return columnMethods((column) => column)
}
