import { describe, expect, it } from 'vitest'

import { defineFormSchema, useForm } from '#ui-tools/form'
import type { FormFieldApi } from '#ui-tools/form'
import type { FormObject } from '#ui-tools/form'

import { useFormUploadRegistry } from '../../src/runtime/form/composables/use-form-upload-registry'
import { syncFormArrayItems } from '../../src/runtime/form/utils/array'
import {
  buildFormOutput,
  buildInitialFormState,
  validateFormState,
} from '../../src/runtime/form/utils/state'
import { getPathValue } from '../../src/runtime/shared/utils/path'

const schema = defineFormSchema({
  fields: [
    {
      key: 'permissions',
      type: 'matrix',
      rows: [
        { key: 'users', label: 'Users' },
        { key: 'orders', label: 'Orders' },
      ],
      fields: [
        { key: 'read', type: 'switch' },
        {
          key: 'scope',
          type: 'text',
          validation: {
            required: true,
            rules: [
              {
                name: 'scope',
                validate: ({ api }) => api.value.get() !== 'forbidden',
                message: 'Invalid scope',
              },
            ],
          },
        },
      ],
    },
    {
      key: 'contacts',
      type: 'array-variant',
      variantKey: 'kind',
      variants: [
        {
          key: 'email',
          label: 'Email',
          fields: [{ key: 'address', type: 'text', validation: { required: true } }],
          virtualFields: { rank: (index) => index + 1 },
        },
        {
          key: 'phone',
          label: 'Phone',
          fields: [{ key: 'number', type: 'phone-number' }],
        },
      ],
    },
  ],
})

let activeState: FormObject = {}

function apiFactory(path: readonly string[]): FormFieldApi {
  return {
    value: { get: () => getPathValue(activeState, path), set: () => {}, reset: () => {} },
    context: {
      get: () => ({ value: undefined }),
      set: () => {},
      update: () => {},
      patch: () => {},
      refresh: async () => {},
      refreshAll: async () => {},
    },
    options: {
      get: () => [],
      add: () => {},
      pending: () => false,
      fetching: () => false,
      loading: () => false,
      creating: () => false,
      refreshable: () => false,
      error: () => null,
      refresh: async () => {},
      create: async () => null,
    },
    upload: {
      start: async () => {},
      cancel: async () => {},
      retry: async () => {},
      remove: async () => {},
    },
    validation: { validate: async () => true, setError: () => {}, clearError: () => {} },
    focus: async () => path.length > 0,
  }
}

describe('form V1 nested runtime', () => {
  it('initializes multiple hierarchy fields as arrays', () => {
    const hierarchySchema = defineFormSchema({
      fields: [
        {
          key: 'tree',
          type: 'tree',
          multiple: true,
          options: [{ key: 'root', label: 'Root' }],
        },
        {
          key: 'treeSelect',
          type: 'tree-select',
          multiple: true,
          options: [{ key: 'root', label: 'Root' }],
        },
      ],
    })

    expect(buildInitialFormState(hierarchySchema, {}, {})).toEqual({
      tree: [],
      treeSelect: [],
    })
  })

  it('resolves schema controls and preserves explicit false controller overrides', () => {
    const controlledSchema = defineFormSchema({
      controls: { syncInput: ['profile.email'], validate: 'required' },
      fields: [{ key: 'profile.email', type: 'text' }],
    })
    const schemaControlled = useForm({ schema: controlledSchema })
    const explicitlyDisabled = useForm({
      schema: controlledSchema,
      syncInput: false,
      validate: false,
    })

    expect(schemaControlled.syncInput.value).toEqual(['profile.email'])
    expect(schemaControlled.validationMode.value).toBe('required')
    expect(explicitlyDisabled.syncInput.value).toBe(false)
    expect(explicitlyDisabled.validationMode.value).toBe(false)
  })

  it('builds matrix defaults and variant output with virtual fields', () => {
    const state = buildInitialFormState(
      schema,
      {},
      {
        contacts: [{ kind: 'email', address: 'ada@example.com' }],
      },
    )
    activeState = state
    const output = buildFormOutput(schema, state, {}, apiFactory)

    expect(state.permissions).toEqual({
      users: { read: false, scope: null },
      orders: { read: false, scope: null },
    })
    expect(output.contacts).toEqual([{ kind: 'email', address: 'ada@example.com', rank: 1 }])
  })

  it('reorders repeated row data without replacing mounted row slots', () => {
    const first = { label: 'First', position: 1 }
    const second = { label: 'Second', position: 2 }
    const target = [first, second]

    expect(syncFormArrayItems(target, [second, first])).toBe(true)
    expect(target).toEqual([
      { label: 'Second', position: 2 },
      { label: 'First', position: 1 },
    ])
    expect(target[0]).toBe(first)
    expect(target[1]).toBe(second)
  })

  it('dispatches field upload API operations to the mounted upload runtime', async () => {
    const calls: string[] = []
    const registry = useFormUploadRegistry()
    const unregister = registry.register(['identityDocument'], {
      start: async () => {
        calls.push('start')
      },
      cancel: async () => {
        calls.push('cancel')
      },
      retry: async () => {
        calls.push('retry')
      },
      remove: async () => {
        calls.push('remove')
      },
    })

    await registry.get(['identityDocument'])?.start()
    await registry.get(['identityDocument'])?.cancel()
    await registry.get(['identityDocument'])?.retry()
    await registry.get(['identityDocument'])?.remove()
    expect(calls).toEqual(['start', 'cancel', 'retry', 'remove'])

    unregister()
    expect(registry.get(['identityDocument'])).toBeUndefined()
  })

  it('applies required and rule validation modes independently inside matrix cells', async () => {
    const state = buildInitialFormState(
      schema,
      {},
      {
        permissions: {
          users: { scope: 'forbidden' },
          orders: { scope: null },
        },
      },
    )
    activeState = state

    const requiredErrors = await validateFormState(schema, state, {}, apiFactory, 'required')
    const ruleErrors = await validateFormState(schema, state, {}, apiFactory, 'rules')

    expect(requiredErrors).toEqual([
      { path: 'permissions.orders.scope', message: 'This field is required.' },
    ])
    expect(ruleErrors).toEqual([{ path: 'permissions.users.scope', message: 'Invalid scope' }])
  })
})
