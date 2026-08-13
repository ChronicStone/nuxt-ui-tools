export default defineAppConfig({
  ui: {
    colors: {
      primary: 'cyan',
      neutral: 'stone',
    },
    input: {
      slots: {
        base: 'playground-global-input-theme',
      },
    },
  },
  nuxtUiTools: {
    dataList: {
      search: {
        ui: {
          root: 'playground-data-list-search-theme',
        },
      },
    },
  },
  playground: {
    surface: 'mist',
    radius: 'md',
    density: 'relaxed',
  },
})
