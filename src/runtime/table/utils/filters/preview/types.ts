export interface FilterPreviewEntry {
  label: string
  icon?: string
  color?: string
}

export interface FilterPreviewResult {
  active: boolean
  count: number
  tags: string[]
  entries: FilterPreviewEntry[]
  summary: string
}

export interface FilterPreviewOptionEntry {
  label: string
  value: string | number | boolean
  icon?: string
  color?: string
}
