export interface FilterPreviewResult {
  active: boolean
  count: number
  tags: string[]
  summary: string
}

export interface FilterPreviewOptionEntry {
  label: string
  value: string | number | boolean
}
