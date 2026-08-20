import { logger } from "@nuxt/kit";
import type { Nuxt, NuxtTemplate } from "@nuxt/schema";

import { isFunction, isString } from "./runtime/shared/utils/predicate";

type TemplateWithContents = NuxtTemplate & {
  filename: string;
  getContents: NonNullable<NuxtTemplate["getContents"]>;
};

function isUiCssTemplate(template: NuxtTemplate) {
  if (template.filename === "ui.css") {
    return true;
  }

  return isString(template.dst) && template.dst.endsWith("/ui.css");
}

function hasContentsGetter(
  template: NuxtTemplate | undefined,
): template is TemplateWithContents {
  return isString(template?.filename) && isFunction(template.getContents);
}

export function setupTailwindCss(nuxt: Nuxt, runtimeDir: string) {
  const runtimeSource = `${runtimeDir.replaceAll("\\", "/")}/**/*.{vue,js,mjs,ts,jsx,tsx}`;
  const sourceDirective = `@source "${runtimeSource}";`;

  nuxt.hook("ready", () => {
    const uiCssTemplate = nuxt.options.build.templates.find(isUiCssTemplate);

    if (!hasContentsGetter(uiCssTemplate)) {
      logger.warn(
        "[nuxt-ui-tools] Unable to find Nuxt UI ui.css template, package Tailwind source injection was skipped.",
      );
      return;
    }

    const getUiCss = uiCssTemplate.getContents;
    uiCssTemplate.getContents = async (ctx) => {
      const uiCss = await getUiCss(ctx);

      if (!isString(uiCss)) return sourceDirective;
      if (uiCss.includes(sourceDirective)) return uiCss;
      return `${sourceDirective}\n${uiCss}`;
    };
  });
}
