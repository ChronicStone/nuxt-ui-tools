import { afterEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'

import { defineFormPageSchema, defineFormPageSection } from '#ui-tools/form'
import FormPageActions from '#ui-tools/form/components/page/form-page-actions.vue'
import FormPageNavigation from '#ui-tools/form/components/page/form-page-navigation.vue'
import FormPageSections from '#ui-tools/form/components/page/form-page-sections.vue'
import type { FormObject, FormSubmitHandler, FormUiConfig, FormValue } from '#ui-tools/form/types'

import { localeCode } from '../stubs/nuxt-ui-locale'
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
        condition: ({ deps }) => deps.get('accountType') === 'testCenter',
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
    condition: ({ deps }) => deps.get('accountType') !== 'testCenter',
    dependencies: ['accountType'],
    fields: [{ key: 'kbis', label: 'KBIS', type: 'text' }],
    key: 'documents',
    label: 'Documents',
  })
}

function accountSchema(
  options: { dirtyCheck?: boolean; minSections?: number; ui?: FormUiConfig } = {},
) {
  return defineFormPageSchema({
    actions: [
      { key: 'cancel', label: 'Annuler' },
      { key: 'submit', label: 'Créer le compte' },
    ],
    controls: { dirtyCheck: options.dirtyCheck ?? false },
    header: { description: () => 'Nouveau client', title: () => 'Nouveau compte' },
    navigation: { minSections: options.minSections, title: () => 'Création' },
    sections: [typeSection(), identitySection(), billingSection(), documentsSection()],
    ui: options.ui,
  })
}

function sectionKeys(harness: PageHarness) {
  const root: Element = harness.wrapper.element
  return [...root.querySelectorAll('[data-form-page-section]')].map((node) =>
    node.getAttribute('data-form-page-section'),
  )
}

/** The element holding the sections and, beside them, the navigation. */
function pageBody(harness: PageHarness) {
  return harness.wrapper.find('[data-form-page-sections]').element.parentElement
}

function surfaceOf(harness: PageHarness) {
  return harness.wrapper.find('[data-form-page]').attributes('data-surface')
}

/** Visually hidden status of a navigation entry, which screen readers announce. */
function status(harness: PageHarness, key: string) {
  return harness.entry(key).querySelector('.sr-only')?.textContent?.trim()
}

/** The visible "Facultatif" tag of a navigation entry. */
function optionalTag(harness: PageHarness, key: string) {
  return harness.entry(key).querySelector('[data-form-page-optional]')
}

afterEach(() => {
  unmountPage()
  localeCode.value = 'fr'
})

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
    // The visually hidden status stays inside its entry, which scrolls sideways on phones.
    expect(harness.entry('identity').classList).toContain('relative')
    expect(harness.wrapper.find('[data-form-page-actions]').text()).toContain('Créer le compte')
  })

  it('draws a section icon before its title, styled by the page ui', async () => {
    const harness = await mountPage({
      schema: defineFormPageSchema({
        sections: [
          defineFormPageSection({
            fields: [{ key: 'street', label: 'Rue', type: 'text' }],
            icon: 'i-lucide-map-pin',
            key: 'address',
            label: 'Adresse',
          }),
          defineFormPageSection({
            fields: [{ key: 'note', label: 'Note', type: 'text' }],
            key: 'notes',
            label: 'Notes',
          }),
        ],
      }),
      ui: { page: { ui: { sectionIcon: 'bg-primary/10' } } },
    })

    const icon = harness.section('address').querySelector('[data-form-page-section-icon]')
    expect(icon?.nextElementSibling?.tagName).toBe('H2')
    expect(icon?.getAttribute('aria-hidden')).toBe('true')
    expect(icon?.className).toContain('bg-primary/10')
    expect(harness.section('notes').querySelector('[data-form-page-section-icon]')).toBeNull()
  })

  it('shows where each section stands and counts the required ones left', async () => {
    const harness = await mountPage({ schema: accountSchema() })

    expect(harness.entry('type').dataset.state).toBe('pending')
    expect(harness.entry('identity').dataset.state).toBe('pending')
    expect(status(harness, 'identity')).toBe('À compléter')
    expect(optionalTag(harness, 'identity')).toBeNull()
    // Optional: the currency default alone does not complete it, nor does an empty section. It
    // reads "Facultatif" alone, never "À compléter" as well.
    for (const key of ['billing', 'documents']) {
      expect(harness.entry(key).dataset.state).toBe('optional')
      expect(status(harness, key)).toBe('Facultatif')
      expect(optionalTag(harness, key)?.textContent?.trim()).toBe('Facultatif')
      expect(harness.entry(key).textContent).not.toContain('À compléter')
      expect(harness.section(key).dataset.state).toBe('optional')
      expect(harness.section(key).querySelector('[data-form-page-optional]')?.textContent).toBe(
        'Facultatif',
      )
    }
    expect(harness.section('identity').querySelector('[data-form-page-optional]')).toBeNull()
    expect(harness.summary()).toBe('2 sections à compléter.')

    await harness.setValue('name', 'DemandQA')
    expect(harness.entry('identity').dataset.state).toBe('complete')
    expect(status(harness, 'identity')).toBe('Complété')
    expect(harness.summary()).toBe('1 section à compléter.')

    harness.form.state.set('accountType', 'customer')
    await harness.flush()
    expect(harness.entry('type').dataset.state).toBe('complete')
    expect(harness.summary()).toBe('Tout est prêt.')

    await harness.setValue('erpId', 'EV-1')
    expect(harness.entry('billing').dataset.state).toBe('complete')
    expect(status(harness, 'billing')).toBe('Complété')
    expect(optionalTag(harness, 'billing')).toBeNull()
    expect(harness.section('billing').querySelector('[data-form-page-optional]')).toBeNull()
    expect(harness.summary()).toBe('Tout est prêt.')
  })

  it('flags a section to fix only once a field was left or a submit was tried', async () => {
    const harness = await mountPage({ schema: accountSchema() })

    // Required sections wait to be completed: none shows an error before the user acts.
    expect(harness.wrapper.find('[data-state="invalid"]').exists()).toBe(false)

    await harness.wrapper.find('[data-form-field="name"] input').trigger('blur')
    await harness.flush()
    expect(harness.entry('identity').dataset.state).toBe('invalid')
    expect(status(harness, 'identity')).toBe('À corriger')
    expect(harness.entry('type').dataset.state).toBe('pending')
    // An invalid section still blocks the submit, so the summary keeps counting it.
    expect(harness.summary()).toBe('2 sections à compléter.')

    await harness.setValue('name', 'DemandQA')
    expect(harness.entry('identity').dataset.state).toBe('complete')

    await harness.wrapper.find('form').trigger('submit')
    await harness.flush()
    expect(harness.entry('type').dataset.state).toBe('invalid')
    expect(status(harness, 'type')).toBe('À corriger')
    // A failed submit does not turn optional sections into something to fix.
    expect(harness.entry('billing').dataset.state).toBe('optional')
    expect(status(harness, 'billing')).toBe('Facultatif')
  })

  it('counts an optional section the user started and left incomplete, without its tag', async () => {
    const harness = await mountPage({
      input: { accountType: 'customer', name: 'DemandQA' },
      schema: accountSchema(),
    })

    expect(harness.entry('billing').dataset.state).toBe('optional')
    expect(harness.summary()).toBe('Tout est prêt.')

    // The currency is required in the billing section: emptying it blocks the submit.
    harness.form.state.set('currency', null)
    await harness.flush()

    expect(harness.entry('billing').dataset.state).toBe('pending')
    expect(status(harness, 'billing')).toBe('À compléter')
    expect(optionalTag(harness, 'billing')).toBeNull()
    expect(harness.section('billing').querySelector('[data-form-page-optional]')).toBeNull()
    expect(harness.summary()).toBe('1 section à compléter.')

    harness.form.state.set('currency', 'USD')
    await harness.flush()
    expect(harness.entry('billing').dataset.state).toBe('complete')
    expect(harness.summary()).toBe('Tout est prêt.')
  })

  it('announces the status in English, with the unsaved changes marker', async () => {
    localeCode.value = 'en'
    const harness = await mountPage({
      input: { accountType: 'customer', name: 'DemandQA' },
      schema: accountSchema({ dirtyCheck: true }),
    })

    expect(status(harness, 'identity')).toBe('Completed')
    expect(status(harness, 'billing')).toBe('Optional')
    expect(optionalTag(harness, 'billing')?.textContent?.trim()).toBe('Optional')

    await harness.setValue('name', 'DemandQA Europe')
    expect(status(harness, 'identity')).toBe('Completed, Unsaved changes')
  })

  it('counts the required cells of array rows without making their section required', async () => {
    const harness = await mountPage({
      input: { name: 'DemandQA' },
      schema: defineFormPageSchema({
        actions: [{ key: 'submit', label: 'Créer' }],
        sections: [
          identitySection(),
          defineFormPageSection({
            fields: [
              {
                fields: [{ key: 'label', label: 'Libellé', required: true, type: 'text' }],
                key: 'targets',
                type: 'array-table',
              },
            ],
            key: 'targets',
            label: 'Engagements',
          }),
        ],
      }),
    })

    expect(harness.entry('targets').dataset.state).toBe('optional')
    expect(optionalTag(harness, 'targets')).not.toBeNull()
    expect(harness.summary()).toBe('Tout est prêt.')

    harness.form.state.set('targets', [{ label: '' }])
    await harness.flush()
    expect(harness.entry('targets').dataset.state).toBe('pending')
    // A row was added and left incomplete: the section blocks the submit, so it is no longer
    // presented as optional.
    expect(optionalTag(harness, 'targets')).toBeNull()
    expect(harness.summary()).toBe('1 section à compléter.')

    harness.form.state.set('targets', [{ label: 'Année 1' }])
    await harness.flush()
    expect(harness.entry('targets').dataset.state).toBe('complete')
    expect(harness.summary()).toBe('Tout est prêt.')
  })

  it('keeps an array section required when it declares optional: false', async () => {
    const harness = await mountPage({
      input: { name: 'DemandQA', versions: [{ label: '' }] },
      schema: defineFormPageSchema({
        actions: [{ key: 'submit', label: 'Créer' }],
        sections: [
          identitySection(),
          defineFormPageSection({
            fields: [
              {
                fields: [{ key: 'label', label: 'Libellé', required: true, type: 'text' }],
                key: 'versions',
                type: 'array-table',
              },
            ],
            key: 'versions',
            label: 'Versions',
            optional: false,
          }),
        ],
      }),
    })

    expect(harness.entry('versions').dataset.state).toBe('pending')
    expect(optionalTag(harness, 'versions')).toBeNull()
    expect(harness.summary()).toBe('1 section à compléter.')

    harness.form.state.set('versions', [{ label: 'Standard' }])
    await harness.flush()
    expect(harness.entry('versions').dataset.state).toBe('complete')
    expect(harness.summary()).toBe('Tout est prêt.')
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
    expect(harness.entry('billing').dataset.state).toBe('optional')
  })

  it('makes the section of the field that takes focus the current one', async () => {
    const harness = await mountPage({ input: { accountType: 'customer' }, schema: accountSchema() })

    // Submit focuses the first invalid field: the name, in the identity section.
    await harness.wrapper.find('form').trigger('submit')
    await harness.flush()

    expect(harness.section('identity').contains(document.activeElement)).toBe(true)
    expect(harness.entry('identity').getAttribute('aria-current')).toBe('location')

    harness.section('billing').querySelector('input')?.focus()
    await harness.flush()

    expect(harness.entry('billing').getAttribute('aria-current')).toBe('location')
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

describe('form page surface', () => {
  it('draws each section as a bordered card on a gray canvas by default', async () => {
    const harness = await mountPage({ schema: accountSchema() })

    expect(surfaceOf(harness)).toBe('card')
    expect(harness.wrapper.find('[data-form-page]').classes()).toContain('bg-muted')
    for (const key of ['type', 'identity', 'billing']) {
      expect(harness.section(key).classList).toContain('rounded-xl')
      expect(harness.section(key).classList).toContain('border')
      expect(harness.section(key).classList).toContain('bg-default')
    }
  })

  it('draws plain sections without a box, apart by spacing and a hairline', async () => {
    const harness = await mountPage({
      schema: accountSchema({ ui: { page: { surface: 'plain' } } }),
    })
    const sections = harness.wrapper.find('[data-form-page-sections]')

    expect(surfaceOf(harness)).toBe('plain')
    expect(harness.wrapper.find('[data-form-page]').classes()).toContain('bg-default')
    expect(harness.wrapper.find('[data-form-page]').classes()).not.toContain('bg-muted')
    expect(sections.classes()).toContain('gap-0')
    for (const key of ['type', 'identity', 'billing']) {
      const classes = harness.section(key).classList
      expect(classes).toContain('border-t')
      expect(classes).toContain('py-8')
      expect(classes).not.toContain('rounded-xl')
      expect(classes).not.toContain('bg-default')
    }
    // The heading, description, and fields are still there.
    expect(harness.section('type').querySelector('h2')?.textContent?.trim()).toBe('Type de compte')
    expect(harness.section('type').textContent).toContain('le type conditionne les champs')
    expect(harness.section('identity').querySelector('[data-form-field="name"]')).not.toBeNull()
    // The description sits under the title on a plain section whatever the page width.
    const description = harness.section('type').querySelector('p')
    expect(description?.classList).toContain('basis-full')
    expect(description?.classList).not.toContain('@3xl/form-page:basis-auto')
  })

  it('layers the surface over app config, schema ui, and the page ui prop', async () => {
    const plain: FormUiConfig = { page: { surface: 'plain' } }
    const card: FormUiConfig = { page: { surface: 'card' } }
    const appConfig = { nuxtUiTools: { form: plain } }

    const fromApp = await mountPage({ appConfig, schema: accountSchema() })
    expect(surfaceOf(fromApp)).toBe('plain')
    unmountPage()

    const schemaOverApp = await mountPage({ appConfig, schema: accountSchema({ ui: card }) })
    expect(surfaceOf(schemaOverApp)).toBe('card')
    unmountPage()

    const propOverSchema = await mountPage({ schema: accountSchema({ ui: card }), ui: plain })
    expect(surfaceOf(propOverSchema)).toBe('plain')
    unmountPage()

    // A layer that only restyles slots keeps the surface of the layers below.
    const slotsOnly = await mountPage({
      appConfig,
      schema: accountSchema({ ui: { page: { ui: { section: 'py-4' } } } }),
    })
    expect(surfaceOf(slotsOnly)).toBe('plain')
    expect(slotsOnly.section('identity').classList).toContain('py-4')
    expect(slotsOnly.section('identity').classList).not.toContain('py-8')
  })

  it('marks and resets a modified plain section like a card', async () => {
    const harness = await mountPage({
      input: { accountType: 'customer', name: 'DemandQA' },
      schema: accountSchema({ dirtyCheck: true, ui: { page: { surface: 'plain' } } }),
    })

    expect(harness.section('identity').dataset.dirty).toBeUndefined()
    await harness.setValue('name', 'DemandQA Europe')
    expect(harness.section('identity').dataset.dirty).toBe('true')
    // The bar in the margin is the only mark a plain section has: it follows the data attribute.
    expect(harness.section('identity').className).toContain('data-[dirty]:before:bg-primary')

    await harness.wrapper
      .find('[data-form-page-section="identity"] [data-form-page-reset]')
      .trigger('click')
    await harness.flush()
    expect(harness.form.state.get('name')).toBe('DemandQA')
    expect(harness.section('identity').dataset.dirty).toBeUndefined()
  })

  it('draws the loading skeletons without a box on a plain page', async () => {
    const harness = await mountPage({
      schema: defineFormPageSchema({
        context: {
          centers: {
            queryFn: () => new Promise<readonly string[]>(() => undefined),
            queryKey: ['page-surface', 'centers'],
          },
        },
        sections: [identitySection(), billingSection()],
        ui: { page: { surface: 'plain' } },
      }),
    })
    const skeletons = [...harness.wrapper.element.querySelectorAll('[data-form-skeleton]')]

    expect(skeletons).toHaveLength(2)
    for (const skeleton of skeletons) {
      expect(skeleton.classList).toContain('border-t')
      expect(skeleton.classList).not.toContain('rounded-xl')
    }
  })
})

describe('form page navigation threshold', () => {
  it('shows the navigation beside the sections by default', async () => {
    const harness = await mountPage({ schema: accountSchema() })

    expect(harness.wrapper.find('[data-form-page-navigation]').exists()).toBe(true)
    expect(pageBody(harness)?.classList).toContain('grid')
    expect(pageBody(harness)?.classList).not.toContain('mx-auto')
  })

  it('shows it once the page has the minimum number of sections', async () => {
    const harness = await mountPage({ schema: accountSchema({ minSections: 4 }) })

    expect(sectionKeys(harness)).toHaveLength(4)
    expect(harness.wrapper.find('[data-form-page-navigation]').exists()).toBe(true)
    expect(pageBody(harness)?.classList).not.toContain('mx-auto')
  })

  it('leaves the navigation out of a page with fewer sections, in one centered column', async () => {
    const harness = await mountPage({ schema: accountSchema({ minSections: 5 }) })

    expect(harness.wrapper.find('[data-form-page-navigation]').exists()).toBe(false)
    expect(harness.wrapper.find('[data-form-page-summary]').exists()).toBe(false)
    expect(sectionKeys(harness)).toStrictEqual(['type', 'identity', 'billing', 'documents'])
    expect(pageBody(harness)?.classList).toContain('mx-auto')
    expect(pageBody(harness)?.classList).toContain('max-w-[816px]')
    // The page still validates and submits without it.
    expect(harness.wrapper.find('[data-form-page-actions]').text()).toContain('Créer le compte')
  })

  it('gives the header row the same centered column as the body', async () => {
    const harness = await mountPage({ schema: accountSchema({ minSections: 5 }) })
    const row = harness.wrapper.find('[data-form-page-header-row]').element

    for (const name of ['mx-auto', 'w-full', 'max-w-[816px]']) {
      expect(row.classList).toContain(name)
      expect(pageBody(harness)?.classList).toContain(name)
    }
    expect(harness.wrapper.find('[data-form-page-header]').element.classList).not.toContain('px-4')
  })

  it('leaves the header of the beside layout as it was', async () => {
    const harness = await mountPage({ schema: accountSchema() })
    const header = harness.wrapper.find('[data-form-page-header]').element
    const row = harness.wrapper.find('[data-form-page-header-row]').element

    expect(row.classList).toContain('contents')
    expect(row.classList).not.toContain('max-w-[816px]')
    expect(header.classList).toContain('px-4')
    expect(header.classList).toContain('@3xl/form-page:justify-between')
  })

  it('counts the visible sections, so a condition can bring the navigation back', async () => {
    const harness = await mountPage({
      input: { accountType: 'testCenter' },
      schema: accountSchema({ minSections: 4 }),
    })

    // The documents section is hidden for a test center: three sections are left.
    expect(sectionKeys(harness)).toStrictEqual(['type', 'identity', 'billing'])
    expect(harness.wrapper.find('[data-form-page-navigation]').exists()).toBe(false)

    harness.form.state.set('accountType', 'customer')
    await harness.flush()
    expect(sectionKeys(harness)).toHaveLength(4)
    expect(harness.wrapper.find('[data-form-page-navigation]').exists()).toBe(true)
    expect(pageBody(harness)?.classList).not.toContain('mx-auto')
  })

  it('renders no navigation part in a custom layout while below the threshold', async () => {
    const harness = await mountPage({
      layout: () => [h(FormPageSections), h(FormPageNavigation)],
      schema: accountSchema({ minSections: 5 }),
    })

    expect(harness.wrapper.find('[data-form-page-sections]').exists()).toBe(true)
    expect(harness.wrapper.find('[data-form-page-navigation]').exists()).toBe(false)
  })
})

function spanSchema(ui?: FormUiConfig) {
  return defineFormPageSchema({
    sections: [
      defineFormPageSection({
        fields: [{ key: 'kind', label: 'Type', required: true, type: 'text' }],
        key: 'profile',
        label: 'Profil',
        span: 4,
      }),
      defineFormPageSection({
        fields: [
          { key: 'name', label: 'Nom', required: true, type: 'text' },
          { key: 'legal', label: 'Entité', required: true, type: 'text' },
        ],
        key: 'identity',
        label: 'Identité',
        span: 8,
      }),
      defineFormPageSection({
        fields: [{ key: 'note', label: 'Note', type: 'text' }],
        key: 'notes',
        label: 'Notes',
      }),
    ],
    ui,
  })
}

const spanOf = (harness: PageHarness, key: string) =>
  harness.section(key).style.getPropertyValue('--nut-form-page-section-span')

describe('form page panels, spans and status', () => {
  it('lays sections out in a twelve-column grid once one sets a span', async () => {
    const harness = await mountPage({ schema: spanSchema() })

    expect(harness.wrapper.find('[data-form-page-sections]').classes()).toEqual(
      expect.arrayContaining(['@container/form-sections', 'grid', 'grid-cols-12']),
    )
    expect(spanOf(harness, 'profile')).toBe('4')
    expect(spanOf(harness, 'identity')).toBe('8')
    // A section without a span takes the whole row.
    expect(spanOf(harness, 'notes')).toBe('12')
    for (const key of ['profile', 'identity', 'notes']) {
      // Full row until the sections area is wide enough for the span.
      expect(harness.section(key).classList).toContain('col-span-12')
      expect(harness.section(key).classList).toContain(
        '@3xl/form-sections:col-span-(--nut-form-page-section-span)',
      )
    }
  })

  it('keeps the column of sections when none sets a span', async () => {
    const harness = await mountPage({ schema: accountSchema() })
    const sections = harness.wrapper.find('[data-form-page-sections]')

    expect(sections.classes()).toContain('flex')
    expect(sections.classes()).not.toContain('grid-cols-12')
    expect(harness.section('identity').classList).not.toContain('col-span-12')
    expect(spanOf(harness, 'identity')).toBe('')
  })

  it('draws panels: a heading bar across the top, the fields padded below it', async () => {
    const harness = await mountPage({ schema: spanSchema({ page: { surface: 'panel' } }) })
    const section = harness.section('identity')
    const header = section.querySelector('header')

    expect(surfaceOf(harness)).toBe('panel')
    expect(harness.wrapper.find('[data-form-page]').classes()).toContain('bg-muted')
    expect([...section.classList]).toEqual(
      expect.arrayContaining(['overflow-hidden', 'rounded-xl', 'border', 'bg-default']),
    )
    expect([...(header?.classList ?? [])]).toEqual(
      expect.arrayContaining(['border-b', 'bg-elevated/60', 'px-4']),
    )
    expect(header?.nextElementSibling?.classList).toContain('px-5')
    expect(header?.nextElementSibling?.querySelector('[data-form-field="name"]')).not.toBeNull()
  })

  it('shows where each section stands at the end of its heading with page.status', async () => {
    const harness = await mountPage({ schema: spanSchema({ page: { status: true } }) })
    const badge = (key: string) => harness.section(key).querySelector('[data-form-page-status]')

    expect(badge('identity')?.textContent?.trim()).toBe('0 sur 2')
    expect(badge('identity')?.getAttribute('data-form-page-status')).toBe('pending')
    // An optional section with nothing entered shows its tag in the same place, once.
    expect(badge('notes')?.textContent?.trim()).toBe('Facultatif')
    expect(badge('notes')?.getAttribute('data-form-page-status')).toBe('optional')
    expect(harness.section('notes').querySelectorAll('[data-form-page-optional]')).toHaveLength(1)

    await harness.setValue('name', 'Lingua Formation')
    expect(badge('identity')?.textContent?.trim()).toBe('1 sur 2')
    await harness.setValue('legal', 'Lingua Formation SAS')
    expect(badge('identity')?.textContent?.trim()).toBe('Complété')
    expect(badge('identity')?.getAttribute('data-form-page-status')).toBe('complete')

    await harness.wrapper.find('[data-form-field="kind"] input').trigger('blur')
    await harness.flush()
    expect(badge('profile')?.textContent?.trim()).toBe('À corriger')
    expect(badge('profile')?.getAttribute('data-form-page-status')).toBe('invalid')
  })

  it('keeps the status at the end of the heading, with the reset button before it', async () => {
    const harness = await mountPage({
      schema: defineFormPageSchema({
        controls: { dirtyCheck: true },
        sections: spanSchema().sections,
        ui: { page: { status: true } },
      }),
    })
    const actions = harness
      .section('identity')
      .querySelector('[data-form-page-status]')?.parentElement

    expect(actions?.lastElementChild?.hasAttribute('data-form-page-status')).toBe(true)
    expect(actions?.querySelector('button')?.textContent).toContain('Réinitialiser')
  })

  it('leaves the heading without a status by default', async () => {
    const harness = await mountPage({ schema: spanSchema() })

    expect(harness.wrapper.find('[data-form-page-status]').exists()).toBe(false)
  })
})
