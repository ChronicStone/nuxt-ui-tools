/**
 * Codecs for serializing/deserializing query parameter values.
 * Zero-dependency implementations.
 */

export interface QueryCodec<T> {
  parse: (raw: string) => T
  serialize: (value: T) => string | null
}

// ---------------------------------------------------------------------------
// Primitive codecs
// ---------------------------------------------------------------------------

export const stringCodec: QueryCodec<string> = {
  parse: (raw) => raw,
  serialize: (value) => value,
}

export const numberCodec: QueryCodec<number> = {
  parse: (raw) => Number(raw),
  serialize: (value) => String(value),
}

export const booleanCodec: QueryCodec<boolean> = {
  parse: (raw) => raw === 'true',
  serialize: (value) => (value ? 'true' : 'false'),
}

export const dateISOCodec: QueryCodec<Date> = {
  parse: (raw) => new Date(raw),
  serialize: (value) => value.toISOString(),
}

// ---------------------------------------------------------------------------
// Codec factories
// ---------------------------------------------------------------------------

export function createEnumCodec<const T extends readonly string[]>(
  values: T,
): QueryCodec<T[number] | undefined> {
  const set = new Set<string>(values)
  return {
    parse(raw) {
      if (set.has(raw)) return raw as T[number]
      return undefined
    },
    serialize(value) {
      if (value != null && set.has(value)) return value
      return null
    },
  }
}

export function createArrayCodec<T>(itemCodec: QueryCodec<T>, separator = ','): QueryCodec<T[]> {
  return {
    parse(raw) {
      if (!raw) return []
      return raw.split(separator).map((part) => itemCodec.parse(part))
    },
    serialize(value) {
      if (!value.length) return null
      return value
        .map((item) => itemCodec.serialize(item))
        .filter(Boolean)
        .join(separator)
    },
  }
}
