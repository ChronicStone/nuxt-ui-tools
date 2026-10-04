import { isArray, isFiniteNumber, isPlainObject, isString } from '../../../shared/utils/predicate'
import { uniqueColumnIds } from './schema'
import { ROW_ACTIONS_COLUMN_ID, SELECT_COLUMN_ID } from './types'
import type { TableColumnState } from './types'

export interface ColumnPreferences {
  order?: string[]
  hidden?: string[]
  shown?: string[]
  left?: string[]
  right?: string[]
  widths?: Record<string, number>
}

const FORMAT_VERSION = '1'
const SECTION_SEPARATOR = '!'
const ITEM_SEPARATOR = '~'
const WIDTH_SEPARATOR = '*'
const INTERNAL_COLUMN_IDS = new Set([SELECT_COLUMN_ID, ROW_ACTIONS_COLUMN_ID])

export function encodeColumnPreferences(options: {
  state: TableColumnState
  defaults: TableColumnState
}) {
  const sections: string[] = []
  const order = userColumnIds(options.state.columnOrder)
  const defaultOrder = userColumnIds(options.defaults.columnOrder)
  const visibilityChanges = defaultOrder.filter(
    (id) =>
      (options.state.columnVisibility[id] ?? options.defaults.columnVisibility[id]) !==
      options.defaults.columnVisibility[id],
  )
  const left = userColumnIds(options.state.columnPinning.left ?? [])
  const right = userColumnIds(options.state.columnPinning.right ?? [])
  const widths = Object.entries(options.state.columnSizing).filter(([, width]) =>
    Number.isFinite(width),
  )

  if (!sameIds(order, defaultOrder)) {
    sections.push(`o${joinIds(order)}`)
  }

  const hidden = visibilityChanges.filter((id) => options.state.columnVisibility[id] === false)
  const shown = visibilityChanges.filter((id) => options.state.columnVisibility[id] === true)

  if (hidden.length) {
    sections.push(`h${joinIds(hidden)}`)
  }

  if (shown.length) {
    sections.push(`v${joinIds(shown)}`)
  }

  if (!sameIds(left, userColumnIds(options.defaults.columnPinning.left ?? []))) {
    sections.push(`l${joinIds(left)}`)
  }

  if (!sameIds(right, userColumnIds(options.defaults.columnPinning.right ?? []))) {
    sections.push(`r${joinIds(right)}`)
  }

  if (widths.length) {
    sections.push(
      `w${widths
        .map(([id, width]) => `${escapeId(id)}${WIDTH_SEPARATOR}${Math.round(width)}`)
        .join(ITEM_SEPARATOR)}`,
    )
  }

  return sections.length ? [FORMAT_VERSION, ...sections].join(SECTION_SEPARATOR) : null
}

export function decodeColumnPreferences(
  value: string | null | undefined,
): ColumnPreferences | null {
  if (!value) {
    return null
  }

  if (value.startsWith('{') || value.startsWith('%7B')) {
    return decodeLegacyPreferences(value)
  }

  const [version, ...sections] = value.split(SECTION_SEPARATOR)

  if (version !== FORMAT_VERSION) {
    return null
  }

  const preferences: ColumnPreferences = {}

  for (const section of sections) {
    const key = section.charAt(0)
    const ids = splitIds(section.slice(1))

    if (key === 'o') preferences.order = ids
    else if (key === 'h') preferences.hidden = ids
    else if (key === 'v') preferences.shown = ids
    else if (key === 'l') preferences.left = ids
    else if (key === 'r') preferences.right = ids
    else if (key === 'w') preferences.widths = decodeWidths(section.slice(1))
  }

  return preferences
}

export function applyColumnPreferences(options: {
  state: TableColumnState
  preferences: ColumnPreferences
}) {
  const known = new Set(options.state.columnOrder)
  const keep = (ids: string[] | undefined) => (ids ?? []).filter((id) => known.has(id))
  const { preferences, state } = options
  const order = keep(preferences.order)

  return {
    ...state,
    columnOrder: preferences.order
      ? uniqueColumnIds({ columnIds: [...order, ...state.columnOrder] })
      : state.columnOrder,
    columnPinning: {
      left: preferences.left
        ? uniqueColumnIds({ columnIds: [SELECT_COLUMN_ID, ...keep(preferences.left)] })
        : (state.columnPinning.left ?? []),
      right: preferences.right
        ? withRowActionsLast({
            ids: keep(preferences.right),
            hadRowActions: (state.columnPinning.right ?? []).includes(ROW_ACTIONS_COLUMN_ID),
          })
        : (state.columnPinning.right ?? []),
    },
    columnSizing: preferences.widths
      ? Object.fromEntries(Object.entries(preferences.widths).filter(([id]) => known.has(id)))
      : state.columnSizing,
    columnVisibility: {
      ...state.columnVisibility,
      ...Object.fromEntries(keep(preferences.hidden).map((id) => [id, false])),
      ...Object.fromEntries(keep(preferences.shown).map((id) => [id, true])),
    },
  }
}

function decodeLegacyPreferences(value: string): ColumnPreferences | null {
  let legacy: unknown

  try {
    legacy = JSON.parse(value.startsWith('{') ? value : decodeURIComponent(value))
  } catch {
    return null
  }

  if (!isPlainObject(legacy)) {
    return null
  }

  const visibility = isPlainObject(legacy.visibility) ? Object.entries(legacy.visibility) : []
  const pinning = isPlainObject(legacy.pinning) ? legacy.pinning : {}

  return {
    hidden: visibility.filter(([, visible]) => visible === false).map(([id]) => id),
    left: isArray(pinning.left) ? pinning.left.filter((id) => isString(id)) : undefined,
    order: isArray(legacy.order) ? legacy.order.filter((id) => isString(id)) : undefined,
    right: isArray(pinning.right) ? pinning.right.filter((id) => isString(id)) : undefined,
    widths: isPlainObject(legacy.sizing)
      ? Object.fromEntries(
          Object.entries(legacy.sizing).filter((entry): entry is [string, number] =>
            isFiniteNumber(entry[1]),
          ),
        )
      : undefined,
  }
}

function decodeWidths(value: string) {
  return Object.fromEntries(
    value.split(ITEM_SEPARATOR).flatMap((entry) => {
      const separator = entry.lastIndexOf(WIDTH_SEPARATOR)
      const width = Number(entry.slice(separator + 1))

      return separator > 0 && Number.isFinite(width)
        ? [[decodeURIComponent(entry.slice(0, separator)), width]]
        : []
    }),
  )
}

function userColumnIds(ids: string[]) {
  return ids.filter((id) => !INTERNAL_COLUMN_IDS.has(id))
}

function sameIds(first: string[], second: string[]) {
  return first.length === second.length && first.every((id, index) => id === second[index])
}

function joinIds(ids: string[]) {
  return ids.map(escapeId).join(ITEM_SEPARATOR)
}

function splitIds(value: string) {
  return value ? value.split(ITEM_SEPARATOR).map((id) => decodeURIComponent(id)) : []
}

function escapeId(id: string) {
  return encodeURIComponent(id).replace(
    /[!'()*~]/gu,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

function withRowActionsLast(options: { ids: string[]; hadRowActions: boolean }) {
  return options.hadRowActions ? [...options.ids, ROW_ACTIONS_COLUMN_ID] : options.ids
}
