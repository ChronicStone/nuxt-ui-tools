import type { SpreadsheetValue } from '../../types'

export function normalizeSpreadsheetReferenceText(value: SpreadsheetValue) {
  return String(value ?? '')
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036F]/g, '')
    .trim()
    .replaceAll(/\s+/g, ' ')
    .toLowerCase()
}

export function scoreSpreadsheetReferenceCandidate(sourceValue: string, label: string) {
  const normalizedSource = normalizeSpreadsheetReferenceText(sourceValue)
  const normalizedLabel = normalizeSpreadsheetReferenceText(label)

  if (!normalizedSource || !normalizedLabel) {
    return 0
  }
  if (normalizedSource === normalizedLabel) {
    return 1
  }
  if (normalizedLabel.includes(normalizedSource)) {
    return 0.9
  }
  if (normalizedSource.includes(normalizedLabel)) {
    return 0.82
  }

  const sourceTokens = normalizedSource.split(' ')
  const labelTokens = normalizedLabel.split(' ')
  const overlap = sourceTokens.filter((token) => labelTokens.includes(token)).length
  if (!overlap) {
    return 0
  }

  return overlap / Math.max(sourceTokens.length, labelTokens.length)
}
