import type { DisplayToneColors, DisplayToneDefinition, DisplayUiConfig } from '../types'
import { isBuiltinTone } from './tone'

const TONE_NAME = /^[a-z][a-z0-9-]*$/u
const UNSAFE_VALUE = /[{}<>;]/u

/**
 * The stylesheet of the tones an app registers or restyles: their `--nut-display-<tone>*`
 * variables (light, then `.dark`) and, for new tones, the class that points `--nut-tone*` at them.
 * Names other than lowercase words and values that could leave the declaration are skipped.
 */
export function buildDisplayToneCss(tones: DisplayUiConfig['tones']) {
  const light: string[] = []
  const dark: string[] = []
  const classes: string[] = []
  for (const [name, definition] of Object.entries(tones ?? {})) {
    if (!definition || !TONE_NAME.test(name)) continue
    const builtin = isBuiltinTone(name)
    if (!builtin && !definition.color) continue
    light.push(...declarations(name, definition, !builtin))
    if (definition.dark) dark.push(...declarations(name, definition.dark, false))
    if (!builtin) classes.push(toneClassRule(name))
  }
  return [
    light.length ? `:root{${light.join(';')}}` : '',
    dark.length ? `.dark{${dark.join(';')}}` : '',
    ...classes,
  ]
    .filter(Boolean)
    .join('\n')
}

function declarations(
  name: string,
  colors: DisplayToneColors | DisplayToneDefinition,
  fill: boolean,
) {
  const mix = (share: number) =>
    fill && colors.color
      ? `color-mix(in oklab, ${colors.color} ${share}%, var(--ui-bg))`
      : undefined
  const entries = [
    ['', colors.color],
    ['-ink', colors.ink ?? (fill ? colors.color : undefined)],
    ['-soft', colors.soft ?? mix(12)],
    ['-line', colors.line ?? mix(40)],
    ['-contrast', colors.contrast ?? (fill ? 'var(--ui-text-inverted)' : undefined)],
  ] as const
  return entries.flatMap(([part, value]) =>
    value && !UNSAFE_VALUE.test(value) ? [`--nut-display-${name}${part}:${value}`] : [],
  )
}

function toneClassRule(name: string) {
  const variable = (part: string) => `var(--nut-display-${name}${part ? `-${part}` : ''})`
  return `:where(.nut-display-tone-${name}){--nut-tone:${variable('')};--nut-tone-ink:${variable('ink')};--nut-tone-soft:${variable('soft')};--nut-tone-line:${variable('line')};--nut-tone-contrast:${variable('contrast')}}`
}
