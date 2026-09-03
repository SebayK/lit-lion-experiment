import { esbuildPlugin } from '@web/dev-server-esbuild';
import { mockPlugin } from '@web/mocks/plugins.js';

export default {
  nodeResolve: true,
  watch: true,
  appIndex: 'index.html',
  middlewares: [
    function spaFallback(context, next) {
      if (!context.url.includes('.') && !context.url.startsWith('/node_modules')) {
        context.url = '/index.html';
      }
      return next();
    }
  ],
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
      target: 'es2022',
      define: { 'process.env.NODE_ENV': '"development"' }
    })
  ]
};
