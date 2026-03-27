export function isSpreadsheetRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getSpreadsheetValueAtPath(data: Record<string, unknown>, path: string) {
  return path.split('.').reduce<unknown>((current, part) => {
    if (!isSpreadsheetRecord(current)) return undefined
    return current[part]
  }, data)
}

export function setSpreadsheetValueAtPath(
  target: Record<string, unknown>,
  path: string,
  value: unknown,
) {
  const parts = path.split('.')
  let current = target

  for (const [index, part] of parts.entries()) {
    const isLast = index === parts.length - 1
    if (isLast) {
      current[part] = value
      continue
    }

    const nextValue = current[part]
    if (isSpreadsheetRecord(nextValue)) {
      current = nextValue
      continue
    }

    const nextRecord: Record<string, unknown> = {}
    current[part] = nextRecord
    current = nextRecord
  }
}

export function getSpreadsheetObjectEntries(value: unknown) {
  if (!isSpreadsheetRecord(value)) return [] as Array<[string, unknown]>
  return Object.entries(value)
}

export function getSpreadsheetObjectKeys(value: unknown) {
  return getSpreadsheetObjectEntries(value).map(([key]) => key)
}

export function getSpreadsheetLeafPaths(value: unknown, prefix = ''): string[] {
  if (!isSpreadsheetRecord(value)) return prefix ? [prefix] : []

  const entries = getSpreadsheetObjectEntries(value)
  if (!entries.length) return prefix ? [prefix] : []

  return entries.flatMap(([key, entryValue]) => {
    const nextPath = prefix ? `${prefix}.${key}` : key
    if (isSpreadsheetRecord(entryValue))
      return getSpreadsheetLeafPaths(entryValue, nextPath)

    return [nextPath]
  })
}

export function cloneSpreadsheetRowData(data: Record<string, unknown>) {
  return structuredClone(data)
}
