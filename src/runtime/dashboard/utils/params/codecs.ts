import type { QueryCodec } from '../../../query-state'
import { isNullish } from '../../../shared/utils/predicate'
import type { DashboardDateRange, DashboardOptionValue } from '../../types'

export const optionalStringCodec: QueryCodec<string | undefined> = {
  parse: (raw) => (raw === '' ? undefined : raw),
  serialize: (value) => (isNullish(value) || value === '' ? null : value),
}

export const optionalNumberCodec: QueryCodec<number | undefined> = {
  parse(raw) {
    const value = Number(raw)
    return raw === '' || Number.isNaN(value) ? undefined : value
  },
  serialize: (value) => (isNullish(value) ? null : String(value)),
}

export const optionalBooleanCodec: QueryCodec<boolean | undefined> = {
  parse: (raw) => (raw === 'true' ? true : raw === 'false' ? false : undefined),
  serialize: (value) => (isNullish(value) ? null : String(value)),
}

/** Calendar date, serialized as local `YYYY-MM-DD` so it never shifts across time zones. */
export const localDateCodec: QueryCodec<Date | undefined> = {
  parse: parseLocalDate,
  serialize: (value) => (isNullish(value) ? null : formatLocalDate(value)),
}

export const dateRangeCodec: QueryCodec<DashboardDateRange | undefined> = {
  parse(raw) {
    const [start, end] = raw.split('..').map(parseLocalDate)
    return start && end ? { end, start } : undefined
  },
  serialize: (value) =>
    isNullish(value) ? null : `${formatLocalDate(value.start)}..${formatLocalDate(value.end)}`,
}

/** Single value from a fixed list of strings or numbers. Unknown raw values parse to `undefined`. */
export function createOptionValueCodec(
  values: readonly DashboardOptionValue[],
): QueryCodec<DashboardOptionValue | undefined> {
  const byRaw = new Map(values.map((value) => [String(value), value]))
  return {
    parse: (raw) => byRaw.get(raw),
    serialize: (value) => (isNullish(value) || !byRaw.has(String(value)) ? null : String(value)),
  }
}

/** Comma-separated list over an item codec. Invalid items are dropped; empty lists leave the URL. */
export function createListCodec<TItem>(
  itemCodec: QueryCodec<TItem | undefined>,
): QueryCodec<TItem[] | undefined> {
  return {
    parse(raw) {
      if (raw === '') return []
      return raw
        .split(',')
        .map((part) => itemCodec.parse(part))
        .filter((item): item is TItem => item !== undefined)
    },
    serialize(value) {
      if (isNullish(value) || value.length === 0) return null
      return value
        .map((item) => itemCodec.serialize(item))
        .filter((item): item is string => item !== null)
        .join(',')
    },
  }
}

/** Wraps a consumer codec so parse failures fall back to the default instead of throwing. */
export function createSafeCodec<TValue>(codec: QueryCodec<TValue>): QueryCodec<TValue | undefined> {
  return {
    parse(raw) {
      try {
        return codec.parse(raw)
      } catch {
        return undefined
      }
    },
    serialize: (value) => (value === undefined ? null : codec.serialize(value)),
  }
}

function parseLocalDate(raw: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(raw)
  if (!match) return undefined
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? undefined : date
}

function formatLocalDate(value: Date) {
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${value.getFullYear()}-${month}-${day}`
}
