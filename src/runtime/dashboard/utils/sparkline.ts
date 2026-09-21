/** Sparkline viewBox: `0 0 100 32`, stretched to the element. */
const WIDTH = 100
const HEIGHT = 32
/** Vertical inset, so the stroke never clips at the extremes. */
const INSET = 2

/**
 * SVG paths of a sparkline: the line, and the area under it closed on the baseline. `null` values
 * leave gaps (each run of defined values is its own segment). The vertical range spans the data,
 * so small variations stay visible.
 */
export function resolveDashboardSparkline(values: readonly (number | null | undefined)[]) {
  const finite = values.filter((value): value is number => Number.isFinite(value))
  if (finite.length === 0) return null
  const min = Math.min(...finite)
  const max = Math.max(...finite)
  const step = values.length > 1 ? WIDTH / (values.length - 1) : 0
  const y = (value: number) =>
    max === min ? HEIGHT / 2 : INSET + (1 - (value - min) / (max - min)) * (HEIGHT - INSET * 2)

  const runs: [number, number][][] = []
  let run: [number, number][] = []
  values.forEach((value, index) => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      if (run.length) runs.push(run)
      run = []
      return
    }
    run.push([values.length > 1 ? index * step : WIDTH / 2, y(value)])
  })
  if (run.length) runs.push(run)

  const line = runs.map(toPath).join('')
  const area = runs
    .filter((points) => points.length > 1)
    .map((points) => {
      const first = points[0]
      const last = points.at(-1)
      if (!first || !last) return ''
      return `${toPath(points)}L${last[0].toFixed(2)},${HEIGHT}L${first[0].toFixed(2)},${HEIGHT}Z`
    })
    .join('')
  return { area, line }
}

/**
 * Mini bars in the sparkline viewBox, one per value, scaled from zero to the largest value (a bar
 * compares magnitudes, so its baseline stays at zero). `null` values leave an empty slot; the last
 * bar is flagged, the latest period being the one a KPI reports.
 */
export function resolveDashboardSparkBars(values: readonly (number | null | undefined)[]) {
  const finite = values.filter((value): value is number => Number.isFinite(value))
  if (finite.length === 0) return null
  const max = Math.max(0, ...finite)
  const slot = WIDTH / Math.max(1, values.length)
  const width = Math.max(1, slot * 0.62)
  return values.flatMap((value, index) => {
    if (value === null || value === undefined || !Number.isFinite(value)) return []
    const height = max > 0 ? Math.max(1.5, (Math.max(0, value) / max) * (HEIGHT - INSET)) : 1.5
    return [
      {
        height: Number(height.toFixed(2)),
        last: index === values.length - 1,
        width: Number(width.toFixed(2)),
        x: Number((index * slot + (slot - width) / 2).toFixed(2)),
        y: Number((HEIGHT - height).toFixed(2)),
      },
    ]
  })
}

function toPath(points: readonly [number, number][]) {
  return points
    .map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join('')
}
