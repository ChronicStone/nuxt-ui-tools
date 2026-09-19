export function must<T>(value: T | null | undefined, label = 'value'): T {
  if (value === null || value === undefined) {
    throw new Error(`Expected ${label} to be present`)
  }
  return value
}
