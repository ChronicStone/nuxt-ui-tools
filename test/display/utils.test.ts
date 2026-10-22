import { describe, expect, it } from 'vitest'

import { applyDisplayPreset } from '#ui-tools/display/utils/config'
import {
  calendarDaysBetween,
  formatDayCount,
  formatRelativeDays,
  toDisplayDate,
} from '#ui-tools/display/utils/dates'
import { tokenizeJson } from '#ui-tools/display/utils/json'
import { meterShare, meterTone } from '#ui-tools/display/utils/meter'
import {
  displayToneClass,
  initialsOf,
  isBuiltinTone,
  toneFromName,
} from '#ui-tools/display/utils/tone'
import { buildDisplayToneCss } from '#ui-tools/display/utils/tone-css'
import { resolveFormDynamic } from '#ui-tools/form/utils/dynamic'

describe('display dates', () => {
  it('parses dates and counts calendar days whatever the time of day', () => {
    expect(toDisplayDate('not a date')).toBeNull()
    expect(toDisplayDate(undefined)).toBeNull()
    const from = new Date(2026, 9, 22, 23, 30)
    const to = new Date(2026, 9, 24, 0, 15)
    expect(calendarDaysBetween(from, to)).toBe(2)
    expect(calendarDaysBetween(to, from)).toBe(-2)
  })

  it('words relative days and day counts in the locale', () => {
    expect(formatRelativeDays(1, 'en')).toBe('Tomorrow')
    expect(formatRelativeDays(3, 'en')).toBe('In 3 days')
    expect(formatRelativeDays(-2, 'fr')).toBe('Avant-hier')
    // Intl separates the number with a narrow no-break space.
    expect(formatDayCount(31, 'fr')).toMatch(/^31\sjours$/u)
  })
})

describe('display meter', () => {
  it('clamps the filled share and switches tone at the thresholds', () => {
    expect(meterShare(150, 100)).toBe(1)
    expect(meterShare(5, 0)).toBe(0)
    expect(meterTone(0.5, undefined, { error: 90, warning: 70 })).toBe('primary')
    expect(meterTone(0.7, 'info', { error: 90, warning: 70 })).toBe('warning')
    expect(meterTone(0.95, 'info', { error: 90, warning: 70 })).toBe('error')
  })
})

describe('display json tokens', () => {
  it('tells keys from string values, numbers and literals', () => {
    const tokens = tokenizeJson('{"score": 845, "level": "B2", "ok": true}')
    expect(tokens.filter((token) => token.kind === 'key').map((token) => token.text)).toEqual([
      '"score"',
      '"level"',
      '"ok"',
    ])
    expect(tokens.find((token) => token.kind === 'number')?.text).toBe('845')
    expect(tokens.find((token) => token.kind === 'string')?.text).toBe('"B2"')
    expect(tokens.find((token) => token.kind === 'literal')?.text).toBe('true')
    expect(tokens.map((token) => token.text).join('')).toBe(
      '{"score": 845, "level": "B2", "ok": true}',
    )
  })
})

describe('display tones', () => {
  it('names tone classes and recognizes the built-in tones', () => {
    expect(displayToneClass('warning')).toBe('nut-display-tone-warning')
    expect(isBuiltinTone('error')).toBe(true)
    expect(isBuiltinTone('violet')).toBe(false)
  })

  it('picks a stable tone and initials for a name', () => {
    expect(toneFromName('Camille Laurent')).toBe(toneFromName('Camille Laurent'))
    expect(initialsOf('Camille Laurent')).toBe('CL')
    expect(initialsOf('  ada  ')).toBe('A')
    expect(initialsOf('Jean Paul Sartre')).toBe('JS')
  })

  it('builds variables for a new tone with its class, and overrides only what a built-in tone sets', () => {
    const css = buildDisplayToneCss({
      primary: { dark: { ink: '#ffb558' }, ink: '#b85e00' },
      violet: { color: 'var(--color-violet-500)' },
    })
    expect(css).toContain('--nut-display-violet:var(--color-violet-500)')
    expect(css).toContain('--nut-display-violet-ink:var(--color-violet-500)')
    expect(css).toContain(
      '--nut-display-violet-soft:color-mix(in oklab, var(--color-violet-500) 12%, var(--ui-bg))',
    )
    expect(css).toContain(':where(.nut-display-tone-violet){--nut-tone:var(--nut-display-violet)')
    expect(css).toContain('--nut-display-primary-ink:#b85e00')
    expect(css).not.toContain('--nut-display-primary:')
    expect(css).not.toContain('.nut-display-tone-primary')
    expect(css).toContain('.dark{--nut-display-primary-ink:#ffb558}')
  })

  it('skips tone names and values that could leave their declaration', () => {
    const css = buildDisplayToneCss({
      primary: { ink: 'red;} body{display:none' },
      // @ts-expect-error unregistered names are rejected at type level too
      'Bad Name': { color: 'red' },
    })
    expect(css).toBe('')
  })
})

describe('display presets', () => {
  it('lays the given props over the preset of the kind', () => {
    const config = {
      presets: { text: { legal: { appearance: 'legal' as const, icon: 'i-lucide-shield' } } },
    }
    expect(
      applyDisplayPreset('text', { icon: 'i-lucide-scale', text: 'Hi' }, 'legal', config),
    ).toEqual({
      appearance: 'legal',
      icon: 'i-lucide-scale',
      text: 'Hi',
    })
    expect(applyDisplayPreset('text', { text: 'Hi' }, 'unknown', config)).toEqual({ text: 'Hi' })
  })
})

describe('form dynamic values', () => {
  it('calls a callback with the params and returns a value as is', () => {
    expect(resolveFormDynamic(({ seats }: { seats: number }) => seats * 2, { seats: 3 })).toBe(6)
    expect(resolveFormDynamic<number, { seats: number }>(4, { seats: 3 })).toBe(4)
  })
})
