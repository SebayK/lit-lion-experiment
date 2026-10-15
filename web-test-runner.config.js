import { esbuildPlugin } from '@web/dev-server-esbuild';
import { mockPlugin } from '@web/mocks/plugins.js';

export default {
  nodeResolve: true,
  concurrency: 1,
  files: ['src/**/*.test.ts'],
  testRunnerHtml: testFramework =>
    `<html>
      <head>
        <script>
          window.process = window.process || { env: { NODE_ENV: 'development' } };
        </script>
        <script type="module" src="${testFramework}"></script>
      </head>
    </html>`,
  plugins: [
    mockPlugin(),
    {
      name: 'ts-resolver',
      resolveImport({ source, context }) {
        if (source.endsWith('.js') && source.startsWith('.') && !context.path.includes('node_modules')) {
          return source.replace(/\.js$/, '.ts');
        }
      }
    },
    esbuildPlugin({
      ts: true,
      tsconfig: './tsconfig.json',
      target: 'auto',
      define: {
        'process.env.NODE_ENV': '"development"',
      },
    })
  ]
};
