import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { defineFormSchema } from '#ui-tools/form'

import { mountForm } from './harness'

const Target = defineComponent({ name: 'Target', render: () => h('main', 'Target route') })

function mockConfirm(answer: boolean) {
  const confirm = vi.fn<() => boolean>(() => answer)
  Object.assign(window, { confirm })
  return confirm
}

function createSchema(ignorePaths?: readonly string[]) {
  return defineFormSchema({
    actions: [],
    controls: { confirmNavOnDirty: ignorePaths ? { ignorePaths } : true },
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'derivedLabel', label: 'Derived label', type: 'text' },
    ],
  })
}

describe('dirty form navigation', () => {
  it('lets clean and ignored-path changes navigate without confirmation', async () => {
    const confirm = mockConfirm(false)
    const harness = await mountForm({
      input: { derivedLabel: 'Resolved', name: 'Original' },
      schema: createSchema(['derivedLabel']),
    })
    harness.router.addRoute({ component: Target, name: 'target', path: '/target' })

    harness.form.state.set('derivedLabel', 'Recomputed')
    await harness.flush()
    expect(harness.form.dirtyPaths.value).toStrictEqual(['derivedLabel'])

    await harness.router.push('/target')
    expect(harness.router.currentRoute.value.path).toBe('/target')
    expect(confirm).not.toHaveBeenCalled()
    harness.unmount()
  })

  it('asks before leaving a dirty form and keeps edits when the user cancels', async () => {
    const confirm = mockConfirm(false)
    const harness = await mountForm({ input: { name: 'Original' }, schema: createSchema() })
    harness.router.addRoute({ component: Target, name: 'target', path: '/target' })

    await harness.setInput('name', 'Unsaved edit')
    await harness.router.push('/target').catch(() => null)

    expect(confirm).toHaveBeenCalledOnce()
    expect(harness.router.currentRoute.value.path).toBe('/')
    expect(harness.control('name').element).toHaveProperty('value', 'Unsaved edit')

    confirm.mockReturnValue(true)
    await harness.router.push('/target')
    expect(harness.router.currentRoute.value.path).toBe('/target')
    harness.unmount()
  })

  it('does not ask once the form was reset', async () => {
    const confirm = mockConfirm(false)
    const harness = await mountForm({ input: { name: 'Original' }, schema: createSchema() })
    harness.router.addRoute({ component: Target, name: 'target', path: '/target' })

    await harness.setInput('name', 'Temporary edit')
    await harness.form.reset()
    await harness.router.push('/target')

    expect(harness.router.currentRoute.value.path).toBe('/target')
    expect(confirm).not.toHaveBeenCalled()
    harness.unmount()
  })

  it('asks the app confirm handler instead of the native dialog', async () => {
    const native = mockConfirm(false)
    const confirm = vi.fn(async () => true)
    const harness = await mountForm({
      confirm,
      input: { name: 'Original' },
      schema: createSchema(),
    })
    harness.router.addRoute({ component: Target, name: 'target', path: '/target' })

    await harness.setInput('name', 'Unsaved edit')
    await harness.router.push('/target')

    expect(harness.router.currentRoute.value.path).toBe('/target')
    expect(confirm).toHaveBeenCalledExactlyOnceWith({
      kind: 'unsaved-changes',
      message: expect.any(String),
    })
    expect(native).not.toHaveBeenCalled()
    harness.unmount()
  })

  it('asks once when a confirmed cancel navigates away', async () => {
    const confirm = vi.fn(async () => true)
    const harness = await mountForm({
      confirm,
      input: { name: 'Original' },
      schema: defineFormSchema({
        actions: [{ key: 'cancel', label: 'Cancel' }],
        controls: { confirmNavOnDirty: true },
        fields: [{ key: 'name', label: 'Name', type: 'text' }],
      }),
    })
    harness.router.addRoute({ component: Target, name: 'target', path: '/target' })

    await harness.setInput('name', 'Unsaved edit')
    await harness.button('Cancel').trigger('click')
    await harness.until(() => harness.cancelled.length === 1)
    await harness.router.push('/target')

    expect(harness.router.currentRoute.value.path).toBe('/target')
    expect(confirm).toHaveBeenCalledOnce()
    harness.unmount()
  })
})
