import { inject, provide, shallowRef } from 'vue'
import type { InjectionKey, Ref } from 'vue'

const formFieldBareKey: InjectionKey<Readonly<Ref<boolean>>> = Symbol('form-field-bare')

export function provideFormFieldBare(bare: Readonly<Ref<boolean>>) {
  provide(formFieldBareKey, bare)
}

export function useFormFieldBare() {
  return inject(formFieldBareKey, shallowRef<boolean>(false))
}
