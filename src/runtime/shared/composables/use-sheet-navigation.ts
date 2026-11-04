import { useEventListener } from '@vueuse/core'
import type { MaybeRefOrGetter } from 'vue'

/** The attribute a cell's input carries: its column, so up and down stay in it. */
export const SHEET_COLUMN_ATTRIBUTE = 'data-sheet-col'

const SELECTOR = `input[${SHEET_COLUMN_ATTRIBUTE}]:not(:disabled)`

/**
 * Where a key press moves in a grid of inputs, or `undefined` to leave it to the input. Up, down
 * and Enter stay in the column; left and right follow the reading order, and only once the caret
 * has nothing left to cross, so editing inside a value still works.
 */
export function nextSheetInput<TInput>(params: {
  inputs: readonly TInput[]
  current: TInput
  key: string
  shiftKey?: boolean
  columnOf: (input: TInput) => string | null
  caret: { atStart: boolean; atEnd: boolean }
}) {
  const { inputs, current, key, caret } = params
  const across = inputs.indexOf(current)
  const column = inputs.filter((input) => params.columnOf(input) === params.columnOf(current))
  const along = column.indexOf(current)

  if (key === 'ArrowDown' || (key === 'Enter' && !params.shiftKey)) return column[along + 1]
  if (key === 'ArrowUp' || (key === 'Enter' && params.shiftKey)) return column[along - 1]
  if (key === 'ArrowRight' && caret.atEnd) return inputs[across + 1]
  if (key === 'ArrowLeft' && caret.atStart) return inputs[across - 1]
  return undefined
}

/**
 * Makes the inputs under `root` walk like a spreadsheet. Mark each one with
 * `data-sheet-col="<column>"`: arrows and Enter move between them, and focusing one selects its
 * value, so typing replaces it.
 */
export function useSheetNavigation(root: MaybeRefOrGetter<HTMLElement | null | undefined>) {
  useEventListener(root, 'focusin', (event: FocusEvent) => {
    if (event.target instanceof HTMLInputElement && event.target.matches(SELECTOR)) {
      event.target.select()
    }
  })

  useEventListener(root, 'keydown', (event: KeyboardEvent) => {
    const { currentTarget, target } = event
    if (!(target instanceof HTMLInputElement) || !(currentTarget instanceof HTMLElement)) return
    if (!target.matches(SELECTOR)) return

    const next = nextSheetInput({
      caret: {
        atEnd: target.selectionEnd === target.value.length,
        atStart: target.selectionStart === 0,
      },
      columnOf: (input) => input.getAttribute(SHEET_COLUMN_ATTRIBUTE),
      current: target,
      inputs: [...currentTarget.querySelectorAll<HTMLInputElement>(SELECTOR)],
      key: event.key,
      shiftKey: event.shiftKey,
    })

    if (next) {
      event.preventDefault()
      next.focus()
    }
  })
}
