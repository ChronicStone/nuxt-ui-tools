import { describe, expect, it } from 'vitest'

import { defineFormSchema, useForm } from '#ui-tools/form'
import type { FormFieldApi, FormObject } from '#ui-tools/form'

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
      fields: [
        { key: 'read', type: 'switch' },
        {
          key: 'scope',
          type: 'text',
          validation: {
            required: true,
            rules: [
              {
                message: 'Invalid scope',
                name: 'scope',
                validate: ({ api }) => api.value.get() !== 'forbidden',
              },
            ],
          },
        },
      ],
      key: 'permissions',
      rows: [
        { key: 'users', label: 'Users' },
        { key: 'orders', label: 'Orders' },
      ],
      type: 'matrix',
    },
    {
      key: 'contacts',
      type: 'array-variant',
      variantKey: 'kind',
      variants: [
        {
          fields: [{ key: 'address', type: 'text', validation: { required: true } }],
          key: 'email',
          label: 'Email',
          virtualFields: { rank: (index) => index + 1 },
        },
        {
          fields: [{ key: 'number', type: 'phone-number' }],
          key: 'phone',
          label: 'Phone',
        },
      ],
    },
  ],
})

let activeState: FormObject = {}

function apiFactory(path: readonly string[]): FormFieldApi {
  return {
    context: {
      get: () => ({ value: undefined }),
      patch: () => {},
      refresh: async () => {},
      refreshAll: async () => {},
      set: () => {},
      update: () => {},
    },
    focus: async () => path.length > 0,
    options: {
      add: () => {},
      create: async () => null,
      creating: () => false,
      error: () => null,
      fetching: () => false,
      get: () => [],
      loading: () => false,
      pending: () => false,
      refresh: async () => {},
      refreshable: () => false,
    },
    upload: {
      cancel: async () => {},
      remove: async () => {},
      retry: async () => {},
      start: async () => {},
    },
    validation: {
      clearError: () => {},
      pending: () => false,
      setError: () => {},
      validate: async () => true,
    },
    value: { get: () => getPathValue(activeState, path), reset: () => {}, set: () => {} },
  }
}

describe('form V1 nested runtime', () => {
  it('initializes multiple hierarchy fields as arrays', () => {
    const hierarchySchema = defineFormSchema({
      fields: [
        {
          key: 'tree',
          multiple: true,
          options: [{ key: 'root', label: 'Root' }],
          type: 'tree',
        },
        {
          key: 'treeSelect',
          multiple: true,
          options: [{ key: 'root', label: 'Root' }],
          type: 'tree-select',
        },
      ],
    })

    expect(buildInitialFormState(hierarchySchema, {}, {})).toStrictEqual({
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

    expect(schemaControlled.syncInput.value).toStrictEqual(['profile.email'])
    expect(schemaControlled.validationMode.value).toBe('required')
    expect(explicitlyDisabled.syncInput.value).toBeFalsy()
    expect(explicitlyDisabled.validationMode.value).toBeFalsy()
  })

  it('builds matrix defaults and variant output with virtual fields', () => {
    const state = buildInitialFormState(
      schema,
      {},
      {
        contacts: [{ address: 'ada@example.com', kind: 'email' }],
      },
    )
    activeState = state
    const output = buildFormOutput(schema, state, {}, apiFactory)

    expect(state.permissions).toStrictEqual({
      orders: { read: false, scope: null },
      users: { read: false, scope: null },
    })
    expect(output.contacts).toStrictEqual([{ address: 'ada@example.com', kind: 'email', rank: 1 }])
  })

  it('reorders repeated row data without replacing mounted row slots', () => {
    const first = { label: 'First', position: 1 }
    const second = { label: 'Second', position: 2 }
    const target = [first, second]

    expect(syncFormArrayItems(target, [second, first])).toBeTruthy()
    expect(target).toStrictEqual([
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
      cancel: async () => {
        calls.push('cancel')
      },
      remove: async () => {
        calls.push('remove')
      },
      retry: async () => {
        calls.push('retry')
      },
      start: async () => {
        calls.push('start')
      },
    })

    await registry.get(['identityDocument'])?.start()
    await registry.get(['identityDocument'])?.cancel()
    await registry.get(['identityDocument'])?.retry()
    await registry.get(['identityDocument'])?.remove()
    expect(calls).toStrictEqual(['start', 'cancel', 'retry', 'remove'])

    unregister()
    expect(registry.get(['identityDocument'])).toBeUndefined()
  })

  it('applies required and rule validation modes independently inside matrix cells', async () => {
    const state = buildInitialFormState(
      schema,
      {},
      {
        permissions: {
          orders: { scope: null },
          users: { scope: 'forbidden' },
        },
      },
    )
    activeState = state

    const requiredErrors = await validateFormState(schema, state, {}, apiFactory, 'required')
    const ruleErrors = await validateFormState(schema, state, {}, apiFactory, 'rules')

    expect(requiredErrors).toStrictEqual([
      { message: 'This field is required.', path: 'permissions.orders.scope' },
    ])
    expect(ruleErrors).toStrictEqual([
      { message: 'Invalid scope', path: 'permissions.users.scope' },
    ])
  })
})
