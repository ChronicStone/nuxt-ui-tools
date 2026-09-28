import { inject, provide, shallowRef } from 'vue'
import type { InjectionKey, Ref } from 'vue'

import type { FormObject } from '../types'

const formFieldBareKey: InjectionKey<Readonly<Ref<boolean>>> = Symbol('form-field-bare')
const formFieldControlAttrsKey: InjectionKey<Readonly<Ref<FormObject>>> = Symbol(
  'form-field-control-attrs',
)
/** Tells whether an ancestor, such as an array-table row, runs the watchers of a field path. */
const formFieldWatchOwnerKey: InjectionKey<(path: readonly string[]) => boolean> =
  Symbol('form-field-watch-owner')

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

/**
 * Declares that the providing component runs the effects and validation watchers of the field
 * paths `owns` accepts, so the fields rendered below it do not start them a second time.
 */
export function provideFormFieldWatchOwner(owns: (path: readonly string[]) => boolean) {
  const parent = inject(formFieldWatchOwnerKey, undefined)
  provide(formFieldWatchOwnerKey, (path) => owns(path) || parent?.(path) === true)
}

/** Returns whether an ancestor runs the watchers of a field path. */
export function useFormFieldWatchOwner() {
  return inject(formFieldWatchOwnerKey, () => false)
}
