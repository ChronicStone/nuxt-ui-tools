export interface ChoiceCardGroup<TItem> {
  /** Stable key of the group: its heading, or an empty string for the options without one. */
  key: string
  /** Heading shown above the cards of the group; none for options that declare no group. */
  heading?: string
  /** The group's options, as the mutable list the Nuxt UI groups take. */
  items: TItem[]
}

/**
 * Lists options under their group headings. Headings follow the order in which they first appear
 * in `items`, and each keeps its options in their authored order. The options without a group form
 * one more group with no heading, placed where its first option appears. Without any group the
 * result is a single headingless group, so an ungrouped list renders as it always did.
 */
export function groupChoiceCardItems<TItem extends { group?: string }>(
  items: readonly TItem[],
): readonly ChoiceCardGroup<TItem>[] {
  const groups = new Map<string, TItem[]>()
  for (const item of items) {
    const key = item.group?.trim() ?? ''
    const members = groups.get(key)
    if (members) members.push(item)
    else groups.set(key, [item])
  }
  if (groups.size === 0) return [{ items: [], key: '' }]
  return [...groups].map(([key, members]) => ({ heading: key || undefined, items: members, key }))
}
