import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'

const pkg = require('./package.json')

export default [
  {
    entry: `.compiled/index.js`,
    targets: [
      { dest: pkg.main, moduleName: 'graph', format: 'umd' },
      { dest: pkg.module, format: 'es' }
    ],
    sourceMap: true,
    external: [],
    plugins: [
      resolve(),
      commonjs(),
      sourceMaps()
    ]
  },
  {
    entry: `.compiled-es5/index.js`,
    targets: [
      { dest: pkg['main:es5'], moduleName: 'graph', format: 'umd' },
    ],
    sourceMap: true,
    external: [],
    plugins: [
      resolve(),
      commonjs(),
      sourceMaps()
    ]
  }
]
