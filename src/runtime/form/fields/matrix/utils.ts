import type { FormMatrixEntry, FormMatrixRow, FormMatrixSection } from './types'

export function isMatrixSection(entry: FormMatrixEntry): entry is FormMatrixSection {
  return 'type' in entry && entry.type === 'section'
}

/**
 * Splits matrix entries into table bodies: each section opens a group, and rows placed before
 * the first section form a group without a header.
 */
export function groupMatrixEntries(entries: readonly FormMatrixEntry[]) {
  const groups: { section: FormMatrixSection | null; rows: FormMatrixRow[] }[] = []

  for (const entry of entries) {
    if (isMatrixSection(entry)) {
      groups.push({ section: entry, rows: [] })
      continue
    }

    const current = groups.at(-1)

    if (current) {
      current.rows.push(entry)
    } else {
      groups.push({ section: null, rows: [entry] })
    }
  }

  return groups
}
