import { buildIcon, getIcon } from '@iconify/vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useAppConfig, useNuxtApp } from 'nuxt/app'
import { h } from 'vue'
import type { VNode } from 'vue'

import type { FormObject, FormValue } from '../../../types'
import { isRecord } from '../../../utils/path'
import {
  invokeFormFunction,
  isFunction,
  isNumber,
  isString,
  stringArray,
} from '../../../utils/predicate'

interface InertSvg {
  attributes: FormObject
  body: string
}

const SVG_DEFAULTS = {
  'aria-hidden': 'true',
  role: 'img',
  xmlns: 'http://www.w3.org/2000/svg',
  'xmlns:xlink': 'http://www.w3.org/1999/xlink',
}

/**
 * Renders icons for inert cells. With `@nuxt/icon` in SVG mode, an icon component per cell costs
 * more than the rest of the cell, so an icon whose data is already loaded renders as the same
 * `<svg>` the icon component produces, built once per icon. Other icons, and every icon in CSS
 * mode where the icon component stays cheap, render through `UIcon`.
 */
export function createInertIcons() {
  const nuxtApp = useNuxtApp()
  const options = readIconOptions(useAppConfig().icon)
  const svgs = new Map<string, InertSvg>()

  function render(name: string, props: { class: string; slot: string }): VNode {
    const fallback = () => h(UIcon, { class: props.class, 'data-slot': props.slot, name })
    if (options.mode !== 'svg') {
      return fallback()
    }
    const resolved = resolveIconName(name, options)
    if (nuxtApp.vueApp?.component(resolved)) {
      return fallback()
    }
    const svg = svgs.get(resolved) ?? buildSvg(resolved, options.customize)
    if (!svg) {
      return fallback()
    }
    svgs.set(resolved, svg)
    return h('svg', {
      ...SVG_DEFAULTS,
      ...options.attrs,
      ...svg.attributes,
      class: [options.class, props.class],
      'data-slot': props.slot,
      innerHTML: svg.body,
      style: options.size ? { fontSize: options.size } : undefined,
    })
  }

  return { render }
}

export type InertIcons = ReturnType<typeof createInertIcons>

interface IconOptions {
  mode: string | undefined
  cssSelectorPrefix: string
  aliases: Readonly<Record<string, string>>
  collections: readonly string[]
  class: string | undefined
  attrs: FormObject
  size: string | undefined
  customize: ((content: string, name: string, prefix: string) => string) | undefined
}

function readIconOptions(value: FormValue): IconOptions {
  const icon = isRecord(value) ? value : {}
  const aliases: Record<string, string> = {}
  if (isRecord(icon.aliases)) {
    for (const [alias, target] of Object.entries(icon.aliases)) {
      if (isString(target)) {
        aliases[alias] = target
      }
    }
  }
  const size = isNumber(icon.size) || isString(icon.size) ? String(icon.size) : undefined
  const customize = icon.customize
  return {
    aliases,
    attrs: isRecord(icon.attrs) ? icon.attrs : {},
    class: isString(icon.class) ? icon.class : undefined,
    collections: [...stringArray(icon.collections)].sort((a, b) => b.length - a.length),
    cssSelectorPrefix: isString(icon.cssSelectorPrefix) ? icon.cssSelectorPrefix : 'i-',
    customize: isFunction(customize)
      ? (content, name, prefix) => {
          const result = invokeFormFunction(customize, [content, name, prefix])
          return isString(result) ? result : content
        }
      : undefined,
    mode: isString(icon.mode) ? icon.mode : undefined,
    size: size && !Number.isNaN(Number(size)) ? `${size}px` : size,
  }
}

/** Resolves an icon name the way `@nuxt/icon` does: prefix, aliases, then the collection. */
function resolveIconName(name: string, options: IconOptions) {
  const bare = name.startsWith(options.cssSelectorPrefix)
    ? name.slice(options.cssSelectorPrefix.length)
    : name
  const resolved = options.aliases[bare] ?? bare
  if (resolved.includes(':')) {
    return resolved
  }
  const collection = options.collections.find((entry) => resolved.startsWith(`${entry}-`))
  return collection ? `${collection}:${resolved.slice(collection.length + 1)}` : resolved
}

/**
 * Builds the attributes and markup of an icon from its loaded data, as Iconify renders it. An
 * icon whose markup carries ids gets unique ids from each Iconify render, so it is left to `UIcon`.
 */
function buildSvg(name: string, customize: IconOptions['customize']): InertSvg | undefined {
  const data = getIcon(name)
  if (!data) {
    return
  }
  const [prefix = ''] = name.split(':')
  const body = customize ? customize(data.body, name, prefix) : data.body
  if (body.includes('id=')) {
    return
  }
  const svg = buildIcon({ ...data, body })
  return { attributes: svg.attributes, body: svg.body }
}
