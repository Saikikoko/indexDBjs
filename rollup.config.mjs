import * as fs from 'fs';
import terser from '@rollup/plugin-terser';
import filesize from 'rollup-plugin-filesize';
import license from 'rollup-plugin-license';

const loadJSON = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));

const pkg = loadJSON('./package.json');

const licenseBanner = license({
  banner: {
    content: '/*! <%= pkg.name %> v<%= pkg.version %> | <%= pkg.license %> */',
    commentStyle: 'none',
  },
});

export default [
  {
    input: 'src/index.mjs',
    output: [
      // config for <script type="module">
      {
        file: pkg.module,
        format: 'esm',
      },
      // config for <script nomodule>
      {
        file: pkg.browser,
        format: 'umd',
        name: 'IndexDB',
        noConflict: true,
        banner: ';',
      },
    ],
    plugins: [licenseBanner],
  },
  {
    input: 'src/index.mjs',
    output: [
      // config for <script type="module">
      {
        file: pkg.module.replace('.mjs', '.min.mjs'),
        format: 'esm',
      },
      // config for <script nomodule>
      {
        file: pkg.browser.replace('.js', '.min.js'),
        format: 'umd',
        name: 'IndexDB',
        noConflict: true,
      },
    ],
    plugins: [
      terser(),
      licenseBanner, // must be applied after terser, otherwise it's being stripped away...
      filesize(),
    ],
  },
];
