/** Reads the number being typed in a number field, which only commits its own value on blur. */
export function parseTypedNumber(params: { text: string; locale: string }) {
  const parts = new Intl.NumberFormat(params.locale).formatToParts(-1234.5)
  const group = parts.find((part) => part.type === 'group')?.value
  const decimal = parts.find((part) => part.type === 'decimal')?.value ?? '.'
  const normalized = (group ? params.text.replaceAll(group, '') : params.text)
    .replaceAll(/\s/gu, '')
    .replace(decimal, '.')
    .replaceAll(/[^\d.-]/gu, '')

  if (!/\d/u.test(normalized)) {
    return undefined
  }

  const value = Number(normalized)
  return Number.isFinite(value) ? value : undefined
}
