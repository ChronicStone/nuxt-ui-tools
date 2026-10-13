import type { FormPageSurface, FormValue } from '../types'
import { isString } from './predicate'

/**
 * What a surface sets on the parts of a form page it restyles. These are the default classes of
 * each slot: the `FormPageUi` slots merge over them.
 */
export interface FormPageSurfaceClasses {
  /** Background the sections sit on. */
  root: string
  /** Gap between the sections. */
  sections: string
  /** The box of a card, or the spacing, hairline, and modified marker of a plain section. */
  section: string
  /** Where the description sits against the title. */
  sectionDescription: string
  /** Placeholder shown while the schema context loads. */
  sectionSkeleton: string
}

/**
 * The centered column of a page without a navigation. The body and the row of the header share
 * it, so both start and end on the same edges, padding included.
 */
export const FORM_PAGE_COLUMN = 'mx-auto w-full max-w-[816px]'

export const DEFAULT_FORM_PAGE_SURFACE: FormPageSurface = 'card'

/**
 * A card is a bordered box that rings when modified. A plain section has no box: it is separated
 * from the previous one by spacing and a hairline (none above the first, no padding below the
 * last), and a modified one gets a bar in the margin beside it.
 */
const FORM_PAGE_SURFACES: Record<FormPageSurface, FormPageSurfaceClasses> = {
  card: {
    root: 'bg-muted',
    section:
      'gap-[18px] rounded-xl border border-default bg-default px-5 pt-5 pb-6 transition-[border-color,box-shadow] duration-200 @3xl/form-page:px-6 @3xl/form-page:pt-[22px] data-[dirty]:border-primary data-[dirty]:ring-4 data-[dirty]:ring-primary/20 data-[dirty]:ring-inset',
    sectionDescription: 'order-last basis-full @3xl/form-page:order-none @3xl/form-page:basis-auto',
    sectionSkeleton: 'rounded-xl border border-default bg-default px-6 pt-[22px] pb-6',
    sections: 'gap-[18px]',
  },
  plain: {
    root: 'bg-default',
    section:
      'relative gap-[18px] border-t border-default py-8 first:border-t-0 first:pt-0 last:pb-0 before:pointer-events-none before:absolute before:inset-y-8 before:-start-3 before:w-0.5 before:rounded-full before:transition-colors first:before:top-0 last:before:bottom-0 data-[dirty]:before:bg-primary',
    sectionDescription: 'order-last basis-full',
    sectionSkeleton: 'border-t border-default py-8 first:border-t-0 first:pt-0',
    sections: 'gap-0',
  },
}

/** The surface a page draws its sections with, `card` unless the config names a known one. */
export function resolveFormPageSurface(value: FormValue): FormPageSurface {
  return isFormPageSurface(value) ? value : DEFAULT_FORM_PAGE_SURFACE
}

export function getFormPageSurfaceClasses(surface: FormPageSurface) {
  return FORM_PAGE_SURFACES[surface]
}

function isFormPageSurface(value: FormValue): value is FormPageSurface {
  return isString(value) && Object.hasOwn(FORM_PAGE_SURFACES, value)
}
