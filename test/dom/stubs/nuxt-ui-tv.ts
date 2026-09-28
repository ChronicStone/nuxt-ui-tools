type SlotProps = { class?: unknown }

function classList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(classList)
  }
  return typeof value === 'string' && value ? [value] : []
}

/** Resolves every theme slot to the classes callers add, so inert cells render in DOM tests. */
export function tv() {
  return () =>
    new Proxy(
      {},
      {
        get: (_target, slot) => (props?: SlotProps) =>
          [`slot-${String(slot)}`, ...classList(props?.class)].join(' '),
      },
    )
}
