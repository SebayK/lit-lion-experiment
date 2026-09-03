import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  nodeResolve: true,
  files: ['src/**/*.test.ts'],
  plugins: [
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
    })
  ]
};
