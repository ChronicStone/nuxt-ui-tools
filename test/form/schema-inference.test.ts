import { queryOptions } from '@tanstack/vue-query'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { defineFormField, defineFormFields, defineFormSchema, formFieldKinds } from '#ui-tools/form'
import type {
  ExtractFormContext,
  ExtractFormFields,
  FormHiddenField,
  FormOption,
  FormTextField,
} from '#ui-tools/form'

const schema = defineFormSchema({
  formKey: 'exassess.account',
  context: {
    countries: () =>
      queryOptions({
        queryKey: ['countries'],
        queryFn: async () => [
          { label: 'France', value: 'FR' },
          { label: 'Belgium', value: 'BE' },
        ],
      }),
    preferredCurrency: 'EUR',
  },
  fields: [
    {
      key: 'name',
      type: 'text',
      label: 'Name',
      validation: {
        required: true,
      },
    },
    {
      key: 'country',
      type: 'select',
      label: 'Country',
      options: ({ ctx }) => {
        expectTypeOf(ctx.countries.value).toEqualTypeOf<
          { label: string, value: string }[] | undefined
        >()
        expectTypeOf(ctx.preferredCurrency.value).toEqualTypeOf<'EUR'>()

        return ctx.countries.value ?? []
      },
    },
    {
      key: 'accepted',
      type: 'checkbox',
      label: 'Accepted',
      default: false,
    },
    {
      key: 'internalId',
      type: 'hidden',
      default: 'account_123',
    },
    {
      key: 'metadata',
      type: 'object',
      layout: {
        columns: 2,
        span: 'full',
      },
      fields: [
        {
          key: 'erpId',
          type: 'text',
          label: 'ERP ID',
        },
      ],
    },
  ],
})

type SchemaContext = ExtractFormContext<typeof schema>
type SchemaFields = ExtractFormFields<typeof schema>

describe('defineFormSchema inference', () => {
  it('infers form-scoped context resources for fields', () => {
    expectTypeOf<SchemaContext['countries']['value']>().toEqualTypeOf<
      { label: string, value: string }[] | undefined
    >()
    expectTypeOf<SchemaContext['preferredCurrency']['value']>().toEqualTypeOf<'EUR'>()
  })

  it('preserves authored field literals', () => {
    expectTypeOf<SchemaFields[number]['type']>().toMatchTypeOf<
      'text' | 'select' | 'checkbox' | 'hidden' | 'object'
    >()
  })

  it('keeps helper inference for extracted fields', () => {
    const field = defineFormField({
      key: 'email',
      type: 'text',
      inputType: 'email',
    })

    const fields = defineFormFields([
      field,
      {
        key: 'status',
        type: 'radio',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    ])

    expectTypeOf<typeof field.type>().toEqualTypeOf<'text'>()
    expectTypeOf<typeof fields[number]['type']>().toMatchTypeOf<'text' | 'radio'>()
  })

  it('exposes the planned field-kind registry', () => {
    expect(formFieldKinds.map(kind => kind.type)).toContain('text')
    expect(formFieldKinds.map(kind => kind.type)).toContain('upload')
  })
})

describe('form field property ownership', () => {
  it('keeps option properties on option fields', () => {
    defineFormSchema({
      fields: [
        {
          key: 'status',
          type: 'select',
          options: [
            { label: 'Draft', value: 'draft' },
          ] satisfies FormOption[],
        },
      ],
    })
  })

  it('rejects properties that do not belong to hidden and text fields', () => {
    const hiddenWithLabel = {
      key: 'secret',
      type: 'hidden',
      default: 'secret',
      // @ts-expect-error hidden fields do not render label chrome
      label: 'Secret',
    } satisfies FormHiddenField

    const textWithOptions = {
      key: 'name',
      type: 'text',
      // @ts-expect-error text fields do not own options
      options: [],
    } satisfies FormTextField

    expectTypeOf(hiddenWithLabel.type).toEqualTypeOf<'hidden'>()
    expectTypeOf(textWithOptions.type).toEqualTypeOf<'text'>()
  })
})
