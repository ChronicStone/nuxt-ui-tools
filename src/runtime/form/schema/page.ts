import type {
  FormContextData,
  FormContextDefinition,
  FormObject,
  FormPageSchema,
  FormPageSchemaInput,
  FormPageSection,
  FormValue,
} from '../types'
import { isRecord } from '../utils/path'

/**
 * Defines one section of a form page while preserving literal field inference, so each section
 * can live in its own file as a plain typed function.
 *
 * @example
 * ```ts
 * export function billingSection({ hasActiveContract }: { hasActiveContract: boolean }) {
 *   return defineFormPageSection({
 *     key: 'billing',
 *     label: () => t('account.sections.billing'),
 *     fields: [
 *       {
 *         key: 'vtestId',
 *         type: 'text',
 *         label: 'VTEST ID',
 *         // `accountType` belongs to another section: a page is one form, one state.
 *         dependencies: ['accountType'],
 *         required: ({ deps }) => hasActiveContract || 'accountType' in deps,
 *       },
 *     ],
 *   })
 * }
 * ```
 */
export function defineFormPageSection<const TSection extends FormPageSection>(section: TSection) {
  return section
}

/**
 * Defines a form page: one form whose fields are grouped in `sections`. Each section becomes a
 * card of the page and an entry of its navigation; render it with `<UiFormPage :form />`.
 *
 * The result is a normal form schema. Its `fields` are the cards generated from the sections,
 * so `useForm`, validation, cross-section dependencies, and the typed `formData` work as for any
 * schema, and the same schema opens in a modal or drawer as a stack of cards.
 *
 * @example
 * ```ts
 * export function accountFormSchema({ account }: { account?: Account } = {}) {
 *   return defineFormPageSchema({
 *     header: { title: () => t(account ? 'account.edit' : 'account.create') },
 *     controls: { dirtyCheck: Boolean(account) },
 *     navigation: { title: () => t('account.sections.title') },
 *     sections: [accountTypeSection(), identitySection(), billingSection({ hasActiveContract: false })],
 *   })
 * }
 * ```
 */
export function defineFormPageSchema<
  const TContext extends FormContextDefinition,
  const TSections extends readonly FormPageSection<FormContextData<NoInfer<TContext>>>[],
>(
  schema: FormPageSchemaInput<TContext, TSections> & { context: TContext },
): FormPageSchema<FormPageSchemaInput<TContext, TSections>>
export function defineFormPageSchema<
  const TSections extends readonly FormPageSection<FormContextData<undefined>>[],
>(
  schema: FormPageSchemaInput<undefined, TSections>,
): FormPageSchema<FormPageSchemaInput<undefined, TSections>>
export function defineFormPageSchema(schema: FormValue) {
  if (!isRecord(schema) || !Array.isArray(schema.sections)) {
    return schema
  }
  return { ...schema, fields: schema.sections.filter(isRecord).map(toSectionCard) }
}

const CARD_PROPERTIES = ['condition', 'dependencies', 'description'] as const

function toSectionCard(section: FormObject): FormObject {
  const card: FormObject = {
    fields: section.fields,
    key: section.key,
    label: section.label,
    type: 'card',
  }
  for (const property of CARD_PROPERTIES) {
    if (section[property] !== undefined) {
      card[property] = section[property]
    }
  }
  return card
}
