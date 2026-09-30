import { shallowRef } from 'vue'

import type { SpreadsheetValueAnswer, SpreadsheetValueAnswers } from '../types'

/** Answers given by the user to values that match no option, by field and normalized value. */
export function useSpreadsheetAnswers() {
  const answers = shallowRef<SpreadsheetValueAnswers>({})

  function set(field: string, key: string, answer: SpreadsheetValueAnswer) {
    answers.value = { ...answers.value, [field]: { ...answers.value[field], [key]: answer } }
  }

  function remove(field: string, key: string) {
    const current = answers.value[field]
    if (!current || !(key in current)) return
    answers.value = {
      ...answers.value,
      [field]: Object.fromEntries(Object.entries(current).filter(([entry]) => entry !== key)),
    }
  }

  function clear() {
    answers.value = {}
  }

  return { answers, clear, remove, set }
}
