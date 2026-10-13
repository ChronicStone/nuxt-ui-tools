import { describe, expect, expectTypeOf, it } from 'vitest'

import type { FormPageSectionState, FormPageSectionStatus } from '#ui-tools/form'
import { en, fr } from '#ui-tools/i18n/locales'
import { translateUiToolsMessage } from '#ui-tools/i18n/utils'

import {
  isFormPageSectionBlocking,
  resolveFormPageSectionStatus,
} from '../../src/runtime/form/utils/page'

type StatusParams = Parameters<typeof resolveFormPageSectionStatus>[0]

const base: StatusParams = { invalid: false, missing: 0, optional: false, provided: false }

function status(overrides: Partial<StatusParams>) {
  return resolveFormPageSectionStatus({ ...base, ...overrides })
}

function blocking(value: FormPageSectionStatus) {
  return isFormPageSectionBlocking({ status: value })
}

describe('form page section status', () => {
  it('types the four statuses', () => {
    expectTypeOf<FormPageSectionStatus>().toEqualTypeOf<
      'invalid' | 'pending' | 'complete' | 'optional'
    >()
    expectTypeOf<FormPageSectionState['status']>().toEqualTypeOf<FormPageSectionStatus>()
  })

  describe('a required section', () => {
    it('waits to be completed while a required field has no value', () => {
      expect(status({ missing: 2 })).toBe('pending')
      expect(status({ missing: 1, provided: true })).toBe('pending')
    })

    it('is complete once nothing required is missing, whatever the user entered', () => {
      expect(status({})).toBe('complete')
      expect(status({ provided: true })).toBe('complete')
    })

    it('is to fix when a field shows an error, before anything else', () => {
      expect(status({ invalid: true })).toBe('invalid')
      expect(status({ invalid: true, missing: 3 })).toBe('invalid')
    })
  })

  describe('an optional section', () => {
    it('is optional, and not pending, while nothing was entered in it', () => {
      expect(status({ optional: true })).toBe('optional')
    })

    it('is complete once a value was entered or came with the form input', () => {
      expect(status({ optional: true, provided: true })).toBe('complete')
    })

    it('waits to be completed when it was started and a required field is empty', () => {
      expect(status({ missing: 1, optional: true })).toBe('pending')
      expect(status({ missing: 1, optional: true, provided: true })).toBe('pending')
    })

    it('is to fix when a field shows an error', () => {
      expect(status({ invalid: true, optional: true })).toBe('invalid')
      expect(status({ invalid: true, optional: true, provided: true })).toBe('invalid')
    })
  })

  it('counts only the sections that keep the form from being submitted', () => {
    expect(blocking('pending')).toBe(true)
    expect(blocking('invalid')).toBe(true)
    expect(blocking('complete')).toBe(false)
    expect(blocking('optional')).toBe(false)
  })

  it('translates every status in both locales', () => {
    const statuses = [
      'complete',
      'invalid',
      'optional',
      'pending',
    ] as const satisfies readonly FormPageSectionStatus[]

    expect(
      statuses.map((key) => translateUiToolsMessage(`form.page.status.${key}`, undefined, fr)),
    ).toStrictEqual(['Complété', 'À corriger', 'Facultatif', 'À compléter'])
    expect(
      statuses.map((key) => translateUiToolsMessage(`form.page.status.${key}`, undefined, en)),
    ).toStrictEqual(['Completed', 'To fix', 'Optional', 'To complete'])
  })
})
