import type {
  DisplayAvatar,
  DisplayBlockBase,
  DisplayChip,
  DisplayContent,
  DisplaySize,
  DisplayText,
  DisplayTone,
} from '../shared'

export type DisplayPersonSlot =
  | 'root'
  | 'avatar'
  | 'body'
  | 'name'
  | 'description'
  | 'chip'
  | 'group'
  | 'label'
  | 'contacts'
  | 'contact'
  | 'contactIcon'
  | 'contactValue'

export interface DisplayPerson {
  name: DisplayText
  description?: DisplayContent
  /** Defaults to the initials of `name`. */
  avatar?: DisplayAvatar
  /** Tint of the initials. Defaults to a tone picked from the name. */
  tone?: DisplayTone
  chip?: DisplayChip
}

export interface DisplayPersonContact {
  icon?: string
  value: string
  /** Makes the value a link, such as `mailto:` or `tel:`. */
  href?: string
  /** Adds a copy button. Defaults to `true`. */
  copy?: boolean
}

export interface DisplayPersonProps
  extends DisplayBlockBase<DisplayPersonSlot>, Partial<DisplayPerson> {
  /** `user` is one person, `group` a row of avatars, `contact` a card with ways to reach them. Defaults to `user`. */
  variant?: 'user' | 'group' | 'contact'
  /** `group` people. */
  people?: readonly DisplayPerson[]
  /** `group`: avatars shown before the `+N` one. Defaults to `4`. */
  max?: number
  /** `group`: text after the avatars. */
  label?: DisplayContent
  contacts?: readonly DisplayPersonContact[]
  /** Defaults to `md`. */
  size?: DisplaySize
}
