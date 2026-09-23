import { afterEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'

import { defineFormPageSchema, defineFormPageSection } from '#ui-tools/form'
import FormPageActions from '#ui-tools/form/components/page/form-page-actions.vue'
import FormPageNavigation from '#ui-tools/form/components/page/form-page-navigation.vue'
import FormPageSections from '#ui-tools/form/components/page/form-page-sections.vue'
import type { FormObject, FormSubmitHandler, FormValue } from '#ui-tools/form/types'

import { mountPage, unmountPage } from './page-harness'
import type { PageHarness } from './page-harness'

const TYPES = [
  { label: 'Client', value: 'customer' },
  { label: 'Centre de test', value: 'testCenter' },
] as const

function typeSection() {
  return defineFormPageSection({
    description: () => 'le type conditionne les champs',
    fields: [
      { key: 'accountType', label: 'Type', options: TYPES, required: true, type: 'select' },
      {
        condition: ({ deps }) => 'accountType' in deps && deps.accountType === 'testCenter',
        dependencies: ['accountType'],
        key: 'testCenter',
        label: 'Centre',
        required: true,
        type: 'text',
      },
    ],
    key: 'type',
    label: () => 'Type de compte',
  })
}

function identitySection() {
  return defineFormPageSection({
    fields: [
      { key: 'name', label: 'Nom', required: true, type: 'text' },
      { key: 'siren', label: 'SIREN', type: 'text' },
    ],
    key: 'identity',
    label: 'Identité',
    layout: { columns: 3, fieldSpan: 1 },
  })
}

function billingSection() {
  return defineFormPageSection({
    fields: [
      {
        default: 'EUR',
        key: 'currency',
        label: 'Devise',
        options: ['EUR', 'USD'],
        required: true,
        type: 'select',
      },
      { key: 'erpId', label: 'ERP', type: 'text' },
    ],
    key: 'billing',
    label: 'Facturation',
    optional: true,
  })
}

function documentsSection() {
  return defineFormPageSection({
    condition: ({ deps }) => !('accountType' in deps) || deps.accountType !== 'testCenter',
    dependencies: ['accountType'],
    fields: [{ key: 'kbis', label: 'KBIS', type: 'text' }],
    key: 'documents',
    label: 'Documents',
  })
}

function accountSchema(options: { dirtyCheck?: boolean } = {}) {
  return defineFormPageSchema({
    actions: [
      { key: 'cancel', label: 'Annuler' },
      { key: 'submit', label: 'Créer le compte' },
    ],
    controls: { dirtyCheck: options.dirtyCheck ?? false },
    header: { description: () => 'Nouveau client', title: () => 'Nouveau compte' },
    navigation: { title: () => 'Création' },
    sections: [typeSection(), identitySection(), billingSection(), documentsSection()],
  })
}

function sectionKeys(harness: PageHarness) {
  const root: Element = harness.wrapper.element
  return [...root.querySelectorAll('[data-form-page-section]')].map((node) =>
    node.getAttribute('data-form-page-section'),
  )
}

afterEach(unmountPage)

describe('form page', () => {
  it('renders the header, one navigation entry and one card per section, with lazy labels', async () => {
    const harness = await mountPage({ schema: accountSchema() })

    expect(harness.wrapper.find('[data-form-page-header] h1').text()).toBe('Nouveau compte')
    expect(harness.wrapper.find('[data-form-page-header]').text()).toContain('Nouveau client')
    expect(harness.wrapper.find('[data-form-page-navigation] p').text()).toBe('Création')
    expect(sectionKeys(harness)).toStrictEqual(['type', 'identity', 'billing', 'documents'])
    expect(harness.section('type').id).toBe('type')
    expect(harness.section('type').querySelector('h2')?.textContent?.trim()).toBe('Type de compte')
    expect(harness.section('type').textContent).toContain('le type conditionne les champs')
    expect(harness.entry('identity').textContent).toContain('Identité')
    expect(harness.wrapper.find('[data-form-page-actions]').text()).toContain('Créer le compte')
  })

  it('shows where each section stands and counts the required ones left', async () => {
    const harness = await mountPage({ schema: accountSchema() })

    expect(harness.entry('type').dataset.state).toBe('pending')
    expect(harness.entry('identity').dataset.state).toBe('pending')
    // Optional: the currency default alone does not complete it, nor does an empty section.
    expect(harness.entry('billing').dataset.state).toBe('pending')
    expect(harness.entry('billing').textContent).toContain('optionnel')
    expect(harness.entry('documents').textContent).toContain('optionnel')
    expect(harness.summary()).toBe('2 sections à compléter.')

    await harness.setValue('name', 'DemandQA')
    expect(harness.entry('identity').dataset.state).toBe('complete')
    expect(harness.summary()).toBe('1 section à compléter.')

    harness.form.state.set('accountType', 'customer')
    await harness.flush()
    expect(harness.entry('type').dataset.state).toBe('complete')
    expect(harness.summary()).toBe('Tout est prêt.')

    await harness.setValue('erpId', 'EV-1')
    expect(harness.entry('billing').dataset.state).toBe('complete')
    expect(harness.entry('billing').textContent).not.toContain('optionnel')
  })

  it('counts values the input provides as filled in', async () => {
    const harness = await mountPage({
      input: { accountType: 'customer', erpId: 'EV-1', kbis: 'kbis.pdf', name: 'DemandQA' },
      schema: accountSchema(),
    })

    expect(
      ['type', 'identity', 'billing', 'documents'].map((key) => harness.entry(key).dataset.state),
    ).toStrictEqual(['complete', 'complete', 'complete', 'complete'])
  })

  it('follows conditions across sections: fields, requirements, and whole sections', async () => {
    const harness = await mountPage({ input: { name: 'DemandQA' }, schema: accountSchema() })

    harness.form.state.set('accountType', 'testCenter')
    await harness.flush()

    expect(harness.wrapper.find('[data-form-field="testCenter"]').exists()).toBe(true)
    expect(harness.entry('type').dataset.state).toBe('pending')
    expect(sectionKeys(harness)).toStrictEqual(['type', 'identity', 'billing'])
    expect(harness.wrapper.find('a[href="#documents"]').exists()).toBe(false)

    await harness.setValue('testCenter', 'Paris')
    expect(harness.entry('type').dataset.state).toBe('complete')
  })

  it('marks the sections that fail validation on submit', async () => {
    const onSubmit = vi.fn<FormSubmitHandler<FormObject, FormValue>>(() => true)
    const harness = await mountPage({ onSubmit, schema: accountSchema() })

    await harness.wrapper.find('form').trigger('submit')
    await harness.flush()

    expect(onSubmit).not.toHaveBeenCalled()
    expect(harness.entry('type').dataset.state).toBe('invalid')
    expect(harness.entry('identity').dataset.state).toBe('invalid')
    expect(harness.section('identity').dataset.state).toBe('invalid')
    expect(harness.entry('billing').dataset.state).not.toBe('invalid')
  })

  it('rings modified sections, marks them in the navigation, and resets one section', async () => {
    const harness = await mountPage({
      input: { accountType: 'customer', erpId: 'EV-1', name: 'DemandQA', siren: '123' },
      schema: accountSchema({ dirtyCheck: true }),
    })

    expect(harness.section('identity').dataset.dirty).toBeUndefined()
    expect(harness.summary()).toBe('Aucune modification en cours.')
    expect(harness.wrapper.find('[data-form-page-unsaved]').exists()).toBe(false)

    await harness.setValue('name', 'DemandQA Europe')
    await harness.setValue('erpId', 'EV-2')

    expect(harness.section('identity').dataset.dirty).toBe('true')
    expect(harness.entry('identity').querySelector('[data-form-page-dirty]')).not.toBeNull()
    expect(harness.entry('type').querySelector('[data-form-page-dirty]')).toBeNull()
    expect(harness.summary()).toBe('2 sections modifiées.')
    expect(harness.wrapper.find('[data-form-page-unsaved]').text()).toBe(
      'Modifications non enregistrées',
    )

    await harness.wrapper
      .find('[data-form-page-section="identity"] [data-form-page-reset]')
      .trigger('click')
    await harness.flush()

    expect(harness.form.state.get('name')).toBe('DemandQA')
    expect(harness.section('identity').dataset.dirty).toBeUndefined()
    expect(harness.form.state.get('erpId')).toBe('EV-2')
    expect(harness.summary()).toBe('1 section modifiée.')
  })

  it('saves the values on a successful submit, so nothing reads as modified after it', async () => {
    const harness = await mountPage({
      input: { accountType: 'customer', name: 'DemandQA' },
      onSubmit: () => true,
      schema: accountSchema({ dirtyCheck: true }),
    })

    await harness.setValue('name', 'DemandQA Europe')
    expect(harness.form.isDirty.value).toBe(true)

    await harness.wrapper.find('form').trigger('submit')
    await harness.flush()

    expect(harness.submitted).toHaveLength(1)
    expect(harness.submitted[0]).toMatchObject({ accountType: 'customer', name: 'DemandQA Europe' })
    expect(harness.form.isDirty.value).toBe(false)
    expect(harness.section('identity').dataset.dirty).toBeUndefined()
  })

  it('lays the fields of a section out in the section grid', async () => {
    const harness = await mountPage({ schema: accountSchema() })
    const body = harness
      .section('identity')
      .querySelector('[data-form-field="name"]')?.parentElement

    expect(body?.getAttribute('style')).toContain('repeat(3, minmax(0, 1fr))')
    expect(
      harness.section('identity').querySelector('[data-form-field="name"]')?.getAttribute('style'),
    ).toContain('span 1 / span 1')
  })

  it('scrolls to a section from the navigation and records it in the hash', async () => {
    const scrollIntoView = vi.fn<(options?: ScrollIntoViewOptions) => void>()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
    const harness = await mountPage({ schema: accountSchema() })

    harness.entry('billing').click()
    await harness.flush()

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(harness.section('billing'))
    expect(window.location.hash).toBe('#billing')
    expect(harness.entry('billing').getAttribute('aria-current')).toBe('location')
    expect(document.activeElement).toBe(harness.section('billing').querySelector('h2'))
  })

  it('opens on the section the hash names', async () => {
    const scrollIntoView = vi.fn<(options?: ScrollIntoViewOptions) => void>()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
    window.history.replaceState(null, '', '/#identity')
    const harness = await mountPage({ schema: accountSchema() })

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' })
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(harness.section('identity'))
    expect(harness.entry('identity').getAttribute('aria-current')).toBe('location')
  })

  it('composes another layout from the page parts', async () => {
    const onSubmit = vi.fn<FormSubmitHandler<FormObject, FormValue>>(() => true)
    const harness = await mountPage({
      input: { accountType: 'customer', name: 'DemandQA' },
      layout: () => [
        h('div', { class: 'custom-layout' }, [h(FormPageSections), h(FormPageNavigation)]),
        h('footer', { class: 'custom-footer' }, [h(FormPageActions)]),
      ],
      onSubmit,
      schema: accountSchema(),
    })

    expect(harness.wrapper.find('[data-form-page-header]').exists()).toBe(false)
    expect(harness.wrapper.find('.custom-layout [data-form-page-sections]').exists()).toBe(true)
    expect(harness.wrapper.find('.custom-layout [data-form-page-navigation]').exists()).toBe(true)

    const submit = harness.wrapper
      .findAll('.custom-footer button')
      .find((button) => button.text() === 'Créer le compte')
    expect(submit?.attributes('type')).toBe('submit')
    await harness.wrapper.find('form').trigger('submit')
    await harness.flush()

    expect(onSubmit).toHaveBeenCalledOnce()
  })
})
