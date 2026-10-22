import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { mountForm } from './harness'

function ignore() {
  return undefined
}

function deferred<T>() {
  let resolve: (value: T) => void = ignore
  let reject: (reason: Error) => void = ignore
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, reject, resolve }
}

describe('info field display blocks', () => {
  it('follows its dependencies with synchronous props', async () => {
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [
          { default: '2', key: 'seats', label: 'Seats', type: 'text' },
          {
            dependencies: ['seats'],
            display: 'breakdown',
            key: 'quote',
            props: ({ deps }) => ({
              lines: [
                { detail: `${deps.get<string>('seats')} × 96`, label: 'Licences', value: '…' },
              ],
              total: { label: 'Total', value: String(Number(deps.get('seats')) * 96) },
            }),
            type: 'info',
          },
        ],
      }),
    })
    expect(harness.field('quote').text()).toContain('2 × 96')
    await harness.setInput('seats', '3')
    await harness.flush()
    expect(harness.field('quote').text()).toContain('3 × 96')
    expect(harness.field('quote').text()).toContain('288')
    expect(harness.output()).not.toHaveProperty('quote')
    harness.unmount()
  })

  it('keeps drawing a notice from content and props', async () => {
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [
          {
            content: 'Read this first',
            key: 'hint',
            props: { color: 'warning', title: 'Heads up' },
            type: 'info',
          },
        ],
      }),
    })
    const alert = harness.field('hint').find('[data-display="alert"]')
    expect(alert.attributes('data-tone')).toBe('warning')
    expect(alert.text()).toContain('Heads up')
    expect(alert.text()).toContain('Read this first')
    harness.unmount()
  })

  it('shows the skeleton while a promise loads and ignores an answer to an older run', async () => {
    const runs: ReturnType<typeof deferred<{ text: string }>>[] = []
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [
          { default: 'a', key: 'account', label: 'Account', type: 'text' },
          {
            dependencies: ['account'],
            display: 'text',
            key: 'note',
            props: () => {
              const run = deferred<{ text: string }>()
              runs.push(run)
              return run.promise
            },
            type: 'info',
          },
        ],
      }),
    })
    expect(harness.field('note').find('[data-display-skeleton]').exists()).toBe(true)
    await harness.setInput('account', 'b')
    await harness.flush()
    expect(runs).toHaveLength(2)
    runs[1]?.resolve({ text: 'Note of b' })
    await flushPromises()
    runs[0]?.resolve({ text: 'Note of a' })
    await flushPromises()
    await harness.flush()
    expect(harness.field('note').text()).toBe('Note of b')
    harness.unmount()
  })

  it('shows a compact error when loading fails and runs again on retry', async () => {
    let attempt = 0
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [
          {
            display: 'text',
            key: 'note',
            props: () => {
              attempt += 1
              return attempt === 1
                ? Promise.reject(new Error('down'))
                : Promise.resolve({ text: 'Back' })
            },
            type: 'info',
          },
        ],
      }),
    })
    await flushPromises()
    await harness.flush()
    expect(harness.field('note').find('[data-display-error]').exists()).toBe(true)
    await harness.field('note').find('[data-display-retry]').trigger('click')
    await flushPromises()
    await harness.flush()
    expect(attempt).toBe(2)
    expect(harness.field('note').text()).toBe('Back')
    harness.unmount()
  })

  it('loads through query options, cached under their key and mapped by select', async () => {
    const fetchNote = vi.fn(async (account: string) => ({ body: `Note of ${account}` }))
    const noteField = (key: string) => ({
      dependencies: ['account'],
      display: 'text' as const,
      key,
      props: ({ deps }: { deps: { get: <T>(key: string) => T } }) => ({
        queryFn: () => fetchNote(deps.get<string>('account')),
        queryKey: ['notes', deps.get<string>('account')],
        select: (note: { body: string }) => ({ appearance: 'quote' as const, text: note.body }),
      }),
      type: 'info' as const,
    })
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [
          { default: 'acme', key: 'account', label: 'Account', type: 'text' },
          noteField('first'),
          noteField('second'),
        ],
      }),
    })
    await harness.until(() => harness.field('second').text().includes('Note of acme'))
    expect(harness.field('first').find('[data-appearance="quote"]').exists()).toBe(true)
    expect(fetchNote).toHaveBeenCalledOnce()
    await harness.setInput('account', 'globex')
    await harness.until(() => harness.field('first').text().includes('Note of globex'))
    expect(fetchNote).toHaveBeenCalledTimes(2)
    harness.unmount()
  })

  it('passes the form api, so a block action can set a value or close the form', async () => {
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [
          { default: '5', key: 'seats', label: 'Seats', type: 'text' },
          {
            dependencies: ['seats'],
            display: 'facts',
            key: 'summary',
            props: ({ api, deps }) => ({
              actions: [
                { label: 'Reset seats', onClick: () => api.form.set('seats', '20') },
                { label: 'Close', onClick: () => void api.form.close() },
              ],
              items: [{ label: 'Seats', value: deps.get<string>('seats') }],
              layout: 'inline',
            }),
            type: 'info',
          },
        ],
      }),
    })
    const buttons = harness.field('summary').findAll('[data-display-actions] [data-ui="UButton"]')
    await buttons[0]?.trigger('click')
    await harness.flush()
    expect(harness.field('summary').text()).toContain('20')
    await buttons[1]?.trigger('click')
    await harness.flush()
    expect(harness.cancelled).toHaveLength(1)
    harness.unmount()
  })

  it('sits in the field wrapper with a label, like an input', async () => {
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [
          {
            display: 'code',
            hint: 'Read only',
            key: 'webLink',
            label: 'Web link',
            props: { value: 'https://example.com/doc', variant: 'value' },
            type: 'info',
          },
          { display: 'text', key: 'plain', props: { text: 'No wrapper' }, type: 'info' },
        ],
      }),
    })
    const shell = harness.field('webLink').find('[data-ui="UFormField"]')
    expect(shell.exists()).toBe(true)
    expect(shell.text()).toContain('Web link')
    expect(shell.text()).toContain('Read only')
    expect(shell.find('[data-display="code"]').exists()).toBe(true)
    expect(harness.field('plain').find('[data-ui="UFormField"]').exists()).toBe(false)
    harness.unmount()
  })

  it('applies a preset from the app config', async () => {
    const harness = await mountForm({
      appConfig: {
        nuxtUiTools: { display: { presets: { text: { legal: { appearance: 'legal' } } } } },
      },
      schema: defineFormSchema({
        fields: [
          {
            display: 'text',
            key: 'gdpr',
            preset: 'legal',
            props: { text: 'Kept 5 years' },
            type: 'info',
          },
        ],
      }),
    })
    expect(harness.field('gdpr').find('[data-appearance="legal"]').exists()).toBe(true)
    harness.unmount()
  })
})
