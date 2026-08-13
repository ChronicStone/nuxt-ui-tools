import { inject, provide, shallowRef } from 'vue'
import type { InjectionKey, Ref } from 'vue'

import type { FormObject } from '../types'

const formFieldBareKey: InjectionKey<Readonly<Ref<boolean>>> = Symbol('form-field-bare')
const formFieldControlAttrsKey: InjectionKey<Readonly<Ref<FormObject>>> = Symbol(
  'form-field-control-attrs',
)

export function provideFormFieldBare(bare: Readonly<Ref<boolean>>) {
  provide(formFieldBareKey, bare)
}

export function useFormFieldBare() {
  return inject(formFieldBareKey, shallowRef<boolean>(false))
}

export function provideFormFieldControlAttrs(attrs: Readonly<Ref<FormObject>>) {
  provide(formFieldControlAttrsKey, attrs)
}

export function useFormFieldControlAttrs() {
  return inject(formFieldControlAttrsKey, shallowRef<FormObject>({}))
}
