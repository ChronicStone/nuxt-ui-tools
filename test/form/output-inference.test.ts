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
  FormApiController,
  FormApiCreateResult,
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
        output: (value) => value?.trim() ?? '',
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
          queryKey: [
            'cities',
            ctx.countries.value?.map((country) => country.value).join(',') ?? 'none',
          ],
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
      key: 'phone',
      type: 'phone-number',
      defaultCountryCode: 'FR',
      disabled: ({ api }) => {
        expectTypeOf(api.value.get()).toEqualTypeOf<string | null>()

        return false
      },
    },
    {
      key: 'document',
      type: 'upload',
      output: 'object',
      upload: {
        handler: async ({ files }) => {
          expectTypeOf(files).toEqualTypeOf<readonly File[]>()

          return { url: files[0]?.name ?? 'empty' }
        },
      },
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
            output: (value) => String(value ?? 0),
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
      key: 'presentation',
      type: 'card',
      label: 'Presentation',
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
    },
    {
      key: 'stacked',
      type: 'column',
      fields: [
        {
          key: 'columnNote',
          type: 'text',
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

const steppedLifecycleSchema = defineFormSchema({
  steps: [
    {
      key: 'first',
      fields: [
        {
          key: 'firstName',
          type: 'text',
        },
      ],
    },
    {
      key: 'second',
      fields: [
        {
          key: 'lastName',
          type: 'text',
        },
      ],
    },
  ],
  onBeforeNext: ({ api, formData, stepIndex }) => {
    expectTypeOf(api.validate({ focus: true })).toEqualTypeOf<Promise<boolean>>()
    expectTypeOf(formData).toEqualTypeOf<unknown>()
    expectTypeOf(stepIndex).toEqualTypeOf<number>()
    return true
  },
  onBeforePrevious: ({ api }) => {
    expectTypeOf(api.focus('firstName')).toEqualTypeOf<Promise<boolean>>()
  },
  skipStep: ({ stepIndex }) => stepIndex > 10,
  onStepSkipped: ({ api }) => {
    api.reset()
  },
})

void steppedLifecycleSchema

type SchemaContext = ExtractFormContext<typeof schema>
type SchemaFields = ExtractFormFields<typeof schema>
type SchemaInternalValue = ExtractFormInternalValue<typeof schema>
type SchemaOutput = ExtractFormOutput<typeof schema>
type NameField = Extract<SchemaFields[number], { key: 'profile.name' }>
type CurrencyField = Extract<SchemaFields[number], { key: 'currency' }>
type RolesField = Extract<SchemaFields[number], { key: 'roles' }>
type TagField = { key: 'tags'; type: 'tag' }
type RangeSliderField = { key: 'scoreRange'; type: 'slider'; multiple: true }
type MultipleFileField = { key: 'avatar'; type: 'file'; multiple: true }
type AutoCompleteField = {
  key: 'assignees'
  type: 'auto-complete'
  multiple: true
  options: readonly [{ label: 'Ada'; value: 'ada' }, { label: 'Grace'; value: 'grace' }]
}
type RadioCardField = {
  key: 'plan'
  type: 'radio-card'
  options: readonly [{ label: 'Basic'; value: 'basic' }, { label: 'Pro'; value: 'pro' }]
}
type CheckboxCardField = {
  key: 'features'
  type: 'checkbox-card'
  options: readonly ['reports', 'exports']
}
type SwitchGroupField = {
  key: 'notifications'
  type: 'switch-group'
  options: readonly ['email', 'sms']
}
type RatingField = { key: 'rating'; type: 'rating' }
type TimeField = { key: 'startsAt'; type: 'time' }

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
      return { success: true, data: { id: 'created-account' } }
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
