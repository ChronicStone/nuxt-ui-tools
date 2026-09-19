export function wait(duration: number) {
  // oxlint-disable-next-line avoid-new -- the playground simulates network latency
  return new Promise<void>((resolve) => {
    setTimeout(resolve, duration)
  })
}
