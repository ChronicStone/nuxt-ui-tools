import { describe, expect, expectTypeOf, it } from 'vitest'

import { defineFormField, defineFormSchema } from '#ui-tools/form'
import type { ExtractFormFieldDependencies, ExtractFormInternalValue } from '#ui-tools/form'

import { resolveFieldDependencies } from '../../src/runtime/form/utils/dependencies'

const schema = defineFormSchema({
  fields: [
    {
      key: 'password',
      type: 'password',
    },
    {
      key: 'profile.country',
      type: 'select',
      options: [
        { label: 'France', value: 'FR' },
        { label: 'Belgium', value: 'BE' },
      ],
    },
    {
      key: 'confirmPassword',
      type: 'password',
      dependencies: ['password', ['profile.country', 'country']],
    },
  ],
})

type InternalValue = ExtractFormInternalValue<typeof schema>
type ConfirmField = Extract<(typeof schema.fields)[number], { key: 'confirmPassword' }>

describe('form field dependencies', () => {
  it('extracts typed dependency values from absolute dotted paths', () => {
    expectTypeOf<ExtractFormFieldDependencies<ConfirmField, InternalValue>>().toEqualTypeOf<{
      password: string | null
      country: string | null
    }>()
  })

  it('resolves string, aliased, scoped parent, and root dependencies at runtime', () => {
    const field = defineFormField({
      key: 'city',
      type: 'text',
      dependencies: [
        'account.name',
        ['account.country', 'country'],
        ['$parent.city', 'siblingCity'],
        ['$parent:1.region', 'parentRegion'],
        ['$root', 'root'],
      ],
    })

    const state = {
      account: {
        name: 'Ada',
        country: 'FR',
        region: 'eu-west',
        address: {
          city: 'Paris',
        },
      },
    }

    expect(
      resolveFieldDependencies({
        field,
        state,
        parentPath: ['account', 'address'],
      }),
    ).toEqual({
      'account.name': 'Ada',
      country: 'FR',
      siblingCity: 'Paris',
      parentRegion: 'eu-west',
      root: state,
    })
  })
})
