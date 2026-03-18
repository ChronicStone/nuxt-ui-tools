export function createKeyedRegistry<const TItem extends { key: string }>(
  items: readonly TItem[],
): { [TKey in TItem['key']]: Extract<TItem, { key: TKey }> } {
  return items.reduce(
    (registry, item) => ({
      ...registry,
      [item.key]: item,
    }),
    {} as { [TKey in TItem['key']]: Extract<TItem, { key: TKey }> },
  )
}
