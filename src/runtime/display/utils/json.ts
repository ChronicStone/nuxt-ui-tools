export type JsonTokenKind = 'key' | 'string' | 'number' | 'literal' | 'punctuation' | 'space'

export interface JsonToken {
  kind: JsonTokenKind
  text: string
}

const TOKEN =
  /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],:])|(\s+)|(.)/gu

/** Splits JSON text into tokens for highlighting; unknown characters pass through as punctuation. */
export function tokenizeJson(source: string): JsonToken[] {
  const tokens: JsonToken[] = []
  for (const match of source.matchAll(TOKEN)) {
    const [, text, colon, number, literal, punctuation, space, other] = match
    if (text !== undefined) {
      tokens.push({ kind: colon ? 'key' : 'string', text })
      if (colon) tokens.push({ kind: 'punctuation', text: colon })
    } else if (number !== undefined) tokens.push({ kind: 'number', text: number })
    else if (literal !== undefined) tokens.push({ kind: 'literal', text: literal })
    else if (space !== undefined) tokens.push({ kind: 'space', text: space })
    else tokens.push({ kind: 'punctuation', text: punctuation ?? other ?? '' })
  }
  return tokens
}
