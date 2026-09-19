import type { FormFieldCallback } from '../../types/callbacks'
import type { FormField } from '../../types/field'
import type { FormStatelessFieldBase } from '../../types/field-base'
import type { FormContainerLayout } from '../../types/layout'
import type { FormText } from '../../types/utils'

export interface FormTab<TContext = NonNullable<unknown>, TDeps = NonNullable<unknown>> {
  key: string
  label: FormText
  icon?: string
  description?: FormText
  fields: readonly FormField<TContext, TDeps>[]
  condition?: FormFieldCallback<boolean, TContext, TDeps>
}

export interface FormTabsField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends Omit<FormStatelessFieldBase<'tabs', TContext, TDeps>, 'layout'> {
  tabs: readonly FormTab<TContext, TDeps>[]
  defaultTab?: string
  variant?: 'pill' | 'link'
  layout?: FormContainerLayout
}
