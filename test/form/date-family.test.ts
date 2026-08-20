import { CalendarDate, Time } from '@internationalized/date'
import { describe, expect, it } from 'vitest'

import {
  applyDateManualMask,
  calendarValueFromCanonical,
  defaultDateManualFormat,
  formatDateManualValue,
  parseDateManualValue,
  serializeCalendarValue,
  serializeTimeValue,
} from '../../src/runtime/form/fields/date-family/utils'

describe('date-family manual input', () => {
  it('uses the same locale-sensitive formats across date and datetime variants', () => {
    expect(defaultDateManualFormat('date', 'fr-FR')).toBe('dd/MM/yyyy')
    expect(defaultDateManualFormat('daterange', 'en-US')).toBe('MM/dd/yyyy')
    expect(defaultDateManualFormat('datetime', 'fr-FR')).toBe('dd/MM/yyyy HH:mm')
    expect(defaultDateManualFormat('monthrange', 'fr-FR')).toBe('MM/yyyy')
    expect(defaultDateManualFormat('year', 'fr-FR')).toBe('yyyy')
  })

  it('masks and parses a single date without changing its canonical value', () => {
    expect(applyDateManualMask('20082026', 'dd/MM/yyyy', false)).toBe('20/08/2026')
    expect(parseDateManualValue('20/08/2026', 'dd/MM/yyyy', 'date')).toBe('2026-08-20')
    expect(formatDateManualValue(['2026-08-20', ''], 'dd/MM/yyyy', 'date')).toBe('20/08/2026')
  })

  it('parses date ranges from one manual input and preserves ordering', () => {
    expect(applyDateManualMask('2008202625082026', 'dd/MM/yyyy', true)).toBe(
      '20/08/2026 – 25/08/2026',
    )
    expect(parseDateManualValue('20/08/2026 – 25/08/2026', 'dd/MM/yyyy', 'daterange')).toEqual([
      '2026-08-20',
      '2026-08-25',
    ])
    expect(
      parseDateManualValue('25/08/2026 – 20/08/2026', 'dd/MM/yyyy', 'daterange'),
    ).toBeUndefined()
  })

  it('supports datetime, month, month-range, and year manual formats', () => {
    expect(parseDateManualValue('20/08/2026 14:35', 'dd/MM/yyyy HH:mm', 'datetime')).toBe(
      '2026-08-20T14:35',
    )
    expect(parseDateManualValue('08/2026', 'MM/yyyy', 'month')).toBe('2026-08')
    expect(parseDateManualValue('08/2026 – 11/2026', 'MM/yyyy', 'monthrange')).toEqual([
      '2026-08',
      '2026-11',
    ])
    expect(parseDateManualValue('2031', 'yyyy', 'year')).toBe('2031')
  })

  it('rejects impossible dates and invalid times instead of normalizing them', () => {
    expect(parseDateManualValue('31/02/2026', 'dd/MM/yyyy', 'date')).toBeUndefined()
    expect(parseDateManualValue('20/08/2026 25:00', 'dd/MM/yyyy HH:mm', 'datetime')).toBeUndefined()
  })
})

describe('date-family calendar serialization', () => {
  it('serializes native calendar month and year selections directly', () => {
    expect(serializeCalendarValue('month', new CalendarDate(2026, 8, 1), '')).toBe('2026-08')
    expect(serializeCalendarValue('year', new CalendarDate(2032, 1, 1), '')).toBe('2032')
  })

  it('preserves datetime time when only the calendar date changes', () => {
    expect(
      serializeCalendarValue('datetime', new CalendarDate(2026, 8, 22), '2026-08-20T14:35'),
    ).toBe('2026-08-22T14:35')
  })

  it('defaults a newly calendar-selected datetime to 09:00 and lets time editing replace it', () => {
    const selected = serializeCalendarValue('datetime', new CalendarDate(2026, 8, 22), '')
    expect(selected).toBe('2026-08-22T09:00')
    expect(serializeTimeValue(selected, new Time(17, 45))).toBe('2026-08-22T17:45')
  })

  it('coerces canonical values back into Nuxt Calendar values', () => {
    expect(calendarValueFromCanonical('date', '2026-08-20')?.toString()).toBe('2026-08-20')
    expect(calendarValueFromCanonical('month', '2026-08')?.toString()).toBe('2026-08-01')
    expect(calendarValueFromCanonical('year', '2030')?.toString()).toBe('2030-01-01')
  })
})
