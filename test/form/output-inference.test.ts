import { queryOptions } from '@tanstack/vue-query'
import { describe, expectTypeOf, it } from 'vitest'

import { shallowRef } from 'vue'

import { defineFormSchema, useForm, useFormSubmit } from '#ui-tools/form'
import type {
  ExtractFormContext,
  ExtractFormFieldInternalValue,
  ExtractFormFieldOutputValue,
  ExtractFormFields,
  ExtractFormInternalValue,
  ExtractFormOutput,
  FormSubmitTarget,
} from '#ui-tools/form'

const schema = defineFormSchema({
  formKey: 'exassess.profile',
  context: {
    countries: () =>
      queryOptions({
        queryKey: ['countries'],
        queryFn: async () => [
          { label: 'France', value: 'FR' },
          { label: 'Belgium', value: 'BE' },
        ],
      }),
    session: () => Promise.resolve({ id: 'session_1' }),
    tenant: { id: 'tenant_1', currency: 'EUR' },
  },
  fields: [
    {
      key: 'profile.name',
      type: 'text',
      disabled: ({ api }) => {
        expectTypeOf(api.value.get()).toEqualTypeOf<string | null>()

        return false
      },
      transform: {
        output: value => value?.trim() ?? '',
      },
    },
    {
      key: 'age',
      type: 'number',
    },
    {
      key: 'active',
      type: 'checkbox',
      default: true,
    },
    {
      key: 'country',
      type: 'select',
      options: ({ ctx, api }) => {
        expectTypeOf(ctx.countries.value).toEqualTypeOf<
          { label: string, value: string }[] | undefined
        >()
        expectTypeOf(ctx.countries.loading).toEqualTypeOf<boolean>()
        expectTypeOf(ctx.session.value).toEqualTypeOf<{ id: string } | undefined>()
        expectTypeOf(ctx.tenant.value).toMatchTypeOf<{ id: string, currency: string }>()
        expectTypeOf(api.context.get('countries').value).toEqualTypeOf<
          { label: string, value: string }[] | undefined
        >()
        expectTypeOf(api.context.refresh).parameter(0).toEqualTypeOf<'countries' | 'session'>()
        expectTypeOf(api.context.refreshAll()).toEqualTypeOf<Promise<void>>()
        void api.context.refresh('countries')
        // @ts-expect-error sync context values do not expose explicit refresh
        void api.context.refresh('tenant')

        return ctx.countries.value ?? []
      },
    },
    {
      key: 'currency',
      type: 'select',
      options: [
        { label: 'Euro', value: 'EUR' },
        { label: 'Dollar', value: 'USD' },
      ],
    },
    {
      key: 'roles',
      type: 'select',
      multiple: true,
      options: ['admin', 'reviewer'],
    },
    {
      key: 'status',
      type: 'select',
      options: queryOptions({
        queryKey: ['statuses'],
        queryFn: async () => [
          { label: 'Draft', value: 'draft' },
          { label: 'Published', value: 'published' },
        ],
      }),
    },
    {
      key: 'city',
      type: 'select',
      options: ({ ctx }) =>
        queryOptions({
          queryKey: ['cities', ctx.countries.value?.map(country => country.value).join(',') ?? 'none'],
          queryFn: async () => [
            { label: 'Paris', value: 'paris' },
            { label: 'Brussels', value: 'brussels' },
          ],
        }),
    },
    {
      key: 'startedAt',
      type: 'date',
    },
    {
      key: 'internalId',
      type: 'hidden',
      default: () => 'internal_1',
    },
    {
      key: 'meta',
      type: 'object',
      fields: [
        {
          key: 'externalId',
          type: 'text',
        },
        {
          key: 'score',
          type: 'number',
          transform: {
            output: value => String(value ?? 0),
          },
        },
      ],
    },
    {
      key: 'coordinates',
      type: 'input-group',
      fields: [
        {
          key: 'lat',
          type: 'number',
        },
        {
          key: 'lng',
          type: 'number',
        },
      ],
    },
    {
      key: 'addresses',
      type: 'array-list',
      fields: [
        {
          key: 'line1',
          type: 'text',
        },
        {
          key: 'countryCode',
          type: 'select',
          options: [
            { label: 'France', value: 'FR' },
            { label: 'Belgium', value: 'BE' },
          ],
        },
      ],
    },
    {
      key: 'profileHint',
      type: 'info',
      content: 'This field does not write to output',
    },
  ],
})

type SchemaContext = ExtractFormContext<typeof schema>
type SchemaFields = ExtractFormFields<typeof schema>
type SchemaInternalValue = ExtractFormInternalValue<typeof schema>
type SchemaOutput = ExtractFormOutput<typeof schema>
type NameField = Extract<SchemaFields[number], { key: 'profile.name' }>
type CurrencyField = Extract<SchemaFields[number], { key: 'currency' }>
type RolesField = Extract<SchemaFields[number], { key: 'roles' }>

describe('form output inference', () => {
  it('infers form-scoped context resources', () => {
    expectTypeOf<SchemaContext['countries']['value']>().toEqualTypeOf<
      { label: string, value: string }[] | undefined
    >()
    expectTypeOf<SchemaContext['countries']['loading']>().toEqualTypeOf<boolean>()
    expectTypeOf<SchemaContext['session']['value']>().toEqualTypeOf<{ id: string } | undefined>()
    expectTypeOf<SchemaContext['tenant']['value']>().toMatchTypeOf<{ id: string, currency: string }>()
  })

  it('extracts the internal value before output transforms', () => {
    expectTypeOf<SchemaInternalValue>().toMatchTypeOf<{
      profile: {
        name: string | null
      }
      age: number | null
      active: boolean
      country: string | null
      currency: 'EUR' | 'USD' | null
      roles: readonly ('admin' | 'reviewer')[] | null
      status: string | null
      city: string | null
      startedAt: SchemaInternalValue['startedAt']
      internalId: SchemaInternalValue['internalId']
      meta: {
        externalId: string | null
        score: number | null
      }
      lat: number | null
      lng: number | null
      addresses: SchemaInternalValue['addresses']
    }>()
  })

  it('extracts submitted output after transforms and nested field grouping', () => {
    expectTypeOf<SchemaOutput>().toMatchTypeOf<{
      profile: {
        name: string
      }
      age: number | null
      active: boolean
      country: string | null
      currency: 'EUR' | 'USD' | null
      roles: readonly ('admin' | 'reviewer')[] | null
      status: string | null
      city: string | null
      startedAt: SchemaOutput['startedAt']
      internalId: SchemaOutput['internalId']
      meta: {
        externalId: string | null
        score: string
      }
      lat: number | null
      lng: number | null
      addresses: SchemaOutput['addresses']
    }>()
  })

  it('extracts individual field values for targeted APIs', () => {
    expectTypeOf<ExtractFormFieldInternalValue<NameField>>().toEqualTypeOf<string | null>()
    expectTypeOf<ExtractFormFieldOutputValue<NameField>>().toEqualTypeOf<string>()
    expectTypeOf<ExtractFormFieldOutputValue<CurrencyField>>().toEqualTypeOf<'EUR' | 'USD' | null>()
    expectTypeOf<ExtractFormFieldOutputValue<RolesField>>().toEqualTypeOf<readonly ('admin' | 'reviewer')[] | null>()
  })

  it('types useFormSubmit handlers from submitted output', () => {
    const formRef = shallowRef<FormSubmitTarget<SchemaOutput> | null>(null)

    useFormSubmit({
      formRef,
      schema,
      onSubmit: ({ formData }) => {
        expectTypeOf(formData.profile.name).toEqualTypeOf<string>()
        expectTypeOf(formData.meta.score).toEqualTypeOf<string>()
        expectTypeOf(formData.roles).toEqualTypeOf<readonly ('admin' | 'reviewer')[] | null>()

        return { success: true }
      },
    })
  })

  it('types useForm controller state, output, and submit handlers from the schema', () => {
    const form = useForm({
      schema,
      onSubmit: ({ formData }) => {
        expectTypeOf(formData.profile.name).toEqualTypeOf<string>()
        expectTypeOf(formData.meta.score).toEqualTypeOf<string>()
        expectTypeOf(formData.roles).toEqualTypeOf<readonly ('admin' | 'reviewer')[] | null>()

        return { success: true }
      },
    })

    type FormController = typeof form

    expectTypeOf<FormController['state']['internal']['value']['profile']['name']>().toEqualTypeOf<string | null>()
    expectTypeOf<FormController['state']['output']['value']['profile']['name']>().toEqualTypeOf<string>()
    expectTypeOf<FormController['context']['value']['countries']['value']>().toEqualTypeOf<
      { label: string, value: string }[] | undefined
    >()
    expectTypeOf<FormController['output']['value']['meta']['score']>().toEqualTypeOf<string>()
    expectTypeOf<FormController['meta']['isDirty']['value']>().toEqualTypeOf<boolean>()
    expectTypeOf<FormController['state']['get']>().parameters.toEqualTypeOf<[path: string]>()
    expectTypeOf<FormController['state']['set']>().parameters.toEqualTypeOf<[path: string, value: unknown]>()
    expectTypeOf<FormController['validation']['getError']>().parameters.toEqualTypeOf<[path: string]>()
    expectTypeOf<FormController['submission']['isSubmitting']['value']>().toEqualTypeOf<boolean>()
    expectTypeOf<FormController['navigation']['canGoNext']['value']>().toEqualTypeOf<boolean>()
  })
})
