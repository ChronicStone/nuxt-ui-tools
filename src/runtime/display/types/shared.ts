import type { AvatarProps } from '@nuxt/ui/components/Avatar.vue'
import type { BadgeProps } from '@nuxt/ui/components/Badge.vue'
import type { ButtonProps } from '@nuxt/ui/components/Button.vue'

import type { LazyRenderableValue, LazyTextValue, MaybePromise } from '../../shared/types/utils'

/** Tones every app has: the Nuxt UI colors. */
export type DisplayBuiltinTone =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warning'
  | 'error'
  | 'neutral'

/**
 * Extra tones an app registers in `appConfig.nuxtUiTools.display.tones`. Augment it so those
 * names type-check wherever a tone is accepted:
 *
 * @example
 * ```ts
 * declare module '#ui-tools/display' {
 *   interface DisplayToneRegistry {
 *     violet: true
 *     teal: true
 *   }
 * }
 * ```
 */
// oxlint-disable-next-line typescript/no-empty-interface -- augmented by apps
export interface DisplayToneRegistry {}

/**
 * Color role of a block or one of its parts: a built-in tone or a registered one. Each tone reads
 * the `--nut-display-<tone>`, `-ink`, `-soft`, `-line` and `-contrast` variables, so an app
 * restyles a tone in CSS.
 */
export type DisplayTone = DisplayBuiltinTone | Extract<keyof DisplayToneRegistry, string>

/** Box drawn around a block: none, a tinted background, a border, or a raised card. */
export type DisplaySurface = 'plain' | 'muted' | 'bordered' | 'elevated'

export type DisplaySize = 'sm' | 'md' | 'lg'

/** Text, or a lazy translation such as `() => t('key')`. */
export type DisplayText = LazyTextValue

/** Text, a lazy translation, a VNode, or a render function. */
export type DisplayContent = LazyRenderableValue

/**
 * A link, or a function returning it, such as a signed URL fetched on demand. A function runs only
 * when the link is used (opened, previewed or downloaded), with the button showing its progress.
 */
export type DisplayUrl = string | (() => MaybePromise<string>)

/** Date accepted by date-aware blocks: a `Date`, an ISO string, or epoch milliseconds. */
export type DisplayDate = Date | string | number

/** Button rendered by a block, with every `UButton` prop. */
export interface DisplayAction extends Omit<ButtonProps, 'label'> {
  label?: DisplayText
}

/** Badge rendered by a block, with every `UBadge` prop. `tone` is a shorthand for `color`. */
export interface DisplayChip extends Omit<BadgeProps, 'label'> {
  label: DisplayText
  tone?: DisplayTone
}

/** The `UBadge` slots of a chip. */
export type DisplayChipSlot =
  | 'base'
  | 'label'
  | 'leadingIcon'
  | 'leadingAvatar'
  | 'leadingAvatarSize'
  | 'trailingIcon'

/** Classes per `UBadge` slot of every chip, from `appConfig.nuxtUiTools.display.ui.chip`. */
export type DisplayChipUi = DisplayUiSlots<DisplayChipSlot>

/** Avatar with every `UAvatar` prop. Without `src`, the initials of `alt` show. */
export type DisplayAvatar = AvatarProps

/** Slot classes of a block: every key is optional and merged over the defaults. */
export type DisplayUiSlots<TSlot extends string> = Partial<Record<TSlot, string>>

/** Props every block accepts. */
export interface DisplayBlockBase<TSlot extends string> {
  /** Draws the block's skeleton instead of its content. */
  loading?: boolean
  /** Class overrides per slot, merged over `appConfig.nuxtUiTools.display.ui.<kind>`. */
  ui?: DisplayUiSlots<TSlot>
}

/** Props of blocks listing items, which fold after `max` and reveal `step` more at a time. */
export interface DisplayRevealable {
  /** Items shown before the "show more" button. */
  max?: number
  /** Items each "show more" reveals. Defaults to everything left. */
  step?: number
  /** Shown when there is nothing to list. Defaults to a localized "Nothing to show". */
  empty?: DisplayContent
}
