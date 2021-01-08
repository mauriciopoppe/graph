import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'

const pkg = require('./package.json')

export default [
  {
    input: `.compiled/index.js`,
    output: [
      { file: pkg.main, name: 'graph', format: 'umd', sourcemap: true },
      { file: pkg.module, format: 'es', sourcemap: true }
    ],
    external: [],
    plugins: [
      resolve(),
      commonjs(),
      sourceMaps()
    ]
  }
]
