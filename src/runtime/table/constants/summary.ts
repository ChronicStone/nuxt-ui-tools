import type { DataListControlSize, DataListSummaryUi } from '../types'

/** Summary rows below the `md` breakpoint, the full table from `md` up. */
export const TABLE_SUMMARY_DEFAULT_ENABLED = 'true md:false'

/** How long the reader's summary/table choice is remembered, in seconds. */
export const TABLE_SUMMARY_PREFERENCE_MAX_AGE = 60 * 60 * 24 * 365

/** Separates the values of a summary row's detail line. */
export const TABLE_SUMMARY_DETAILS_SEPARATOR = ' · '

/** From this many rows on, only the rows on screen are rendered, as in the table. */
export const TABLE_SUMMARY_VIRTUALIZE_THRESHOLD = 40

/** Placeholder rows of a first load, however short the viewport is. */
export const TABLE_SUMMARY_SKELETON_MIN_ROWS = 6

/** Rows from the end of a cursor list at which the next page is requested. */
export const TABLE_SUMMARY_LOAD_MORE_THRESHOLD = 6

/** What each control size gives a row, in px: its font, side gutter, height and leading tile. */
export const TABLE_SUMMARY_SIZE_TOKENS = {
  lg: { font: 14, gutter: 16, row: 72, tile: 36 },
  md: { font: 13.5, gutter: 14, row: 64, tile: 32 },
  sm: { font: 13, gutter: 12, row: 60, tile: 32 },
  xl: { font: 15, gutter: 16, row: 80, tile: 40 },
  xs: { font: 12.5, gutter: 12, row: 56, tile: 28 },
} satisfies Record<DataListControlSize, { font: number; gutter: number; row: number; tile: number }>

/**
 * The classes of every summary slot. Rows sit on the default surface, never on the page's tint,
 * with a hairline between them; the app's `ui.summary.ui` is merged over these.
 */
export const TABLE_SUMMARY_SLOT_CLASSES = {
  actions:
    'nut-dl-summary__actions flex shrink-0 items-center pe-[calc(var(--nut-dl-summary-x)/2)]',
  body: 'nut-dl-summary__body min-w-0 flex-1',
  details: 'nut-dl-summary__details min-w-0 truncate',
  header:
    'nut-dl-summary__header flex min-h-11 shrink-0 items-center gap-1 border-b border-muted bg-default pe-[var(--nut-dl-summary-x)] text-[length:var(--nut-dl-summary-meta)] font-medium text-muted',
  leading:
    'nut-dl-summary__leading flex size-[var(--nut-dl-summary-tile)] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accented text-xs font-semibold text-muted empty:hidden',
  list: 'nut-dl-summary__list',
  loadingMore:
    'nut-dl-summary__more flex min-h-[var(--nut-dl-summary-row-h)] items-center justify-center gap-2.5 text-[12.5px] text-muted',
  main: 'nut-dl-summary__main flex min-w-0 flex-1 items-center gap-3 py-2.5 text-start focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
  meta: 'nut-dl-summary__meta mt-0.5 flex min-w-0 items-center gap-2 text-[length:var(--nut-dl-summary-meta)] leading-snug text-muted',
  root: 'nut-dl-summary relative flex min-h-0 flex-col bg-default',
  row: 'nut-dl-summary__row relative flex min-h-[var(--nut-dl-summary-row-h)] items-stretch border-b border-muted bg-default',
  select: 'nut-dl-summary__select flex shrink-0 items-center',
  skeleton:
    'nut-dl-summary__skeleton flex min-h-[var(--nut-dl-summary-row-h)] items-center gap-3 border-b border-muted px-[var(--nut-dl-summary-x)]',
  status: 'nut-dl-summary__status shrink-0 empty:hidden',
  title:
    'nut-dl-summary__title block truncate text-[length:var(--nut-dl-summary-font)] leading-snug font-semibold text-highlighted',
  viewport: 'nut-dl-summary__viewport relative min-h-0 overflow-x-hidden overflow-y-auto',
} as const satisfies Record<keyof DataListSummaryUi, string>
