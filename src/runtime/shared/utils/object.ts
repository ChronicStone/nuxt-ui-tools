import type { DeepOmit, DeepPick, GenericObject, NestedPaths, Prettify } from '../types/utils'
import { isObject } from './predicate'

export function omit<T extends GenericObject, K extends NestedPaths<T>>(
  obj: T,
  keys: K[],
): Prettify<DeepOmit<T, K>> {
  const result = structuredClone(obj)

  for (const path of keys) {
    const parts = path.split('.')

    if (parts.length === 1) {
      delete result[parts[0] ?? '']
      continue
    }

    let current: GenericObject = result

    for (let index = 0; index < parts.length - 1; index++) {
      const part = parts[index] ?? ''
      const child = current[part]

      if (Array.isArray(child)) {
        const remainingParts = parts.slice(index + 1)
        for (const item of child) {
          if (!isObject(item)) continue
          let itemCurrent: GenericObject = item
          for (const remainingPart of remainingParts.slice(0, -1)) {
            const nested = itemCurrent[remainingPart]
            if (!isObject(nested)) break
            itemCurrent = nested
          }
          const lastPart = remainingParts.at(-1)
          if (lastPart !== undefined) delete itemCurrent[lastPart]
        }
        break
      }

      if (!isObject(child)) break
      current = child
    }

    const firstPart = parts[0]
    const lastPart = parts.at(-1)
    if (
      firstPart !== undefined &&
      lastPart !== undefined &&
      !Array.isArray(result[firstPart])
    )
      delete current[lastPart]
  }

  // SAFETY: `result` is a structured clone of `obj`; omit only removes paths permitted by `K`.
  return result as Prettify<DeepOmit<T, K>>
}

export function pick<T extends GenericObject, K extends NestedPaths<T>>(
  obj: T,
  keys: K[],
): Prettify<DeepPick<T, K>> {
  const result: GenericObject = {}

  for (const path of keys) {
    const parts = path.split('.')
    let current: GenericObject = obj
    let target = result

    for (let index = 0; index < parts.length; index++) {
      const part = parts[index]
      if (part === undefined) continue
      const isLast = index === parts.length - 1

      if (isLast) {
        target[part] = current[part]
        continue
      }

      const nextTarget = isObject(target[part]) ? target[part] : {}
      target[part] = nextTarget
      target = nextTarget

      const nextCurrent = current[part]
      if (!isObject(nextCurrent)) break
      current = nextCurrent
    }
  }

  // SAFETY: each selected path is constrained by `NestedPaths<T>` and is copied from `obj`.
  return result as Prettify<DeepPick<T, K>>
}

type ObjectPropertyValue = GenericObject[string]

export function getObjectProperty<T>(source: T, path: string): ObjectPropertyValue | undefined {
  return path.split('.').reduce<ObjectPropertyValue | undefined>((current, segment) => {
    if (!isObject(current)) return undefined
    return current[segment]
  }, isObject(source) ? source : undefined)
}
