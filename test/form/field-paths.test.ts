import { describe, expectTypeOf, it } from 'vitest'

import type { FormFieldPath } from '#ui-tools/form'

type Output = {
  name: string
  contacts: { email: string; phones: { number: string }[] }[]
  owner: { id: string } | null
}

describe('form field paths', () => {
  it('addresses array items by index and keeps the unindexed form', () => {
    expectTypeOf<'contacts.0.email'>().toExtend<FormFieldPath<Output>>()
    expectTypeOf<'contacts.12.phones.3.number'>().toExtend<FormFieldPath<Output>>()
    expectTypeOf<'contacts.0'>().toExtend<FormFieldPath<Output>>()
    expectTypeOf<'contacts.email'>().toExtend<FormFieldPath<Output>>()
    expectTypeOf<'owner.id'>().toExtend<FormFieldPath<Output>>()
    expectTypeOf<'contacts.first.email'>().not.toExtend<FormFieldPath<Output>>()
    expectTypeOf<'contacts.0.missing'>().not.toExtend<FormFieldPath<Output>>()
    expectTypeOf<'name.0'>().not.toExtend<FormFieldPath<Output>>()
  })
})
