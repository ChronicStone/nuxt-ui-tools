import type { DisplayAccordionProps } from './blocks/accordion'
import type { DisplayAlertProps } from './blocks/alert'
import type { DisplayBreakdownProps } from './blocks/breakdown'
import type { DisplayChartProps } from './blocks/chart'
import type { DisplayCodeProps } from './blocks/code'
import type { DisplayDateProps } from './blocks/date'
import type { DisplayDiffProps } from './blocks/diff'
import type { DisplayEmptyProps } from './blocks/empty'
import type { DisplayFactsProps } from './blocks/facts'
import type { DisplayHeadingProps } from './blocks/heading'
import type { DisplayListProps } from './blocks/list'
import type { DisplayMediaProps } from './blocks/media'
import type { DisplayMeterProps } from './blocks/meter'
import type { DisplayPersonProps } from './blocks/person'
import type { DisplayRecordProps } from './blocks/record'
import type { DisplayStatProps } from './blocks/stat'
import type { DisplayTableProps } from './blocks/table'
import type { DisplayTextProps } from './blocks/text'
import type { DisplayTimelineProps } from './blocks/timeline'

/** Props of every display block, by kind. */
export interface DisplayPropsMap {
  heading: DisplayHeadingProps
  text: DisplayTextProps
  alert: DisplayAlertProps
  facts: DisplayFactsProps
  stat: DisplayStatProps
  breakdown: DisplayBreakdownProps
  meter: DisplayMeterProps
  chart: DisplayChartProps
  table: DisplayTableProps
  diff: DisplayDiffProps
  record: DisplayRecordProps
  person: DisplayPersonProps
  list: DisplayListProps
  timeline: DisplayTimelineProps
  date: DisplayDateProps
  media: DisplayMediaProps
  code: DisplayCodeProps
  empty: DisplayEmptyProps
  accordion: DisplayAccordionProps
}

export type DisplayKind = keyof DisplayPropsMap

/** Slot classes of every display block, by kind. */
export type DisplayUiMap = { [K in DisplayKind]: NonNullable<DisplayPropsMap[K]['ui']> }

/**
 * One display block: its kind, its props, and optionally a preset from
 * `appConfig.nuxtUiTools.display.presets` whose props the given ones override.
 */
export type DisplaySpec = {
  [K in DisplayKind]: { display: K; props: DisplayPropsMap[K]; preset?: string }
}[DisplayKind]
