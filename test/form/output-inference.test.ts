import { queryOptions } from '@tanstack/vue-query'
import { describe, expectTypeOf, it } from 'vitest'
import { shallowRef } from 'vue'

import { defineFormSchema, useForm, useFormSubmit } from '#ui-tools/form'
import type {
  ExtractFormContext,
  ExtractFormFieldInternalValue,
  ExtractFormFieldOutputValue,
  ExtractFormFields,
  FormObject,
  ExtractFormInternalValue,
  ExtractFormOutput,
  FormApiController,
  FormApiCreateResult,
  FormSubmitTarget,
} from '#ui-tools/form'

const schema = defineFormSchema({
  context: {
    countries: () =>
      queryOptions({
        queryFn: async () => ({
          items: [
            { label: 'France', value: 'FR' },
            { label: 'Belgium', value: 'BE' },
          ],
        }),
        queryKey: ['countries'],
        select: (data) => data.items,
      }),
    session: () => Promise.resolve({ id: 'session_1' }),
    tenant: { currency: 'EUR', id: 'tenant_1' },
  },
  fields: [
    {
      disabled: ({ api }) => {
        expectTypeOf(api.value.get()).toEqualTypeOf<string | null>()

        return false
      },
      key: 'profile.name',
      transform: {
        output: (value) => value?.trim() ?? '',
      },
      type: 'text',
    },
    {
      key: 'age',
      type: 'number',
    },
    {
      default: true,
      key: 'active',
      type: 'checkbox',
    },
    {
      key: 'country',
      options: ({ ctx, api }) => {
        expectTypeOf(ctx.countries.value).toEqualTypeOf<
          { label: string; value: string }[] | undefined
        >()
        expectTypeOf(ctx.countries.loading).toEqualTypeOf<boolean>()
        expectTypeOf(ctx.session.value).toEqualTypeOf<{ id: string } | undefined>()
        expectTypeOf(ctx.tenant.value).toMatchTypeOf<{ id: string; currency: string }>()
        expectTypeOf(api.context.get('countries').value).toEqualTypeOf<
          { label: string; value: string }[] | undefined
        >()
        expectTypeOf(api.context.refresh).parameter(0).toEqualTypeOf<'countries' | 'session'>()
        expectTypeOf(api.context.refreshAll()).toEqualTypeOf<Promise<void>>()
        api.context.set('countries', [{ label: 'Spain', value: 'ES' }])
        api.context.set('session', { id: 'session_2' })
        api.context.update('session', (value) => ({ id: value?.id ?? 'session_2' }))
        api.context.patch('session', { id: 'session_3' })
        api.context.patch('session', (value) => ({ id: value.id }))
        api.options.add({ label: 'Spain', value: 'ES' })
        void api.context.refresh('countries')
        // @ts-expect-error sync context values do not expose explicit refresh
        void api.context.refresh('tenant')
        // @ts-expect-error array context resources must use set/update instead of object patch
        api.context.patch('countries', {})
        // @ts-expect-error local object options must include a value
        api.options.add({ label: 'Spain' })

        return ctx.countries.value ?? []
      },
      type: 'select',
    },
    {
      key: 'currency',
      options: [
        { label: 'Euro', value: 'EUR' },
        { label: 'Dollar', value: 'USD' },
      ],
      type: 'select',
    },
    {
      key: 'roles',
      options: ['admin', 'reviewer'],
      props: { multiple: true },
      type: 'select',
    },
    {
      key: 'status',
      options: queryOptions({
        queryFn: async () => [
          { label: 'Draft', value: 'draft' },
          { label: 'Published', value: 'published' },
        ],
        queryKey: ['statuses'],
      }),
      type: 'select',
    },
    {
      key: 'city',
      options: ({ ctx }) =>
        queryOptions({
          queryFn: async () => [
            { label: 'Paris', value: 'paris' },
            { label: 'Brussels', value: 'brussels' },
          ],
          queryKey: [
            'cities',
            ctx.countries.value?.map((country) => country.value).join(',') ?? 'none',
          ],
        }),
      type: 'select',
    },
    {
      key: 'startedAt',
      type: 'date',
    },
    {
      disabled: ({ api }) => {
        expectTypeOf(api.value.get()).toEqualTypeOf<string | null>()

        return false
      },
      key: 'phone',
      props: { defaultCountryCode: 'FR' },
      type: 'phone-number',
    },
    {
      key: 'document',
      output: 'object',
      type: 'upload',
      upload: {
        handler: async ({ files }) => {
          expectTypeOf(files).toEqualTypeOf<readonly File[]>()

          return { url: files[0]?.name ?? 'empty' }
        },
      },
    },
    {
      default: () => 'internal_1',
      key: 'internalId',
      type: 'hidden',
    },
    {
      fields: [
        {
          key: 'externalId',
          type: 'text',
        },
        {
          key: 'score',
          transform: {
            output: (value) => String(value ?? 0),
          },
          type: 'number',
        },
      ],
      key: 'meta',
      type: 'object',
    },
    {
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
      key: 'coordinates',
      type: 'input-group',
    },
    {
      fields: [
        {
          key: 'headline',
          type: 'text',
        },
        {
          key: 'subtitle',
          type: 'text',
        },
      ],
      key: 'presentation',
      label: 'Presentation',
      type: 'card',
    },
    {
      fields: [
        {
          key: 'columnNote',
          type: 'text',
        },
      ],
      key: 'stacked',
      type: 'column',
    },
    {
      fields: [
        {
          key: 'line1',
          type: 'text',
        },
        {
          key: 'countryCode',
          options: [
            { label: 'France', value: 'FR' },
            { label: 'Belgium', value: 'BE' },
          ],
          type: 'select',
        },
      ],
      key: 'addresses',
      type: 'array-list',
    },
    {
      content: 'This field does not write to output',
      key: 'profileHint',
      type: 'info',
    },
  ],
  formKey: 'exassess.profile',
})

const steppedLifecycleSchema = defineFormSchema({
  onBeforeNext: ({ api, formData, stepIndex }) => {
    expectTypeOf(api.validate({ focus: true })).toEqualTypeOf<Promise<boolean>>()
    expectTypeOf(formData).toEqualTypeOf<FormObject>()
    expectTypeOf(stepIndex).toEqualTypeOf<number>()
    return true
  },
  onBeforePrevious: ({ api }) => {
    expectTypeOf(api.focus('firstName')).toEqualTypeOf<Promise<boolean>>()
  },
  onStepSkipped: ({ api }) => {
    api.reset()
  },
  skipStep: ({ stepIndex }) => stepIndex > 10,
  steps: [
    {
      fields: [
        {
          key: 'firstName',
          type: 'text',
        },
      ],
      key: 'first',
    },
    {
      fields: [
        {
          key: 'lastName',
          type: 'text',
        },
      ],
      key: 'second',
    },
  ],
})

void steppedLifecycleSchema

type SchemaContext = ExtractFormContext<typeof schema>
type SchemaFields = ExtractFormFields<typeof schema>
type SchemaInternalValue = ExtractFormInternalValue<typeof schema>
type SchemaOutput = ExtractFormOutput<typeof schema>
type NameField = Extract<SchemaFields[number], { key: 'profile.name' }>
type CurrencyField = Extract<SchemaFields[number], { key: 'currency' }>
type RolesField = Extract<SchemaFields[number], { key: 'roles' }>
interface TagField {
  key: 'tags'
  type: 'tag'
}
interface RangeSliderField {
  key: 'scoreRange'
  type: 'slider'
  props: { multiple: true }
}
interface MultipleFileField {
  key: 'avatar'
  type: 'file'
  props: { multiple: true }
}
interface AutoCompleteField {
  key: 'assignees'
  type: 'auto-complete'
  props: { multiple: true }
  options: readonly [{ label: 'Ada'; value: 'ada' }, { label: 'Grace'; value: 'grace' }]
}
interface RadioCardField {
  key: 'plan'
  type: 'radio-card'
  options: readonly [{ label: 'Basic'; value: 'basic' }, { label: 'Pro'; value: 'pro' }]
}
interface CheckboxCardField {
  key: 'features'
  type: 'checkbox-card'
  options: readonly ['reports', 'exports']
}
interface SwitchGroupField {
  key: 'notifications'
  type: 'switch-group'
  options: readonly ['email', 'sms']
}
interface RatingField {
  key: 'rating'
  type: 'rating'
}
interface TimeField {
  key: 'startsAt'
  type: 'time'
}
const selectedStatusOptions = queryOptions({
  queryFn: async () => ({
    items: [{ label: 'Draft', value: 'draft' }] as const,
  }),
  queryKey: ['selected-statuses'],
  select: (data) => data.items,
})
interface SelectedQueryField {
  key: 'selectedStatus'
  type: 'select'
  options: typeof selectedStatusOptions
}
const matrixSchema = defineFormSchema({
  fields: [
    {
      fields: [
        { key: 'read', type: 'switch' },
        { key: 'scope', options: ['own', 'all'], type: 'select' },
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
          fields: [{ key: 'address', type: 'text' }],
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

const requiredSchema = defineFormSchema({
  fields: [
    { key: 'email', required: true, type: 'text' },
    { key: 'password', required: true, type: 'password' },
  ],
})

function assertFormApiTypes(formApi: FormApiController) {
  const baseResult = formApi.createForm(schema)
  expectTypeOf<Awaited<typeof baseResult>>().toMatchTypeOf<FormApiCreateResult<SchemaOutput>>()

  const inputResult = formApi.createForm(schema, {
    profile: {
      name: 'Ada',
    },
  })
  expectTypeOf<Awaited<typeof inputResult>>().toMatchTypeOf<FormApiCreateResult<SchemaOutput>>()

  const submitResult = formApi.createForm(schema, {
    mode: 'drawer',
    onSubmit: ({ formData }) => {
      expectTypeOf(formData.profile.name).toEqualTypeOf<string>()
      return { data: { id: 'created-account' }, success: true }
    },
  })
  expectTypeOf<Awaited<typeof submitResult>>().toMatchTypeOf<
    FormApiCreateResult<SchemaOutput, { id: string }>
  >()
}

void assertFormApiTypes

describe('form output inference', () => {
  it('infers form-scoped context resources', () => {
    expectTypeOf<SchemaContext['countries']['value']>().toEqualTypeOf<
      { label: string; value: string }[] | undefined
    >()
    expectTypeOf<SchemaContext['countries']['loading']>().toEqualTypeOf<boolean>()
    expectTypeOf<SchemaContext['session']['value']>().toEqualTypeOf<{ id: string } | undefined>()
    expectTypeOf<SchemaContext['tenant']['value']>().toMatchTypeOf<{
      id: string
      currency: string
    }>()
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
      phone: string | null
      document: SchemaInternalValue['document']
      internalId: SchemaInternalValue['internalId']
      meta: {
        externalId: string | null
        score: number | null
      }
      lat: number | null
      lng: number | null
      headline: string | null
      subtitle: string | null
      columnNote: string | null
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
      phone: string | null
      document: SchemaOutput['document']
      internalId: SchemaOutput['internalId']
      meta: {
        externalId: string | null
        score: string
      }
      lat: number | null
      lng: number | null
      headline: string | null
      subtitle: string | null
      columnNote: string | null
      addresses: SchemaOutput['addresses']
    }>()
  })

  it('extracts individual field values for targeted APIs', () => {
    expectTypeOf<ExtractFormFieldInternalValue<NameField>>().toEqualTypeOf<string | null>()
    expectTypeOf<ExtractFormFieldOutputValue<NameField>>().toEqualTypeOf<string>()
    expectTypeOf<ExtractFormFieldOutputValue<CurrencyField>>().toEqualTypeOf<'EUR' | 'USD' | null>()
    expectTypeOf<ExtractFormFieldOutputValue<RolesField>>().toEqualTypeOf<
      readonly ('admin' | 'reviewer')[] | null
    >()
    expectTypeOf<ExtractFormFieldOutputValue<TagField>>().toEqualTypeOf<readonly string[]>()
    expectTypeOf<ExtractFormFieldOutputValue<RangeSliderField>>().toEqualTypeOf<readonly number[]>()
    expectTypeOf<ExtractFormFieldOutputValue<MultipleFileField>>().toEqualTypeOf<readonly File[]>()
    expectTypeOf<ExtractFormFieldOutputValue<AutoCompleteField>>().toEqualTypeOf<
      readonly ('ada' | 'grace')[] | null
    >()
    expectTypeOf<ExtractFormFieldOutputValue<RadioCardField>>().toEqualTypeOf<
      'basic' | 'pro' | null
    >()
    expectTypeOf<ExtractFormFieldOutputValue<CheckboxCardField>>().toEqualTypeOf<
      readonly ('reports' | 'exports')[] | null
    >()
    expectTypeOf<ExtractFormFieldOutputValue<SwitchGroupField>>().toEqualTypeOf<
      readonly ('email' | 'sms')[] | null
    >()
    expectTypeOf<ExtractFormFieldOutputValue<RatingField>>().toEqualTypeOf<number | null>()
    expectTypeOf<ExtractFormFieldOutputValue<TimeField>>().toEqualTypeOf<string | null>()
    expectTypeOf<ExtractFormFieldOutputValue<SelectedQueryField>>().toEqualTypeOf<'draft' | null>()
  })

  it('removes null from required field output', () => {
    expectTypeOf<ExtractFormOutput<typeof requiredSchema>>().toEqualTypeOf<{
      email: string
      password: string
    }>()
  })

  it('infers matrix rows and discriminated array variants', () => {
    type MatrixOutput = ExtractFormOutput<typeof matrixSchema>

    expectTypeOf<MatrixOutput['permissions']['users']>().toEqualTypeOf<{
      read: boolean
      scope: 'own' | 'all' | null
    }>()
    expectTypeOf<MatrixOutput['permissions']['orders']>().toEqualTypeOf<{
      read: boolean
      scope: 'own' | 'all' | null
    }>()
    expectTypeOf<MatrixOutput['contacts'][number]>().toEqualTypeOf<
      | { kind: 'email'; address: string | null; rank: number }
      | { kind: 'phone'; number: string | null }
    >()
  })

  it('types useFormSubmit handlers from submitted output', () => {
    const formRef = shallowRef<FormSubmitTarget<SchemaOutput> | null>(null)

    useFormSubmit({
      formRef,
      onSubmit: ({ formData, api }) => {
        expectTypeOf(formData.profile.name).toEqualTypeOf<string>()
        expectTypeOf(formData.meta.score).toEqualTypeOf<string>()
        expectTypeOf(formData.roles).toEqualTypeOf<readonly ('admin' | 'reviewer')[] | null>()
        api.setError('profile.name', 'This name is unavailable.')
        api.clearError('profile.name')
        api.clearError()
        // @ts-expect-error external errors target fields in the inferred submitted output
        api.setError('missing', 'Unknown field.')

        return { success: true }
      },
      schema,
    })
  })

  it('types useForm controller state, output, and submit handlers from the schema', () => {
    const form = useForm({
      onSubmit: ({ formData }) => {
        expectTypeOf(formData.profile.name).toEqualTypeOf<string>()
        expectTypeOf(formData.meta.score).toEqualTypeOf<string>()
        expectTypeOf(formData.roles).toEqualTypeOf<readonly ('admin' | 'reviewer')[] | null>()

        return { success: true }
      },
      schema,
    })

    type FormController = typeof form

    expectTypeOf<FormController['state']['internal']['value']['profile']['name']>().toEqualTypeOf<
      string | null
    >()
    expectTypeOf<
      FormController['state']['output']['value']['profile']['name']
    >().toEqualTypeOf<string>()
    expectTypeOf<FormController['context']['value']['countries']['value']>().toEqualTypeOf<
      { label: string; value: string }[] | undefined
    >()
    expectTypeOf<FormController['output']['value']['meta']['score']>().toEqualTypeOf<string>()
    expectTypeOf<FormController['meta']['isDirty']['value']>().toEqualTypeOf<boolean>()
    expectTypeOf<FormController['state']['get']>().parameters.toEqualTypeOf<[path: string]>()
    expectTypeOf<FormController['state']['set']>().parameters.toEqualTypeOf<
      [path: string, value: unknown]
    >()
    expectTypeOf<FormController['validation']['getError']>().parameters.toEqualTypeOf<
      [path: string]
    >()
    expectTypeOf<FormController['submission']['isSubmitting']['value']>().toEqualTypeOf<boolean>()
    expectTypeOf<FormController['navigation']['canGoNext']['value']>().toEqualTypeOf<boolean>()
    expectTypeOf<FormController['previousStep']>().returns.toEqualTypeOf<Promise<boolean>>()
  })
})
