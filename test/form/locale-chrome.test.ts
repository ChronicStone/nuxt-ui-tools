import { describe, expect, it } from 'vitest'

import { en, fr } from '#ui-tools/i18n/locales'
import { translateUiToolsMessage } from '#ui-tools/i18n/utils'

const chromeKeys = [
  'form.actions.closeButton',
  'form.fields.shell.collapse',
  'form.fields.shell.expand',
  'form.fields.shell.reset',
  'form.fields.unsupported.title',
  'form.steps.fallback',
] as const

describe('form chrome messages', () => {
  it('translates every chrome label in both locales', () => {
    for (const key of chromeKeys) {
      const english = translateUiToolsMessage(key, undefined, en)
      const french = translateUiToolsMessage(key, undefined, fr)

      expect(english).not.toBe(key)
      expect(french).not.toBe(key)
      expect(french).not.toBe(english)
    }
  })

  it('interpolates the unsupported field kind', () => {
    const option = { type: 'mystery' }

    expect(translateUiToolsMessage('form.fields.unsupported.description', option, en)).toBe(
      'The "mystery" field type cannot be displayed.',
    )
    expect(translateUiToolsMessage('form.fields.unsupported.description', option, fr)).toBe(
      'Le type de champ « mystery » ne peut pas être affiché.',
    )
  })

  it('numbers the fallback step name', () => {
    expect(translateUiToolsMessage('form.steps.fallback', { number: 2 }, en)).toBe('Step 2')
    expect(translateUiToolsMessage('form.steps.fallback', { number: 2 }, fr)).toBe('Étape 2')
  })
})
