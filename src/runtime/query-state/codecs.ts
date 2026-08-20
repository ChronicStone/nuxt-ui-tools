/**
 * Serializes and parses a single query-string value.
 *
 * Query-state composables always store raw URL values as strings. A codec is
 * the boundary that turns those strings into typed values for the app and back
 * into URL-safe strings when writing.
 */
export interface QueryCodec<T> {
  /** Parse a raw query-string value into the typed runtime value. */
  parse: (raw: string) => T
  /**
   * Serialize a typed value for the URL.
   *
   * Return `null` when the value should be omitted from the query string.
   */
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

/**
 * Creates a codec that only accepts values from a fixed string union.
 *
 * Invalid incoming query values parse to `undefined`, which lets
 * `useQueryState(...)` and `useQueryStates(...)` fall back to their defaults.
 *
 * @example
 * ```ts
 * const layoutCodec = createEnumCodec(['grid', 'table'])
 * ```
 */
export function createEnumCodec<const T extends readonly string[]>(
  values: T,
): QueryCodec<T[number] | undefined> {
  const set = new Set<string>(values)
  return {
    parse(raw) {
      if (set.has(raw)) {
        // SAFETY: the set was created from `values`, so a present raw value is one of T[number].
        return raw as T[number]
      }
      return undefined
    },
    serialize(value) {
      if (value != null && set.has(value)) return value
      return null
    },
  }
}

/**
 * Creates a codec for separator-delimited lists, such as `"a,b,c"`.
 *
 * Empty input parses to an empty array and empty arrays serialize to `null`, so
 * default query-state behavior removes the key from the URL.
 *
 * @example
 * ```ts
 * const tagsCodec = createArrayCodec(stringCodec)
 * ```
 */
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
