import { addTemplate, logger } from '@nuxt/kit'
import type { Nuxt, NuxtApp, NuxtTemplate } from '@nuxt/schema'

type TemplateWithContents = NuxtTemplate & {
  filename: string
  getContents: (ctx: { nuxt: Nuxt; app: NuxtApp; options: unknown }) => unknown
}

function isUiCssTemplate(template: NuxtTemplate) {
  if (template.filename === 'ui.css') {
    return true
  }

  return typeof template.dst === 'string' && template.dst.endsWith('/ui.css')
}

function hasContentsGetter(template: NuxtTemplate | undefined): template is TemplateWithContents {
  return typeof template?.filename === 'string' && typeof template.getContents === 'function'
}

export function setupTailwindCss(nuxt: Nuxt, runtimeDir: string) {
  const runtimeSource = `${runtimeDir.replaceAll('\\', '/')}/**/*.{vue,js,mjs,ts,jsx,tsx}`
  const sourceDirective = `@source "${runtimeSource}";`

  nuxt.hook('modules:done', () => {
    const uiCssTemplate = nuxt.options.build.templates.find(isUiCssTemplate)

    if (!hasContentsGetter(uiCssTemplate)) {
      logger.warn(
        '[nuxt-ui-tools] Unable to find Nuxt UI ui.css template, package Tailwind source injection was skipped.',
      )
      return
    }

    addTemplate({
      filename: 'ui.css',
      write: true,
      getContents: async (ctx) => {
        const uiCss = await uiCssTemplate.getContents(ctx)

        if (typeof uiCss !== 'string') return sourceDirective
        if (uiCss.includes(sourceDirective)) return uiCss
        return `${sourceDirective}\n${uiCss}`
      },
    })
  })
}
