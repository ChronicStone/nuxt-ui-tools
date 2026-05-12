import { describe, expectTypeOf, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'
import type {
  ExtractFormFields,
  ExtractFormInternalValue,
  ExtractFormOutput,
  ExtractFormSteps,
} from '#ui-tools/form'

const resetPasswordSchema = defineFormSchema({
  formKey: 'auth.reset-password',
  showStepper: false,
  steps: [
    {
      key: 'credentials',
      fields: [
        {
          key: 'password',
          type: 'password',
          validation: {
            required: true,
          },
        },
        {
          key: 'confirmPassword',
          type: 'password',
          dependencies: ['password'],
          validation: {
            required: true,
          },
          submit: {
            omit: true,
          },
        },
      ],
    },
  ],
})

const rootedSchema = defineFormSchema({
  formKey: 'account.wizard',
  steps: [
    {
      key: 'account',
      root: 'account',
      fields: [
        {
          key: 'name',
          type: 'text',
        },
        {
          key: 'enabled',
          type: 'checkbox',
          default: true,
        },
      ],
    },
    {
      key: 'metadata',
      root: 'meta.extra',
      fields: [
        {
          key: 'erpId',
          type: 'text',
          condition: () => true,
        },
      ],
    },
  ],
})

type ResetInternalValue = ExtractFormInternalValue<typeof resetPasswordSchema>
type ResetOutput = ExtractFormOutput<typeof resetPasswordSchema>
type RootedOutput = ExtractFormOutput<typeof rootedSchema>
type RootedSteps = ExtractFormSteps<typeof rootedSchema>
type RootedFields = ExtractFormFields<typeof rootedSchema>

describe('stepped form output inference', () => {
  it('keeps omitted fields internally and excludes them from submitted output', () => {
    expectTypeOf<ResetInternalValue['password']>().toEqualTypeOf<string | null>()
    expectTypeOf<ResetInternalValue['confirmPassword']>().toEqualTypeOf<string | null>()
    expectTypeOf<ResetOutput['password']>().toEqualTypeOf<string | null>()
    expectTypeOf<ResetOutput>().not.toHaveProperty('confirmPassword')
  })

  it('maps step roots to nested output paths', () => {
    expectTypeOf<RootedOutput>().toMatchTypeOf<{
      account: {
        name: string | null
        enabled: boolean
      }
      meta: {
        extra: {
          erpId?: string | null
        }
      }
    }>()
  })

  it('extracts authored steps and step field collections', () => {
    expectTypeOf<RootedSteps[number]['key']>().toMatchTypeOf<'account' | 'metadata'>()
    expectTypeOf<RootedFields[number]['type']>().toMatchTypeOf<'text' | 'checkbox'>()
  })
})
