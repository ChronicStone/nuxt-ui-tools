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
      options: [
        { label: 'France', value: 'FR' },
        { label: 'Belgium', value: 'BE' },
      ],
      type: 'select',
    },
    {
      dependencies: ['password', ['profile.country', 'country']],
      key: 'confirmPassword',
      type: 'password',
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
      dependencies: [
        'account.name',
        ['account.country', 'country'],
        ['$parent.city', 'siblingCity'],
        ['$parent:1.region', 'parentRegion'],
        ['$root', 'root'],
      ],
      key: 'city',
      type: 'text',
    })

    const state = {
      account: {
        address: {
          city: 'Paris',
        },
        country: 'FR',
        name: 'Ada',
        region: 'eu-west',
      },
    }

    expect(
      resolveFieldDependencies({
        field,
        parentPath: ['account', 'address'],
        state,
      }),
    ).toStrictEqual({
      'account.name': 'Ada',
      country: 'FR',
      parentRegion: 'eu-west',
      root: state,
      siblingCity: 'Paris',
    })
  })
})
