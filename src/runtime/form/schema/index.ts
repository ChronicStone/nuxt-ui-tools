import type { GenericObject } from '../../shared/types/utils'
import type {
  FormAction,
  FormApi,
  FormContextData,
  FormContextDefinition,
  FormField,
  FormLayoutConfig,
  FormMaybePromise,
  FormSubmitHandler,
  FormStep,
  FormStepLifecycleParams,
  FormText,
} from '../types'

type FormSchemaSubmit<TContext extends FormContextDefinition | undefined> = (params: {
  value: unknown
  api: FormApi
  ctx: FormContextData<TContext>
}) => Promise<void> | void

interface FormSchemaBase<TContext extends FormContextDefinition | undefined> {
  formKey?: string
  title?: FormText
  context: TContext
  layout?: FormLayoutConfig
  showStepper?: boolean
  controls?: import('../types').FormControlsConfig
  modal?: import('../types').FormModalConfig
  drawer?: import('../types').FormDrawerConfig
  fullscreen?: import('../types').FormFullscreenConfig
  actions?: readonly FormAction[]
  onBeforeSubmit?: FormSubmitHandler<unknown, never>
  submit?: FormSchemaSubmit<TContext>
  onBeforeNext?: (params: FormStepLifecycleParams<unknown>) => FormMaybePromise<boolean | void>
  onBeforePrevious?: (params: FormStepLifecycleParams<unknown>) => FormMaybePromise<void>
  skipStep?: (params: FormStepLifecycleParams<unknown>) => boolean
  onStepSkipped?: (params: Omit<FormStepLifecycleParams<unknown>, 'stepData'>) => void
}

interface FormSchemaWithContextFields<
  TContext extends FormContextDefinition,
  TFields extends readonly FormField<FormContextData<NoInfer<TContext>>>[],
> extends FormSchemaBase<TContext> {
  fields: TFields
  steps?: never
}

interface FormSchemaWithContextSteps<
  TContext extends FormContextDefinition,
  TSteps extends readonly FormStep<FormContextData<NoInfer<TContext>>>[],
> extends FormSchemaBase<TContext> {
  fields?: never
  steps: TSteps
}

interface FormSchemaWithoutContextFields<
  TFields extends readonly FormField<FormContextData<undefined>>[],
> extends Omit<FormSchemaBase<undefined>, 'context'> {
  context?: undefined
  fields: TFields
  steps?: never
}

interface FormSchemaWithoutContextSteps<
  TSteps extends readonly FormStep<FormContextData<undefined>>[],
> extends Omit<FormSchemaBase<undefined>, 'context'> {
  context?: undefined
  fields?: never
  steps: TSteps
}

/**
 * Defines a form schema while preserving literal field and context inference.
 *
 * @example
 * ```ts
 * const schema = defineFormSchema({
 *   context: {
 *     items: () => queryOptions({
 *       queryKey: ['items'],
 *       queryFn: () => api.items.list(),
 *     }),
 *   },
 *   fields: [
 *     {
 *       key: 'item',
 *       type: 'select',
 *       label: 'Item',
 *       options: ({ ctx }) => ctx.items.value ?? [],
 *     },
 *   ],
 * })
 * ```
 */
export function defineFormSchema<const TSchema>(
  schema: TSchema extends {
    readonly context?: undefined
    readonly fields?: never
    readonly steps: readonly unknown[]
  }
    ? TSchema
    : never,
): TSchema
export function defineFormSchema<
  const TContext extends FormContextDefinition,
  const TFields extends readonly FormField<FormContextData<NoInfer<TContext>>>[],
  const TSchema extends GenericObject,
>(schema: TSchema & FormSchemaWithContextFields<TContext, TFields>): TSchema
export function defineFormSchema<
  const TContext extends FormContextDefinition,
  const TSteps extends readonly FormStep<FormContextData<NoInfer<TContext>>>[],
  const TSchema extends GenericObject,
>(
  schema: TSchema & FormSchemaWithContextSteps<TContext, TSteps>,
): TSchema & FormSchemaWithContextSteps<TContext, TSteps>
export function defineFormSchema<
  const TFields extends readonly FormField<FormContextData<undefined>>[],
  const TSchema extends GenericObject,
>(schema: TSchema & FormSchemaWithoutContextFields<TFields>): TSchema
export function defineFormSchema<
  const TSteps extends readonly FormStep<FormContextData<undefined>>[],
  const TSchema extends GenericObject,
>(
  schema: TSchema & FormSchemaWithoutContextSteps<TSteps>,
): TSchema & FormSchemaWithoutContextSteps<TSteps>
export function defineFormSchema(schema: unknown) {
  return schema
}

/**
 * Defines one field while preserving literal inference.
 */
export function defineFormField<const TField extends FormField>(field: TField) {
  return field
}

/**
 * Defines a reusable field group while preserving literal inference.
 */
export function defineFormFields<const TFields extends readonly FormField[]>(fields: TFields) {
  return fields
}
