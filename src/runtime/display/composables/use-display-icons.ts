import { useAppConfig } from 'nuxt/app'
import { computed } from 'vue'

import { isPlainObject, isString } from '../../shared/utils/predicate'
import type { DisplayTone } from '../types'

const ICON_NAMES = [
  'arrowDown',
  'arrowRight',
  'arrowUp',
  'check',
  'chevronDown',
  'chevronRight',
  'copy',
  'copyCheck',
  'empty',
  'error',
  'external',
  'eye',
  'eyeOff',
  'file',
  'info',
  'minus',
  'success',
  'warning',
] as const

type DisplayIconName = (typeof ICON_NAMES)[number]

const DEFAULT_ICONS: Record<DisplayIconName, string> = {
  arrowDown: 'i-lucide-arrow-down',
  arrowRight: 'i-lucide-arrow-right',
  arrowUp: 'i-lucide-arrow-up',
  check: 'i-lucide-check',
  chevronDown: 'i-lucide-chevron-down',
  chevronRight: 'i-lucide-chevron-right',
  copy: 'i-lucide-copy',
  copyCheck: 'i-lucide-copy-check',
  empty: 'i-lucide-inbox',
  error: 'i-lucide-circle-x',
  external: 'i-lucide-arrow-up-right',
  eye: 'i-lucide-eye',
  eyeOff: 'i-lucide-eye-off',
  file: 'i-lucide-file',
  info: 'i-lucide-info',
  minus: 'i-lucide-minus',
  success: 'i-lucide-circle-check',
  warning: 'i-lucide-triangle-alert',
}

/** Icons of the blocks: `appConfig.ui.icons` when the app sets them, Lucide otherwise. */
export function useDisplayIcons() {
  const appConfig = useAppConfig()
  return computed<Record<DisplayIconName, string>>(() => {
    const ui = Object.getOwnPropertyDescriptor(appConfig, 'ui')?.value
    const icons = isPlainObject(ui) && isPlainObject(ui.icons) ? ui.icons : undefined
    const resolved = { ...DEFAULT_ICONS }
    for (const key of ICON_NAMES) {
      const icon = icons?.[key]
      if (isString(icon)) resolved[key] = icon
    }
    return resolved
  })
}

/** Icon of a tone in alerts and statuses. */
export function toneIcon(icons: Record<DisplayIconName, string>, tone: DisplayTone) {
  if (tone === 'success') return icons.success
  if (tone === 'warning') return icons.warning
  if (tone === 'error') return icons.error
  return icons.info
}
