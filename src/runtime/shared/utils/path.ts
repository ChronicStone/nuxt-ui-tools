import type { GenericObject } from '../types/utils'

export function pathSegments(path: string | readonly string[]) {
  const rawSegments = typeof path === 'string' ? path.split('.') : path
  return rawSegments.flatMap((segment: string) => segment.split('.')).filter(Boolean)
}

export function getPathValue(source: unknown, path: string | readonly string[]) {
  return pathSegments(path).reduce<unknown>((current: unknown, segment: string) => {
    if (!isPathContainer(current)) return undefined
    return getContainerValue(current, segment)
  }, source)
}

export function relativePathSegments(parentPath: readonly string[], key = '') {
  const offset = scopedPathOffset(key)
  const parentSegments = parentPath.flatMap((segment) => segment.split('.')).filter(Boolean)

  return [
    ...parentSegments.filter((_segment, index) => index < parentSegments.length - offset),
    ...key.split('.').slice(1),
  ]
    .flatMap((segment) => segment.split('.'))
    .filter(Boolean)
}

export function getScopedPathValue(
  source: GenericObject,
  key: string,
  parentPath: readonly string[],
) {
  if (key === '$root') return source
  if (key.includes('$parent')) return getPathValue(source, relativePathSegments(parentPath, key))
  return getPathValue(source, key)
}

export function setPathValue(
  target: GenericObject,
  path: string | readonly string[],
  value: unknown,
) {
  const segments = pathSegments(path)
  let current: PathContainer = target

  segments.forEach((segment: string, index: number) => {
    if (index === segments.length - 1) {
      setContainerValue(current, segment, value)
      return
    }

    const child = getContainerValue(current, segment)
    if (isPathContainer(child)) {
      current = child
      return
    }

    const next = shouldCreateArray(segments[index + 1]) ? [] : {}
    setContainerValue(current, segment, next)
    current = next
  })
}

export function cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => cloneValue(item))
  if (!isRecord(value)) return value

  const output: GenericObject = {}
  for (const [key, child] of Object.entries(value)) output[key] = cloneValue(child)

  return output
}

export function mergeObjects(target: GenericObject, source: GenericObject) {
  for (const [key, value] of Object.entries(source)) {
    if (isRecord(value) && isRecord(target[key])) {
      mergeObjects(target[key], value)
      continue
    }

    target[key] = cloneValue(value)
  }
}

export function isRecord(value: unknown): value is GenericObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

type PathContainer = GenericObject | unknown[]

function isPathContainer(value: unknown): value is PathContainer {
  return isRecord(value) || Array.isArray(value)
}

function getContainerValue(container: PathContainer, segment: string) {
  if (Array.isArray(container)) return container[Number(segment)]
  return container[segment]
}

function setContainerValue(container: PathContainer, segment: string, value: unknown) {
  if (Array.isArray(container)) {
    container[Number(segment)] = value
    return
  }

  container[segment] = value
}

function shouldCreateArray(segment: string | undefined) {
  return typeof segment === 'string' && /^\d+$/.test(segment)
}

function scopedPathOffset(key: string) {
  const firstSegment = key.split('.')[0]
  const offset = firstSegment?.split(':').pop()
  return offset && Number.isFinite(Number(offset)) ? Number(offset) : 0
}
