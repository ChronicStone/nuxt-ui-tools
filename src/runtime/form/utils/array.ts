import type { FormObject } from '../types'
import { cloneFormValue, isRecord } from './path'

export function syncFormArrayItems(target: unknown, source: readonly FormObject[]) {
  if (!Array.isArray(target)) return false

  const snapshots = source.map((item) => {
    const cloned = cloneFormValue(item)
    return isRecord(cloned) ? cloned : {}
  })

  for (const [index, snapshot] of snapshots.entries()) {
    const current = target[index]
    if (!isRecord(current)) {
      target[index] = snapshot
      continue
    }

    for (const key of Object.keys(current)) if (!(key in snapshot)) delete current[key]
    for (const [key, value] of Object.entries(snapshot)) current[key] = value
  }

  target.splice(snapshots.length)
  return true
}
