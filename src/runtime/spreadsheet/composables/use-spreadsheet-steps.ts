import { computed, shallowRef, watch } from 'vue'

import type {
  SpreadsheetBuiltInStep,
  SpreadsheetStep,
  SpreadsheetStepContext,
  SpreadsheetSteps,
  SpreadsheetStepStatus,
} from '../types'

type SpreadsheetStepPreset = Omit<SpreadsheetStep, 'key' | 'builtIn'> & { key?: string }

function preset(builtIn: SpreadsheetBuiltInStep, defaults: Omit<SpreadsheetStep, 'key'>) {
  return (options: SpreadsheetStepPreset = {}): SpreadsheetStep => ({
    ...defaults,
    ...options,
    builtIn,
    key: options.key ?? builtIn,
  })
}

/**
 * The built-in steps. Each knows when it is ready and what blocks it; override any of `label`,
 * `hint`, `show`, `ready`, `needed`, and `blockers`.
 */
export const spreadsheetSteps = {
  columns: preset('columns', {
    blockers: (importer) => importer.columns.missing.length,
    needed: (importer) => importer.columns.missing.length > 0,
    ready: (importer) => !importer.columns.missing.length,
  }),
  file: preset('file', {
    ready: (importer) =>
      importer.file.loaded && !importer.file.reading && !importer.readiness.loading,
  }),
  review: preset('review', {
    ready: (importer) => importer.readiness.importable > 0 && !importer.readiness.loading,
  }),
  submit: preset('submit', {
    ready: (importer) => importer.submit.status === 'done',
  }),
  values: preset('values', {
    blockers: (importer) => importer.values.open.length,
    needed: (importer) => importer.values.questions.length > 0,
    ready: (importer) => !importer.values.open.length,
  }),
}

/**
 * A wizard over an importer: the steps you list, in order, built-in or your own. Steps with
 * `show: 'when-needed'` are skipped when they have nothing to do.
 *
 * @example
 * ```ts
 * const steps = useSpreadsheetSteps(importer, [
 *   { key: 'center', label: 'Centre', ready: () => Boolean(centerId.value) },
 *   spreadsheetSteps.file(),
 *   spreadsheetSteps.columns({ show: 'when-needed' }),
 *   spreadsheetSteps.values({ show: 'when-needed' }),
 *   spreadsheetSteps.review(),
 *   spreadsheetSteps.submit(),
 * ])
 * ```
 */
export function useSpreadsheetSteps(
  importer: SpreadsheetStepContext,
  steps: readonly SpreadsheetStep[] = [
    spreadsheetSteps.file(),
    spreadsheetSteps.columns({ show: 'when-needed' }),
    spreadsheetSteps.values({ show: 'when-needed' }),
    spreadsheetSteps.review(),
    spreadsheetSteps.submit(),
  ],
): SpreadsheetSteps {
  const current = shallowRef<string>(steps[0]?.key ?? '')
  /** Steps the user has been on: a `when-needed` step stays done once visited. */
  const visited = shallowRef<ReadonlySet<string>>(new Set([current.value]))
  watch(current, (key) => {
    if (!visited.value.has(key)) visited.value = new Set([...visited.value, key])
  })

  const list = computed(() => {
    const currentIndex = Math.max(
      steps.findIndex((step) => step.key === current.value),
      0,
    )
    return steps.map<SpreadsheetStepStatus>((step, index) => {
      const skipped =
        step.show === 'when-needed' &&
        !visited.value.has(step.key) &&
        !(step.needed?.(importer) ?? true)
      return {
        blockers: step.blockers?.(importer) ?? 0,
        builtIn: step.builtIn ?? null,
        hint: step.hint,
        key: step.key,
        label: step.label,
        position: index + 1,
        ready: step.ready?.(importer) ?? true,
        skipped,
        state:
          index === currentIndex
            ? 'current'
            : index < currentIndex
              ? skipped
                ? 'skipped'
                : 'done'
              : skipped
                ? 'skipped'
                : 'upcoming',
      }
    })
  })
  const index = computed(() =>
    Math.max(
      list.value.findIndex((step) => step.key === current.value),
      0,
    ),
  )
  const step = computed(() => list.value[index.value] ?? null)

  function move(direction: 1 | -1) {
    for (
      let next = index.value + direction;
      next >= 0 && next < list.value.length;
      next += direction
    ) {
      const candidate = list.value[next]
      if (candidate && !candidate.skipped) {
        current.value = candidate.key
        return
      }
    }
  }

  function next() {
    if (step.value?.ready) move(1)
  }

  function back() {
    move(-1)
  }

  function goTo(key: string) {
    const target = list.value.findIndex((entry) => entry.key === key)
    if (target >= 0 && target <= index.value) current.value = key
  }

  function reset() {
    current.value = steps[0]?.key ?? ''
    visited.value = new Set([current.value])
  }

  watch(
    () => importer.file.loaded,
    (loaded) => {
      if (loaded) return
      const fileStep = steps.findIndex((entry) => entry.builtIn === 'file')
      if (fileStep >= 0 && index.value > fileStep)
        current.value = steps[fileStep]?.key ?? current.value
    },
  )

  return {
    back,
    get canBack() {
      return list.value.slice(0, index.value).some((entry) => !entry.skipped)
    },
    get canNext() {
      return Boolean(step.value?.ready) && index.value < list.value.length - 1
    },
    get current() {
      return current.value
    },
    goTo,
    get isLast() {
      return index.value === list.value.length - 1
    },
    get list() {
      return list.value
    },
    next,
    reset,
    get step() {
      return step.value
    },
  }
}
