import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const cwd = process.cwd()
const tsconfigPath = cwd.endsWith('/playground')
  ? resolve(cwd, '.nuxt/tsconfig.json')
  : resolve(cwd, 'playground/.nuxt/tsconfig.json')
const originalPlugin = 'vue-router/volar/sfc-route-blocks'
const patchedPlugin = 'unplugin-vue-router/volar/sfc-route-blocks'

const raw = await readFile(tsconfigPath, 'utf8')
const data = JSON.parse(raw)
const plugins = data.vueCompilerOptions?.plugins

if (!Array.isArray(plugins) || !plugins.includes(originalPlugin)) {
  process.exit(0)
}

data.vueCompilerOptions.plugins = plugins.map((plugin) =>
  plugin === originalPlugin ? patchedPlugin : plugin,
)

await writeFile(tsconfigPath, `${JSON.stringify(data, null, 2)}\n`)
