export function createKeyedRegistry<const TItem extends { key: string }>(
  items: readonly TItem[],
): { [TKey in TItem['key']]: Extract<TItem, { key: TKey }> } {
  return items.reduce(
    (registry, item) => ({
      ...registry,
      [item.key]: item,
    }),
    // SAFETY: every reducer write uses an item key from the input tuple, so the mapped registry is complete.
    {} as { [TKey in TItem['key']]: Extract<TItem, { key: TKey }> },
  )
}
