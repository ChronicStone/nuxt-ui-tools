import { Mask } from 'maska'
import type { MaskOptions } from 'maska'

import { isString } from './predicate'

export type FormTextMask = string | MaskOptions

const masks = new WeakMap<MaskOptions, Mask>()
const stringMasks = new Map<string, Mask>()

export function resolveTextMask(mask: FormTextMask | undefined) {
  if (mask === undefined) {
    return
  }
  if (isString(mask)) {
    const existing = stringMasks.get(mask)
    if (existing) {
      return existing
    }
    const created = new Mask({ mask })
    stringMasks.set(mask, created)
    return created
  }
  const existing = masks.get(mask)
  if (existing) {
    return existing
  }
  const created = new Mask(mask)
  masks.set(mask, created)
  return created
}

export function applyTextMask(value: string, mask: FormTextMask | undefined) {
  return resolveTextMask(mask)?.masked(value) ?? value
}

export function stripTextMask(value: string, mask: FormTextMask | undefined) {
  return resolveTextMask(mask)?.unmasked(value) ?? value
}
