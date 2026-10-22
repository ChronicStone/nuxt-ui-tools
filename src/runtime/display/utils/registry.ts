import type { Component } from 'vue'

import DisplayAccordion from '../components/blocks/display-accordion.vue'
import DisplayAlert from '../components/blocks/display-alert.vue'
import DisplayBreakdown from '../components/blocks/display-breakdown.vue'
import DisplayChart from '../components/blocks/display-chart.vue'
import DisplayCode from '../components/blocks/display-code.vue'
import DisplayDate from '../components/blocks/display-date.vue'
import DisplayDiff from '../components/blocks/display-diff.vue'
import DisplayEmpty from '../components/blocks/display-empty.vue'
import DisplayFacts from '../components/blocks/display-facts.vue'
import DisplayHeading from '../components/blocks/display-heading.vue'
import DisplayList from '../components/blocks/display-list.vue'
import DisplayMedia from '../components/blocks/display-media.vue'
import DisplayMeter from '../components/blocks/display-meter.vue'
import DisplayPerson from '../components/blocks/display-person.vue'
import DisplayRecord from '../components/blocks/display-record.vue'
import DisplayStat from '../components/blocks/display-stat.vue'
import DisplayTable from '../components/blocks/display-table.vue'
import DisplayText from '../components/blocks/display-text.vue'
import DisplayTimeline from '../components/blocks/display-timeline.vue'
import type { DisplayKind } from '../types'

export type DisplaySkeletonLayout = 'lines' | 'rows' | 'tiles' | 'card' | 'media' | 'ring' | 'block'

/** The component drawing each display kind. */
export const DISPLAY_BLOCKS = {
  accordion: DisplayAccordion,
  alert: DisplayAlert,
  breakdown: DisplayBreakdown,
  chart: DisplayChart,
  code: DisplayCode,
  date: DisplayDate,
  diff: DisplayDiff,
  empty: DisplayEmpty,
  facts: DisplayFacts,
  heading: DisplayHeading,
  list: DisplayList,
  media: DisplayMedia,
  meter: DisplayMeter,
  person: DisplayPerson,
  record: DisplayRecord,
  stat: DisplayStat,
  table: DisplayTable,
  text: DisplayText,
  timeline: DisplayTimeline,
} as const satisfies Record<DisplayKind, Component>

/** Kinds in a stable order, for docs and pickers. */
export const DISPLAY_KINDS = Object.freeze(
  Object.keys(DISPLAY_BLOCKS).filter((kind): kind is DisplayKind => kind in DISPLAY_BLOCKS),
)

/** Skeleton drawn for each kind while its props load. */
export const DISPLAY_SKELETON_LAYOUTS = {
  accordion: 'rows',
  alert: 'block',
  breakdown: 'rows',
  chart: 'block',
  code: 'block',
  date: 'card',
  diff: 'rows',
  empty: 'block',
  facts: 'rows',
  heading: 'lines',
  list: 'lines',
  media: 'media',
  meter: 'lines',
  person: 'card',
  record: 'card',
  stat: 'lines',
  table: 'rows',
  text: 'lines',
  timeline: 'lines',
} as const satisfies Record<DisplayKind, DisplaySkeletonLayout>
