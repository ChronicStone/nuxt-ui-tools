import { NestedPaths, Prettify, DeepOmit, DeepPick } from '@lib/types/utils'

export function omit<T extends Record<PropertyKey, any>, K extends NestedPaths<T>>(
  obj: T,
  keys: K[],
): Prettify<DeepOmit<T, K>> {
  const result = structuredClone(obj)

  for (const path of keys) {
    const parts = path.split('.')

    if (parts.length === 1) {
      delete result?.[parts?.[0] ?? '']
      continue
    }

    let current: any = result

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i] ?? ''

      if (current === undefined || current === null) break

      if (Array.isArray(current[part])) {
        const remainingPath = parts.slice(i + 1).join('.')
        const remainingParts = remainingPath.split('.')

        for (const item of current[part]) {
          if (item && typeof item === 'object') {
            let itemCurrent = item
            for (let j = 0; j < remainingParts.length - 1; j++) {
              if (itemCurrent === undefined || itemCurrent === null) break
              itemCurrent = itemCurrent[remainingParts[j] ?? '']
            }
            if (itemCurrent !== undefined && itemCurrent !== null) {
              delete itemCurrent[remainingParts[remainingParts.length - 1] ?? '']
            }
          }
        }
        break
      } else {
        current = current[part]
      }
    }

    if (current !== undefined && current !== null && !Array.isArray(result[parts[0] ?? ''])) {
      const lastPart = parts[parts.length - 1]
      delete current[lastPart ?? '']
    }
  }

  return result as Prettify<DeepOmit<T, K>>
}

export function pick<T extends Record<PropertyKey, any>, K extends NestedPaths<T>>(
  obj: T,
  keys: K[],
): Prettify<DeepPick<T, K>> {
  const result: any = {}

  for (const path of keys) {
    const parts = path.split('.')
    let current = obj
    let target = result

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i] ?? ''
      const isLast = i === parts.length - 1

      if (current === undefined || current === null) break

      if (isLast) {
        target[part] = current[part]
      } else {
        target[part] = target[part] || {}
        target = target[part]
        current = current[part]
      }
    }
  }

  return result as Prettify<DeepPick<T, K>>
}
