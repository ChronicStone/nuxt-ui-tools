import { afterEach, describe, expect, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { localeCode } from '../stubs/nuxt-ui-locale'
import { mountForm } from './harness'

afterEach(() => {
  localeCode.value = 'fr'
})

const dirtySchema = defineFormSchema({
  actions: [],
  fields: [
    { collapsible: true, dirtyCheck: true, key: 'name', label: 'Nom', type: 'text' },
    { dirtyCheck: true, key: 'city', label: 'Ville', type: 'text' },
  ],
})

describe('field chrome copy', () => {
  it('names the reset and collapse controls in the active locale', async () => {
    const harness = await mountForm({ input: { city: 'Lyon', name: 'Ada' }, schema: dirtySchema })
    await harness.setInput('name', 'Grace')
    await harness.setInput('city', 'Tunis')

    expect(
      harness.field('name').find('[aria-label="Réinitialiser le champ"]').exists(),
    ).toBeTruthy()
    expect(
      harness.field('city').find('[aria-label="Réinitialiser le champ"]').exists(),
    ).toBeTruthy()
    expect(harness.field('name').text()).toContain('Replier')
    expect(harness.wrapper.html()).not.toContain('Reset field')
    harness.unmount()
  })

  it('follows the locale for the same controls', async () => {
    localeCode.value = 'en'
    const harness = await mountForm({ input: { city: 'Lyon', name: 'Ada' }, schema: dirtySchema })
    await harness.setInput('name', 'Grace')
    await harness.setInput('city', 'Tunis')

    expect(harness.field('name').find('[aria-label="Reset field"]').exists()).toBeTruthy()
    expect(harness.field('city').find('[aria-label="Reset field"]').exists()).toBeTruthy()
    expect(harness.field('name').text()).toContain('Collapse')
    harness.unmount()
  })

  it('resets a dirty field from the localized button', async () => {
    const harness = await mountForm({ input: { city: 'Lyon', name: 'Ada' }, schema: dirtySchema })
    await harness.setInput('city', 'Tunis')
    await harness.field('city').find('[aria-label="Réinitialiser le champ"]').trigger('click')
    await harness.flush()

    expect(harness.form.state.get('city')).toBe('Lyon')
    harness.unmount()
  })

  it('names the close button of an overlay form in the active locale', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [{ key: 'name', label: 'Nom', type: 'text' }],
    })
    const french = await mountForm({ schema, shell: 'modal', showCloseButton: true })
    expect(french.wrapper.find('[aria-label="Fermer le formulaire"]').exists()).toBeTruthy()
    french.unmount()

    localeCode.value = 'en'
    const english = await mountForm({ schema, shell: 'modal', showCloseButton: true })
    expect(english.wrapper.find('[aria-label="Close form"]').exists()).toBeTruthy()
    english.unmount()
  })

  it('names a step that declares neither a title nor a key', async () => {
    const schema = {
      steps: [{ fields: [{ key: 'name', label: 'Nom', type: 'text' }] }, { fields: [] }],
    }
    const french = await mountForm({ schema })
    expect(french.wrapper.text()).toContain('Étape 1')
    expect(french.wrapper.text()).toContain('Étape 2')
    french.unmount()

    localeCode.value = 'en'
    const english = await mountForm({ schema })
    expect(english.wrapper.text()).toContain('Step 1')
    english.unmount()
  })
})
