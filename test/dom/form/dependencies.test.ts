import { describe, expect, it, vi } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'
import type { FormValue } from '#ui-tools/form'
import { isRecord } from '#ui-tools/shared/utils/path'
import { isString } from '#ui-tools/shared/utils/predicate'

import { mountForm } from './harness'

function text(value: FormValue) {
  return isString(value) ? value : String(value ?? '')
}

function releasable() {
  const releases = new Map<string, () => void>()
  function wait(key: string) {
    // oxlint-disable-next-line avoid-new -- the test releases handlers by hand
    return new Promise<void>((resolve) => {
      releases.set(key, resolve)
    })
  }
  return { releases, wait }
}

describe('form dependency state', () => {
  it('runs synchronous dependency changes after user input and keeps them dirty', async () => {
    const dependencyChange = vi.fn<() => void>()
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'source', type: 'text' },
        {
          dependencies: ['source'],
          key: 'resolved',
          onDependencyChange({ api, deps }) {
            dependencyChange()
            api.value.set(`resolved:${text('source' in deps ? deps.source : '')}`)
          },
          type: 'hidden',
        },
      ],
    })
    const harness = await mountForm({
      input: { resolved: 'initial-resolution', source: 'original' },
      schema,
    })

    expect(dependencyChange).not.toHaveBeenCalled()
    await harness.setInput('source', 'edited')
    await harness.until(() => harness.form.state.get('resolved') === 'resolved:edited')

    expect(harness.form.isDirty.value).toBeTruthy()
    expect(harness.form.dirtyPaths.value).toStrictEqual(
      expect.arrayContaining(['resolved', 'source']),
    )
    harness.unmount()
  })

  it('preserves explicit values while guarded dependencies autofill empty fields', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'meta.type', placeholder: 'Type', type: 'text' },
        {
          dependencies: [['meta.type', 'type']],
          key: 'meta.name',
          onDependencyChange({ api, deps }) {
            const type = 'type' in deps ? deps.type : null
            if (api.value.get() || !type) {
              return
            }
            api.value.set(`Default ${text(type)}`)
          },
          placeholder: 'Name',
          type: 'text',
        },
      ],
    })
    const harness = await mountForm({
      input: { meta: { name: 'Existing name', type: 'pickup' } },
      schema,
    })

    await harness.setInput('meta.type', 'delivery')
    expect(harness.form.state.get('meta.name')).toBe('Existing name')

    await harness.setInput('meta.name', '')
    await harness.setInput('meta.type', 'billing')
    await harness.until(() => harness.form.state.get('meta.name') === 'Default billing')
    expect(harness.form.dirtyPaths.value).toStrictEqual(
      expect.arrayContaining(['meta.name', 'meta.type']),
    )
    harness.unmount()
  })

  it('reacts dependency-driven rendering, disabling, and placeholders to user input', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'mode', placeholder: 'Mode', type: 'text' },
        {
          condition: ({ deps }) => ('mode' in deps ? deps.mode : null) !== 'hidden',
          dependencies: ['mode'],
          disabled: ({ deps }) => ('mode' in deps ? deps.mode : null) === 'locked',
          key: 'details',
          placeholder: ({ deps }) => `Mode ${text('mode' in deps ? deps.mode : '')}`,
          type: 'text',
        },
      ],
    })
    const harness = await mountForm({
      input: { details: 'Visible details', mode: 'visible' },
      schema,
    })

    expect(harness.wrapper.findAll('input[type="text"]')).toHaveLength(2)
    await harness.setInput('mode', 'hidden')
    expect(harness.wrapper.findAll('input[type="text"]')).toHaveLength(1)

    await harness.setInput('mode', 'locked')
    expect(harness.control('details').attributes('disabled')).toBeDefined()
    expect(harness.control('details').attributes('placeholder')).toBe('Mode locked')
    expect(harness.form.dirtyPaths.value).toStrictEqual(['mode'])
    harness.unmount()
  })

  it('derives a dotted sibling only after every declared source is complete', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'meta.number', placeholder: 'Number', type: 'text' },
        { key: 'meta.street', placeholder: 'Street', type: 'text' },
        { key: 'meta.city', placeholder: 'City', type: 'text' },
        {
          dependencies: [
            ['meta.number', 'number'],
            ['meta.street', 'street'],
            ['meta.city', 'city'],
          ],
          key: 'geoCode.formattedAddress',
          onDependencyChange({ api, deps }) {
            const number = 'number' in deps ? deps.number : null
            const street = 'street' in deps ? deps.street : null
            const city = 'city' in deps ? deps.city : null
            if (!number || !street || !city) {
              return
            }
            api.form.set(
              'geoCode.formattedAddress',
              `${text(number)} ${text(street)}, ${text(city)}`,
            )
          },
          type: 'hidden',
        },
      ],
    })
    const harness = await mountForm({
      input: { geoCode: { formattedAddress: '' }, meta: { city: '', number: '', street: '' } },
      schema,
    })

    await harness.setInput('meta.number', '12')
    await harness.setInput('meta.street', 'Market Street')
    expect(harness.form.state.get('geoCode.formattedAddress')).toBe('')

    await harness.setInput('meta.city', 'Paris')
    await harness.until(
      () => harness.form.state.get('geoCode.formattedAddress') === '12 Market Street, Paris',
    )
    expect(harness.form.dirtyPaths.value).toStrictEqual(
      expect.arrayContaining([
        'geoCode.formattedAddress',
        'meta.city',
        'meta.number',
        'meta.street',
      ]),
    )
    harness.unmount()
  })
})

describe('form dependency reset', () => {
  it('restores the baseline, replays chained handlers, and ends clean', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'source', type: 'text' },
        {
          dependencies: ['source'],
          key: 'intermediate',
          onDependencyChange: ({ api, deps }) =>
            api.value.set(`intermediate:${text('source' in deps ? deps.source : '')}`),
          type: 'hidden',
        },
        {
          dependencies: ['intermediate'],
          key: 'resolved',
          onDependencyChange: ({ api, deps }) =>
            api.value.set(`resolved:${text('intermediate' in deps ? deps.intermediate : '')}`),
          type: 'hidden',
        },
      ],
    })
    const harness = await mountForm({
      input: {
        intermediate: 'initial-intermediate',
        resolved: 'initial-resolution',
        source: 'original',
      },
      schema,
    })

    await harness.setInput('source', 'edited')
    await harness.until(() => harness.form.state.get('resolved') === 'resolved:intermediate:edited')

    await harness.form.reset()

    expect(harness.form.state.internal.value).toStrictEqual({
      intermediate: 'intermediate:original',
      resolved: 'resolved:intermediate:original',
      source: 'original',
    })
    expect(harness.form.dirtyPaths.value).toStrictEqual([])
    harness.unmount()
  })

  it('replays handlers that write dotted sibling fields and ends clean', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'source', type: 'text' },
        {
          dependencies: ['source'],
          key: 'summary',
          onDependencyChange({ api, deps }) {
            const source = text('source' in deps ? deps.source : '')
            api.value.set(`summary:${source}`)
            api.form.set('meta.first', `first:${source}`)
            api.form.set('meta.second', `second:${source}`)
          },
          type: 'hidden',
        },
        { key: 'meta.first', type: 'hidden' },
        { key: 'meta.second', type: 'hidden' },
      ],
    })
    const harness = await mountForm({
      input: {
        meta: { first: 'initial first', second: 'initial second' },
        source: 'original',
        summary: 'initial summary',
      },
      schema,
    })

    await harness.setInput('source', 'edited')
    await harness.until(() => harness.form.state.get('meta.second') === 'second:edited')

    await harness.form.reset()

    expect(harness.form.state.internal.value).toStrictEqual({
      meta: { first: 'first:original', second: 'second:original' },
      source: 'original',
      summary: 'summary:original',
    })
    expect(harness.form.isDirty.value).toBeFalsy()
    harness.unmount()
  })

  it('waits for the latest guarded asynchronous dependency before finishing', async () => {
    const { releases, wait } = releasable()
    let latestRequest = ''
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'source', type: 'text' },
        {
          dependencies: ['source'],
          key: 'resolved',
          async onDependencyChange({ api, deps }) {
            const request = text('source' in deps ? deps.source : '')
            latestRequest = request
            await wait(request)
            if (latestRequest === request) {
              api.value.set(`resolved:${request}`)
            }
          },
          type: 'hidden',
        },
      ],
    })
    const harness = await mountForm({
      input: { resolved: 'initial-resolution', source: 'original' },
      schema,
    })

    await harness.setInput('source', 'edited')
    await harness.until(() => releases.has('edited'))

    const reset = harness.form.reset()
    await harness.until(() => releases.has('original'))
    expect(harness.form.actionPending.value).toBe('reset')
    expect(harness.control('source').attributes('disabled')).toBeDefined()

    releases.get('edited')?.()
    releases.get('original')?.()
    await reset
    await harness.flush()

    expect(harness.form.state.get('resolved')).toBe('resolved:original')
    expect(harness.form.isDirty.value).toBeFalsy()
    expect(harness.control('source').attributes('disabled')).toBeUndefined()
    harness.unmount()
  })

  it('waits for asynchronous work enqueued by another dependency', async () => {
    const intermediate = releasable()
    const resolved = releasable()
    const schema = defineFormSchema({
      actions: [],
      fields: [
        { key: 'source', type: 'text' },
        {
          dependencies: ['source'],
          key: 'intermediate',
          async onDependencyChange({ api, deps }) {
            const source = text('source' in deps ? deps.source : '')
            await intermediate.wait(source)
            api.value.set(`intermediate:${source}`)
          },
          type: 'hidden',
        },
        {
          dependencies: ['intermediate'],
          key: 'resolved',
          async onDependencyChange({ api, deps }) {
            const value = text('intermediate' in deps ? deps.intermediate : '')
            await resolved.wait(value)
            api.value.set(`resolved:${value}`)
          },
          type: 'hidden',
        },
      ],
    })
    const harness = await mountForm({
      input: {
        intermediate: 'initial-intermediate',
        resolved: 'initial-resolution',
        source: 'original',
      },
      schema,
    })

    await harness.setInput('source', 'edited')
    await harness.until(() => intermediate.releases.has('edited'))
    intermediate.releases.get('edited')?.()
    await harness.until(() => resolved.releases.has('intermediate:edited'))
    resolved.releases.get('intermediate:edited')?.()
    await harness.until(() => harness.form.state.get('resolved') === 'resolved:intermediate:edited')

    let resetFinished = false
    const reset = harness.form.reset().then(() => {
      resetFinished = true
    })
    await harness.until(() => intermediate.releases.has('original'))
    await harness.until(() => resolved.releases.has('initial-intermediate'))
    resolved.releases.get('initial-intermediate')?.()
    intermediate.releases.get('original')?.()
    await harness.until(() => resolved.releases.has('intermediate:original'))
    expect(resetFinished).toBeFalsy()

    resolved.releases.get('intermediate:original')?.()
    await reset

    expect(harness.form.state.internal.value).toStrictEqual({
      intermediate: 'intermediate:original',
      resolved: 'resolved:intermediate:original',
      source: 'original',
    })
    expect(harness.form.dirtyPaths.value).toStrictEqual([])
    harness.unmount()
  })

  it('preserves option-derived behaviour across reset', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          key: 'category',
          options: [
            { label: 'Category one', value: 'one' },
            { label: 'Category two', value: 'two' },
          ],
          type: 'select',
        },
        {
          dependencies: ['category'],
          key: 'categoryLabel',
          onDependencyChange({ api, deps }) {
            const category = 'category' in deps ? deps.category : null
            const options = api.form.get('category') === null ? [] : api.options.get()
            const selected = options.find((option) => isRecord(option) && option.value === category)
            api.value.set(isRecord(selected) ? text(selected.label) : '')
          },
          type: 'hidden',
        },
      ],
    })
    const harness = await mountForm({
      input: { category: 'one', categoryLabel: 'initial label' },
      schema,
    })

    harness.form.state.set('category', 'two')
    await harness.flush()
    await harness.form.reset()

    expect(harness.form.state.get('category')).toBe('one')
    expect(harness.form.isDirty.value).toBeFalsy()
    harness.unmount()
  })

  it('restores parent-relative dependencies inside nested fields', async () => {
    const schema = defineFormSchema({
      actions: [],
      fields: [
        {
          fields: [
            { key: 'mode', type: 'text' },
            {
              dependencies: [['$parent:0.mode', 'mode']],
              fields: [{ key: 'label', type: 'text' }],
              key: 'lines',
              onDependencyChange: ({ api, deps }) =>
                api.value.set([{ label: `line:${text('mode' in deps ? deps.mode : '')}` }]),
              type: 'array-table',
            },
          ],
          key: 'block',
          type: 'object',
        },
      ],
    })
    const harness = await mountForm({
      input: { block: { lines: [{ label: 'initial line' }], mode: 'original' } },
      schema,
    })

    await harness.setInput('block.mode', 'edited')
    await harness.until(
      () => JSON.stringify(harness.form.state.get('block.lines')) === '[{"label":"line:edited"}]',
    )

    await harness.form.reset()

    expect(harness.form.state.get('block')).toStrictEqual({
      lines: [{ label: 'line:original' }],
      mode: 'original',
    })
    expect(harness.form.dirtyPaths.value).toStrictEqual([])
    harness.unmount()
  })
})
