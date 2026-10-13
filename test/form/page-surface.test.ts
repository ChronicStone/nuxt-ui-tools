import { describe, expect, expectTypeOf, it } from 'vitest'

import { defineFormPageSchema, defineFormPageSection } from '#ui-tools/form'
import type {
  FormPageNavigationConfig,
  FormPageSurface,
  FormPageUiConfig,
  FormUiConfig,
} from '#ui-tools/form'
import { mergeFormUi } from '#ui-tools/form/utils/ui'

import { getFormPageNavigationMinSections } from '../../src/runtime/form/utils/page'
import {
  getFormPageSurfaceClasses,
  resolveFormPageSurface,
} from '../../src/runtime/form/utils/page-surface'

function section() {
  return defineFormPageSection({
    fields: [{ key: 'name', label: 'Nom', type: 'text' }],
    key: 'identity',
    label: 'Identité',
  })
}

describe('form page surface', () => {
  it('types the surface and the navigation threshold', () => {
    expectTypeOf<FormPageSurface>().toEqualTypeOf<'card' | 'plain'>()
    expectTypeOf<FormPageUiConfig['surface']>().toEqualTypeOf<FormPageSurface | undefined>()
    expectTypeOf<NonNullable<FormUiConfig['page']>>().toEqualTypeOf<FormPageUiConfig>()
    expectTypeOf<FormPageUiConfig>().toHaveProperty('ui')
    expectTypeOf<FormPageNavigationConfig['minSections']>().toEqualTypeOf<number | undefined>()
    // @ts-expect-error -- a surface is `card` or `plain`
    const invalid: FormUiConfig = { page: { surface: 'floating' } }
    expect(invalid).toBeDefined()
  })

  it('accepts both options on a page schema and keeps them on it', () => {
    const schema = defineFormPageSchema({
      navigation: { minSections: 3, title: 'Création' },
      sections: [section()],
      ui: { page: { surface: 'plain', ui: { section: 'py-6' } } },
    })

    expect(schema.navigation).toStrictEqual({ minSections: 3, title: 'Création' })
    expect(schema.ui?.page).toStrictEqual({ surface: 'plain', ui: { section: 'py-6' } })
  })

  it('falls back to the card surface unless the config names a known one', () => {
    expect(resolveFormPageSurface('plain')).toBe('plain')
    expect(resolveFormPageSurface('card')).toBe('card')
    expect(resolveFormPageSurface(undefined)).toBe('card')
    expect(resolveFormPageSurface('floating')).toBe('card')
    expect(resolveFormPageSurface('toString')).toBe('card')
    expect(resolveFormPageSurface(2)).toBe('card')
  })

  it('sets every slot of the page parts it restyles, with and without a box', () => {
    const card = getFormPageSurfaceClasses('card')
    const plain = getFormPageSurfaceClasses('plain')

    expect(new Set(Object.keys(plain))).toStrictEqual(new Set(Object.keys(card)))
    expect(card.section).toContain('rounded-xl')
    expect(card.section).toContain('border ')
    expect(plain.section).not.toContain('rounded-xl')
    expect(plain.section).toContain('border-t')
    expect(plain.section).toContain('first:border-t-0')
    expect(plain.sectionSkeleton).not.toContain('rounded')
  })

  describe('layering', () => {
    it('keeps the surface of a lower layer that only restyles slots', () => {
      const merged = mergeFormUi(
        { page: { surface: 'plain', ui: { root: 'a' } } },
        { page: { ui: { root: 'b', section: 'c' } } },
      )

      expect(merged.page?.surface).toBe('plain')
      expect(merged.page?.ui).toStrictEqual({ root: 'b', section: 'c' })
    })

    it('lets a later layer choose another surface', () => {
      expect(
        mergeFormUi({ page: { surface: 'plain' } }, { page: { surface: 'card' } }).page?.surface,
      ).toBe('card')
      expect(
        mergeFormUi({ page: { surface: 'card' } }, undefined, { page: { surface: 'plain' } }).page
          ?.surface,
      ).toBe('plain')
    })
  })
})

describe('form page navigation threshold', () => {
  it('reads the minimum number of sections from the schema navigation', () => {
    expect(getFormPageNavigationMinSections({ navigation: { minSections: 3 } })).toBe(3)
    expect(getFormPageNavigationMinSections({ navigation: { minSections: 2 } })).toBe(2)
    expect(getFormPageNavigationMinSections({ navigation: { minSections: 3.9 } })).toBe(3)
  })

  it('shows the navigation whatever the number of sections when no usable count is set', () => {
    expect(getFormPageNavigationMinSections({})).toBe(0)
    expect(getFormPageNavigationMinSections({ navigation: {} })).toBe(0)
    expect(getFormPageNavigationMinSections({ navigation: { title: 'Création' } })).toBe(0)
    expect(getFormPageNavigationMinSections({ navigation: { minSections: 1 } })).toBe(0)
    expect(getFormPageNavigationMinSections({ navigation: { minSections: 0 } })).toBe(0)
    expect(getFormPageNavigationMinSections({ navigation: { minSections: -2 } })).toBe(0)
    expect(getFormPageNavigationMinSections({ navigation: { minSections: '3' } })).toBe(0)
    expect(getFormPageNavigationMinSections(null)).toBe(0)
  })
})
