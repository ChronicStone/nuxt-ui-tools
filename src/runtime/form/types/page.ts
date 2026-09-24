import type { FormValue } from './'
import type { FormAction } from './actions'
import type { FormApi, FormSubmitHandler } from './api'
import type { FormFieldCallback } from './callbacks'
import type { FormContextData, FormContextDefinition } from './context'
import type { FormField } from './field'
import type { FormLayoutConfig } from './layout'
import type {
  FormControlsConfig,
  FormDrawerConfig,
  FormFullscreenConfig,
  FormHeaderConfig,
  FormModalConfig,
} from './schema'
import type { FormUiConfig } from './ui'
import type { FormText } from './utils'

/**
 * One section of a form page: a card in the page and an entry in its navigation.
 *
 * Every text accepts a function, so it can be translated:
 * `label: () => t('account.sections.identity')`.
 *
 * @example
 * ```ts
 * export function identitySection() {
 *   return defineFormPageSection({
 *     key: 'identity',
 *     label: 'Identity',
 *     description: 'display name, legal entity and official identifiers',
 *     fields: [
 *       { key: 'name', type: 'text', label: 'Name', required: true },
 *       { key: 'legalEntity', type: 'text', label: 'Legal entity', required: true },
 *     ],
 *   })
 * }
 * ```
 */
export interface FormPageSection<
  TContext = NonNullable<unknown>,
  TFields extends readonly FormField<TContext>[] = readonly FormField<TContext>[],
> {
  /**
   * Names the section: its navigation entry, its scroll target, and the URL hash that opens the
   * page on it (`#identity`). Also used as the section element's `id`, so keep it unique on the
   * page. It does not prefix the keys of the section's fields.
   */
  key: string
  /** Title on the section card and in the navigation. */
  label: FormText
  /** Supporting copy next to the title. */
  description?: FormText
  /**
   * Shows the section as optional and leaves it out of the sections left to complete. A section
   * without a required field is optional already; set this when its required fields are filled
   * by their defaults and the user has nothing to do there.
   */
  optional?: boolean
  /** Grid of the section's fields, merged over the schema `layout`. */
  layout?: FormLayoutConfig
  /** Raw dependency paths read before evaluating `condition`. */
  dependencies?: readonly (string | readonly [string, string])[]
  /** Hides the section, its navigation entry, and its fields while it returns `false`. */
  condition?: FormFieldCallback<boolean, TContext>
  /** Fields of the section. They write at the form root, as if the section were not there. */
  fields: TFields
}

/**
 * Side navigation of a form page. Its entries are the page sections.
 */
export interface FormPageNavigationConfig {
  /** Heading above the entries, e.g. `'Création'`. Accepts a function to translate it. */
  title?: FormText
}

/**
 * Schema accepted by `defineFormPageSchema`: a form schema whose `sections` replace `fields`.
 */
export interface FormPageSchemaInput<
  TContext extends FormContextDefinition | undefined,
  TSections extends readonly FormPageSection<FormContextData<TContext>>[],
> {
  /** Stable key used by persistence, diagnostics, and test selectors. */
  formKey?: string
  /** Page heading: `title`, `description`, and the `eyebrow` above the title. */
  header?: FormHeaderConfig
  /** Form-scoped data sources exposed to fields as `ctx`. */
  context?: TContext
  /** Default grid of every section. */
  layout?: FormLayoutConfig
  /** Form-scoped presentation overrides, merged after app defaults. */
  ui?: FormUiConfig
  /** Runtime lifecycle and validation controls. `dirtyCheck` rings the modified sections. */
  controls?: FormControlsConfig
  /** Modal-shell sizing, used when the same schema opens in a modal. */
  modal?: FormModalConfig
  /** Drawer-shell sizing, used when the same schema opens in a drawer. */
  drawer?: FormDrawerConfig
  /** Fullscreen-shell behavior, used when the same schema opens fullscreen. */
  fullscreen?: FormFullscreenConfig
  /** Page actions. Omit to render the built-in submit action. */
  actions?: readonly FormAction[]
  /** Runs after validation and before the external submit handler. Return `false` to cancel submit. */
  onBeforeSubmit?: FormSubmitHandler<FormValue, never>
  /** Submit lifecycle hook. */
  submit?: (params: {
    value: FormValue
    api: FormApi
    ctx: FormContextData<TContext>
  }) => Promise<void> | void
  /** Side navigation of the page. */
  navigation?: FormPageNavigationConfig
  /** Sections of the page, in navigation order. */
  sections: TSections
}

/**
 * Card field generated from a section. It renders the section when the schema opens in an
 * overlay, and its fields keep their root paths because a card adds no path segment.
 */
export type FormPageSectionCard<TSection> = TSection extends {
  readonly key: infer TKey extends string
  readonly fields: infer TFields
}
  ? { readonly type: 'card'; readonly key: TKey; readonly fields: TFields }
  : never

/** Card fields generated from the sections of a form page, in order. */
export type FormPageSectionCards<TSections extends readonly FormValue[]> = {
  readonly [TIndex in keyof TSections]: FormPageSectionCard<TSections[TIndex]>
}

/**
 * Schema returned by `defineFormPageSchema`: a normal form schema whose `fields` are the cards
 * generated from `sections`, plus the `sections` and `navigation` that `FormPage` reads.
 */
export type FormPageSchema<TInput extends { readonly sections: readonly FormValue[] }> = TInput & {
  readonly fields: FormPageSectionCards<TInput['sections']>
}

/** A section paired with the card generated for it, as the page runtime reads them. */
export interface FormPageSectionEntry {
  section: FormPageSection
  card: FormField
}

/** How a form page scrolls to a section. */
export interface FormPageScrollOptions {
  /** Defaults to `smooth`, or `instant` when the user prefers reduced motion. */
  behavior?: ScrollBehavior
  /** Records the section in the URL hash. Defaults to the page `hash` option. */
  hash?: boolean
  /** Moves focus to the section title, for keyboard and screen reader users. */
  focus?: boolean
}

/**
 * Where a section stands:
 *
 * - `invalid`: it shows at least one validation error
 * - `complete`: nothing required is missing and it shows no error; an optional section also
 *   needs a value, entered by the user or provided by the form input
 * - `pending`: anything else
 */
export type FormPageSectionStatus = 'invalid' | 'complete' | 'pending'

/**
 * Live state of a visible section, as the page navigation and section slots receive it.
 */
export interface FormPageSectionState {
  /** Section key. */
  key: string
  /** Position among the visible sections. */
  index: number
  /** Resolved title. */
  label: string
  /** Resolved supporting copy. */
  description?: string
  /** True when the section is declared optional or has no required field. */
  optional: boolean
  /** Number of required fields without a value. */
  missing: number
  /** Summary of the section's requirements, see `FormPageSectionStatus`. */
  status: FormPageSectionStatus
  /** True when a value of the section differs from the form's baseline. */
  dirty: boolean
  /** Dirty paths inside the section. */
  dirtyPaths: readonly string[]
}
