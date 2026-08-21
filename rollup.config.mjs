import terser from '@rollup/plugin-terser';

export default {
  input: './src/QCP.js',
  output: {
    file: './dist/bundle.js',
    format: 'esm'
  },
  plugins: [
    terser({
      compress: {
        drop_console: true
      }
    })
  ]
}
