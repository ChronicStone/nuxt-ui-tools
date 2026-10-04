import { describe, expect, it } from 'vitest'

import {
  applyColumnPreferences,
  decodeColumnPreferences,
  encodeColumnPreferences,
} from '#ui-tools/table/utils/columns/preferences'
import { createDefaultColumnState } from '#ui-tools/table/utils/columns/state'
import type { TableColumnState } from '#ui-tools/table/utils/columns/types'

function defaults(): TableColumnState {
  return {
    columnOrder: ['name', 'email', 'city', 'score', '__row-actions'],
    columnPinning: { left: ['__select', 'name'], right: ['__row-actions'] },
    columnSizing: {},
    columnSizingInfo: createDefaultColumnState().columnSizingInfo,
    columnVisibility: { '__row-actions': true, city: true, email: true, name: true, score: false },
    sorting: [],
  }
}

function restore(value: string | null) {
  const preferences = decodeColumnPreferences(value)

  return preferences ? applyColumnPreferences({ preferences, state: defaults() }) : defaults()
}

describe('column preferences cookie', () => {
  it('stores nothing while a table keeps its defaults', () => {
    expect(encodeColumnPreferences({ defaults: defaults(), state: defaults() })).toBeNull()
  })

  it('keeps only the changes, in a few bytes, and restores them', () => {
    const state: TableColumnState = {
      ...defaults(),
      columnOrder: ['city', 'name', 'email', 'score', '__row-actions'],
      columnPinning: { left: ['__select'], right: ['score', '__row-actions'] },
      columnSizing: { name: 240.4 },
      columnVisibility: { ...defaults().columnVisibility, email: false, score: true },
    }
    const value = encodeColumnPreferences({ defaults: defaults(), state })

    expect(value).toBe('1!ocity~name~email~score!hemail!vscore!l!rscore!wname*240')
    expect(restore(value)).toEqual({ ...state, columnSizing: { name: 240 } })
  })

  it('escapes column ids that contain separators', () => {
    const state: TableColumnState = {
      ...defaults(),
      columnOrder: ['a~b!c*d', 'name', 'email', 'city', 'score', '__row-actions'],
      columnVisibility: { ...defaults().columnVisibility, 'a~b!c*d': true },
    }
    const value = encodeColumnPreferences({
      defaults: {
        ...defaults(),
        columnOrder: state.columnOrder,
        columnVisibility: state.columnVisibility,
      },
      state: { ...state, columnSizing: { 'a~b!c*d': 90 } },
    })

    expect(value).toBe('1!wa%7Eb%21c%2Ad*90')
    expect(decodeColumnPreferences(value)?.widths).toEqual({ 'a~b!c*d': 90 })
  })

  it('reads the former JSON cookie, keeping explicit hides and the current defaults', () => {
    const legacy = encodeURIComponent(
      JSON.stringify({
        order: ['email', 'name', 'city', 'score', '__row-actions'],
        pinning: { left: ['__select', 'name'], right: ['__row-actions'] },
        sizing: {},
        visibility: { '__row-actions': true, city: false, email: true, name: true, score: true },
      }),
    )
    const restored = restore(legacy)

    expect(restored.columnOrder.slice(0, 2)).toEqual(['email', 'name'])
    expect(restored.columnVisibility.city).toBe(false)
    expect(restored.columnVisibility.score).toBe(false)
    expect(encodeColumnPreferences({ defaults: defaults(), state: restored })).toBe(
      '1!oemail~name~city~score!hcity',
    )
  })

  it('ignores unknown versions and columns that no longer exist', () => {
    expect(decodeColumnPreferences('9!hname')).toBeNull()
    expect(decodeColumnPreferences('{broken')).toBeNull()
    expect(restore('1!hgone~city!ogone~score').columnVisibility).toEqual({
      ...defaults().columnVisibility,
      city: false,
    })
    expect(restore('1!ogone~score').columnOrder).toEqual([
      'score',
      'name',
      'email',
      'city',
      '__row-actions',
    ])
  })
})
