import type { FormText } from '../types'

export function resolveFormText(text: FormText | undefined) {
  if (typeof text === 'function') return String(text())
  if (typeof text === 'number') return String(text)
  return text
}
