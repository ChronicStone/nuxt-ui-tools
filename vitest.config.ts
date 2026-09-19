import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vitest/config'

const root = new URL('./', import.meta.url).pathname

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: [
      { find: /^#ui-tools\/(.*)$/u, replacement: `${root}src/runtime/$1` },
      { find: /^nuxt\/app$/u, replacement: `${root}test/dom/stubs/nuxt-app.ts` },
      {
        find: /^@nuxt\/ui\/composables\/useLocale$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui-locale.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/Badge\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/badge.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/Button\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/button.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/Calendar\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/calendar.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/Checkbox\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/checkbox.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/Drawer\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/drawer.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/DropdownMenu\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/dropdown-menu.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/FieldGroup\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/field-group.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/Icon\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/icon.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/Input\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/input.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/InputDate\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/input-date.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/InputNumber\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/input-number.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/Pagination\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/pagination.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/Popover\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/popover.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/RadioGroup\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/radio-group.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/ScrollArea\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/scroll-area.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/Select\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/select.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/Skeleton\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/skeleton.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/Slideover\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/slideover.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/Slider\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/slider.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/Tooltip\.vue$/u,
        replacement: `${root}test/dom/stubs/nuxt-ui/tooltip.ts`,
      },
      { find: /^vue-draggable-plus$/u, replacement: `${root}test/dom/stubs/vue-draggable-plus.ts` },
    ],
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          exclude: ['test/fixtures/**', 'test/dom/**'],
          include: ['test/**/*.test.ts'],
          name: 'unit',
        },
      },
      {
        extends: true,
        test: {
          environment: 'happy-dom',
          include: ['test/dom/**/*.test.ts'],
          name: 'dom',
          setupFiles: ['test/dom/setup.ts'],
        },
      },
    ],
  },
})
