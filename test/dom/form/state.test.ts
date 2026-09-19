import { describe, expect, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'
import type { FormFieldApi } from '#ui-tools/form'
import { isOneOf, isString } from '#ui-tools/shared/utils/predicate'

import { mountForm } from './harness'

describe('form state', () => {
  it('transforms input from sibling baseline values and keeps the baseline in sync', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'type',
          options: ['COMPANY', 'PUBLIC', 'ASSOCIATION'],
          transform: {
            input: (value, { api }) => {
              const candidate = api.form.initial('meta.companyType') ?? value
              return isOneOf(['COMPANY', 'PUBLIC', 'ASSOCIATION'])(candidate) ? candidate : null
            },
          },
          type: 'radio',
        },
        { key: 'meta.companyType', type: 'hidden' },
      ],
    })
    const harness = await mountForm({
      input: { meta: { companyType: 'PUBLIC' }, type: 'COMPANY' },
      schema,
      syncInput: true,
    })

    expect(harness.output()).toStrictEqual({ meta: { companyType: 'PUBLIC' }, type: 'PUBLIC' })
    expect(harness.form.isDirty.value).toBeFalsy()

    await harness.setInputValue({ meta: { companyType: 'ASSOCIATION' }, type: 'COMPANY' })
    expect(harness.form.state.get('type')).toBe('ASSOCIATION')

    harness.form.state.set('type', 'PUBLIC')
    await harness.flush()
    expect(harness.form.isDirty.value).toBeTruthy()

    await harness.form.reset()
    expect(harness.form.state.internal.value).toStrictEqual({
      meta: { companyType: 'ASSOCIATION' },
      type: 'ASSOCIATION',
    })
    harness.unmount()
  })

  it('transforms rooted step fields from parent-relative baseline values', async () => {
    const schema = defineFormSchema({
      steps: [
        {
          fields: [
            {
              key: 'type',
              options: ['COMPANY', 'PUBLIC'],
              transform: {
                input: (value, { api }) => {
                  const companyType = api.form.initial('$parent.companyType')
                  return isOneOf(['COMPANY', 'PUBLIC'])(companyType) ? companyType : null
                },
              },
              type: 'radio',
            },
            { key: 'companyType', type: 'hidden' },
          ],
          root: 'organisation',
        },
      ],
    })
    const harness = await mountForm({
      input: { organisation: { companyType: 'PUBLIC', type: 'COMPANY' } },
      schema,
    })

    expect(harness.form.state.get('organisation.type')).toBe('PUBLIC')
    expect(harness.output()).toStrictEqual({
      organisation: { companyType: 'PUBLIC', type: 'PUBLIC' },
    })
    harness.unmount()
  })

  it('resolves defaults from the transformed baseline', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'source',
          transform: { input: (value) => (isString(value) ? value.toUpperCase() : value) },
          type: 'hidden',
        },
        {
          default: ({ api }: { api: FormFieldApi }) => api.form.initial('source'),
          key: 'derived',
          type: 'hidden',
        },
      ],
    })
    const harness = await mountForm({ input: { source: 'initial' }, schema })

    expect(harness.output()).toStrictEqual({ derived: 'INITIAL', source: 'INITIAL' })
    expect(harness.form.isDirty.value).toBeFalsy()
    harness.unmount()
  })

  it('projects output from the baseline and the current state', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'source', type: 'text' },
        {
          key: 'projection',
          transform: {
            output: (_value, { api }) =>
              `${String(api.form.initial('source'))}:${String(api.form.get('source'))}`,
          },
          type: 'hidden',
        },
      ],
    })
    const harness = await mountForm({ input: { source: 'initial' }, schema })

    expect(harness.output().projection).toBe('initial:initial')
    await harness.setInput('source', 'edited')
    expect(harness.output().projection).toBe('initial:edited')
    expect(harness.form.isDirty.value).toBeTruthy()
    harness.unmount()
  })

  it('tracks nested values changed through the field api', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [{ key: 'meta.mainLanguage', type: 'hidden' }],
    })
    const harness = await mountForm({ input: { meta: { mainLanguage: 'fr' } }, schema })

    harness.form.state.set('meta.mainLanguage', 'nl')
    await harness.flush()

    expect(harness.form.state.internal.value).toStrictEqual({ meta: { mainLanguage: 'nl' } })
    expect(harness.form.dirtyPaths.value).toStrictEqual(['meta.mainLanguage'])
    expect(harness.form.isDirty.value).toBeTruthy()
    harness.unmount()
  })

  it('builds fixed matrix rows from ordinary field definitions', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          fields: [
            { key: 'enabled', type: 'switch' },
            { default: 'read', key: 'level', options: ['read', 'write'], type: 'select' },
            {
              default: '',
              key: 'note',
              transform: { output: (value: string | null) => (value ?? '').trim() },
              type: 'text',
            },
          ],
          key: 'permissions',
          rows: [
            { key: 'buyers', label: 'Buyers' },
            { key: 'sellers', label: 'Sellers' },
          ],
          type: 'matrix',
        },
      ],
    })
    const harness = await mountForm({
      input: { permissions: { buyers: { enabled: true, level: 'write', note: '  Priority  ' } } },
      schema,
    })

    expect(harness.output().permissions).toStrictEqual({
      buyers: { enabled: true, level: 'write', note: 'Priority' },
      sellers: { enabled: false, level: 'read', note: '' },
    })
    harness.unmount()
  })

  it('clears a sibling field through the field form api without touching its own value', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'template',
          type: 'text',
          watch: ({ api }) => api.form.set('endDate', null),
        },
        { key: 'endDate', type: 'date' },
      ],
    })
    const harness = await mountForm({
      input: { endDate: '2026-12-31', template: 'template-1' },
      schema,
    })

    await harness.setInput('template', 'template-2')
    expect(harness.form.state.get('template')).toBe('template-2')
    expect(harness.form.state.get('endDate')).toBeNull()
    harness.unmount()
  })

  it('hydrates deeply nested dotted keys without applying their defaults', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { default: false, key: 'indexedMeta.onboarding.legacy.blocked', type: 'switch' },
        { default: false, key: 'indexedMeta.onboarding.legacy.purchases', type: 'switch' },
      ],
    })
    const harness = await mountForm({
      input: { indexedMeta: { onboarding: { legacy: { blocked: true, purchases: true } } } },
      schema,
    })

    expect(harness.form.state.internal.value).toStrictEqual({
      indexedMeta: { onboarding: { legacy: { blocked: true, purchases: true } } },
    })
    expect(harness.form.dirtyPaths.value).toStrictEqual([])
    harness.unmount()
  })

  it('excludes ignored dirty paths from the dirty state', async () => {
    const schema = defineFormSchema({
      actions: [],
      controls: { ignoreDirtyPaths: ['resolvedAncestors'] },
      fields: [
        { key: 'parent', type: 'text' },
        {
          dependencies: ['parent'],
          key: 'resolvedAncestors',
          onDependencyChange: ({ api, deps }) =>
            api.value.set([`ancestor:${String('parent' in deps ? deps.parent : '')}`]),
          type: 'hidden',
        },
      ],
    })
    const harness = await mountForm({
      input: { parent: 'parent-one', resolvedAncestors: ['ancestor:parent-one'] },
      schema,
    })

    await harness.setInput('parent', 'parent-two')
    await harness.until(
      () =>
        JSON.stringify(harness.form.state.get('resolvedAncestors')) === '["ancestor:parent-two"]',
    )
    expect(harness.form.dirtyPaths.value).toStrictEqual(['parent'])
    harness.unmount()
  })
})

describe('form input synchronization', () => {
  it('keeps local edits when the input is replaced without sync', async () => {
    const schema = defineFormSchema({ actions: [], fields: [{ key: 'name', type: 'text' }] })
    const harness = await mountForm({ input: { name: 'before' }, schema })

    await harness.setInput('name', 'local draft')
    await harness.setInputValue({ name: 'background refresh' })

    expect(harness.form.state.get('name')).toBe('local draft')
    expect(harness.form.dirtyPaths.value).toStrictEqual(['name'])
    harness.unmount()
  })

  it('preserves state when sync is enabled after an edit without a new input', async () => {
    const schema = defineFormSchema({ actions: [], fields: [{ key: 'name', type: 'text' }] })
    const harness = await mountForm({ input: { name: 'before' }, schema })

    await harness.setInput('name', 'local draft')
    await harness.setSyncInput(true)

    expect(harness.form.state.get('name')).toBe('local draft')
    expect(harness.form.dirtyPaths.value).toStrictEqual(['name'])
    harness.unmount()
  })

  it('hydrates the latest input when sync turns on after a replacement', async () => {
    const schema = defineFormSchema({ actions: [], fields: [{ key: 'name', type: 'text' }] })
    const harness = await mountForm({ input: { name: 'before' }, schema })

    await harness.setInput('name', 'local draft')
    await harness.setInputValue({ name: 'saved by the server' })
    expect(harness.form.state.get('name')).toBe('local draft')

    await harness.setSyncInput(true)

    expect(harness.form.state.get('name')).toBe('saved by the server')
    expect(harness.form.dirtyPaths.value).toStrictEqual([])
    harness.unmount()
  })

  it('replaces nested state and removes stale server fields when syncing everything', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'name', type: 'text' },
        { key: 'meta.companyType', type: 'text' },
        { key: 'meta.establishmentNumber', type: 'text' },
      ],
    })
    const harness = await mountForm({
      input: { meta: { companyType: 'PRIVATE', establishmentNumber: '1234' }, name: 'Before' },
      schema,
      syncInput: true,
    })

    await harness.setInputValue({ meta: { companyType: 'PUBLIC' }, name: 'After' })

    expect(harness.form.state.internal.value).toStrictEqual({
      meta: { companyType: 'PUBLIC', establishmentNumber: null },
      name: 'After',
    })
    expect(harness.form.dirtyPaths.value).toStrictEqual([])
    harness.unmount()
  })

  it('syncs only declared paths without touching other edited values', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'name', type: 'text' },
        { key: 'note', type: 'text' },
      ],
    })
    const harness = await mountForm({
      input: { name: 'before', note: 'initial note' },
      schema,
      syncInput: ['name'],
    })

    harness.form.state.set('note', 'edited note')
    await harness.setInputValue({ name: 'after', note: 'new server note' })

    expect(harness.form.state.internal.value).toStrictEqual({ name: 'after', note: 'edited note' })
    expect(harness.form.dirtyPaths.value).toStrictEqual(['note'])
    harness.unmount()
  })
})
