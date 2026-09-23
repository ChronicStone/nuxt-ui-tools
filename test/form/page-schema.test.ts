import { describe, expect, expectTypeOf, it } from 'vitest'

import { defineFormPageSchema, defineFormPageSection, useForm } from '#ui-tools/form'
import type { ExtractFormInternalValue, ExtractFormOutput } from '#ui-tools/form'

const ACCOUNT_TYPES = [
  { label: 'Client', value: 'customer' },
  { label: 'Centre de test', value: 'testCenter' },
] as const

function accountTypeSection() {
  return defineFormPageSection({
    description: () => 'le type conditionne les champs',
    fields: [
      { key: 'accountType', options: ACCOUNT_TYPES, required: true, type: 'radio-card' },
      { default: false, key: 'canPerformOnSite', label: 'Sur site', type: 'checkbox' },
    ],
    key: 'type',
    label: () => 'Type de compte',
  })
}

function billingSection(params: { hasActiveContract: boolean }) {
  return defineFormPageSection({
    fields: [
      { key: 'preferredCurrency', options: ['EUR', 'USD'], required: true, type: 'select' },
      {
        dependencies: ['accountType'],
        key: 'vtestId',
        label: 'VTEST ID',
        required: ({ deps }) => params.hasActiveContract || 'accountType' in deps,
        type: 'text',
      },
    ],
    key: 'billing',
    label: 'Facturation',
    optional: true,
  })
}

const accountSchema = defineFormPageSchema({
  controls: { dirtyCheck: true },
  header: { title: () => 'Modifier le compte' },
  navigation: { title: () => 'Sections' },
  sections: [
    accountTypeSection(),
    {
      condition: ({ deps }) => 'accountType' in deps,
      dependencies: ['accountType'],
      fields: [{ key: 'address.city', label: 'Ville', type: 'text' }],
      key: 'address',
      label: 'Adresse',
      layout: { columns: '1 md:3', fieldSpan: 1 },
    },
    billingSection({ hasActiveContract: true }),
  ],
})

describe('defineFormPageSchema', () => {
  it('infers one flat output across the sections', () => {
    type Output = ExtractFormOutput<typeof accountSchema>

    expectTypeOf<Output['accountType']>().toEqualTypeOf<'customer' | 'testCenter'>()
    expectTypeOf<Output['canPerformOnSite']>().toEqualTypeOf<boolean>()
    expectTypeOf<Output['address']['city']>().toEqualTypeOf<string | null>()
    expectTypeOf<Output['preferredCurrency']>().toEqualTypeOf<'EUR' | 'USD'>()
    expectTypeOf<Output['vtestId']>().toEqualTypeOf<string | null>()
    expectTypeOf<Output>().not.toHaveProperty('type')
    expectTypeOf<Output>().not.toHaveProperty('billing')
    expectTypeOf<ExtractFormInternalValue<typeof accountSchema>>().toHaveProperty('vtestId')
  })

  it('keeps the sections and generates one card field per section', () => {
    expect(accountSchema.sections.map((section) => section.key)).toStrictEqual([
      'type',
      'address',
      'billing',
    ])
    expect(accountSchema.fields.map((field) => [field.type, field.key])).toStrictEqual([
      ['card', 'type'],
      ['card', 'address'],
      ['card', 'billing'],
    ])
    expectTypeOf(accountSchema.fields[1].key).toEqualTypeOf<'address'>()
  })

  it('carries the label, description, condition, and dependencies onto the card', () => {
    const [type, address, billing] = accountSchema.fields

    expect(type).toMatchObject({ key: 'type', type: 'card' })
    expect(new Set(Object.keys(type))).toStrictEqual(
      new Set(['description', 'fields', 'key', 'label', 'type']),
    )
    expect(address).toMatchObject({ dependencies: ['accountType'], label: 'Adresse' })
    expect(Object.hasOwn(address, 'condition')).toBe(true)
    expect(Object.hasOwn(billing, 'optional')).toBe(false)
    expect(billing.fields).toBe(accountSchema.sections[2].fields)
  })

  it('types the controller output from the page schema', () => {
    const form = useForm({ schema: accountSchema })
    type Output = typeof form.output.value

    expectTypeOf<Output['vtestId']>().toEqualTypeOf<string | null>()
    expectTypeOf<Output['address']['city']>().toEqualTypeOf<string | null>()
  })

  it('types field callbacks from the schema context', () => {
    const schema = defineFormPageSchema({
      context: { tenant: { currency: 'EUR' } },
      sections: [
        {
          fields: [
            {
              key: 'currency',
              placeholder: ({ ctx }) => {
                expectTypeOf(ctx.tenant.value).toMatchTypeOf<{ currency: string }>()
                return 'Devise'
              },
              type: 'text',
            },
          ],
          key: 'billing',
          label: 'Facturation',
        },
      ],
    })

    expectTypeOf<ExtractFormOutput<typeof schema>['currency']>().toEqualTypeOf<string | null>()
  })
})
