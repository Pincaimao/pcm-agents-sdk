/// <reference types="node" />
import { Config } from '@stencil/core';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';
import { readFileSync } from 'fs';
import dotenvPlugin from 'rollup-plugin-dotenv';
import * as dotenv from 'dotenv';

// 加载 .env 文件
dotenv.config();

export const config: Config = {
  namespace: 'pcm-agents',
  extras: {
    enableImportInjection: true,
  },
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },
    {
      type: 'docs-readme',
      dir: 'docs',
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
    },
    reactOutputTarget({
      outDir: '../pcm-agents-react/src/components/stencil-generated',
    }),
    vueOutputTarget({
      componentCorePackage: 'pcm-agents',
      proxiesFile: '../pcm-agents-vue/lib/components.ts',
    }),
  ],
  testing: {
    browserHeadless: 'shell',
  },
  rollupPlugins: {
    after: [
      {
        name: 'remove-console-log',
        transform(code, id) {
          if (process.argv.includes('--prod')) {
            // 使用更安全的方式，匹配整行
            const result = code.replace(/^\s*console\.log\(.*?\);\s*$/gm, '');

            if (result === code) {
              return null;
            }

            return {
              code: result,
              map: { mappings: '' },
            };
          } else {
            // 在非生产环境下也应该返回 null 或者正确的 map
            return null; // 表示不做任何修改
          }
        },
      },
    ],
  },
  devServer: {
    reloadStrategy: 'pageReload',
    port: 4444,
    https: {
      // cert: readFileSync('/Users/debugksir/Documents/webarcx/webarcx_com.pem', 'utf8'),
      // key: readFileSync('/Users/debugksir/Documents/webarcx/webarcx_com.key', 'utf8'),
      cert: readFileSync('C:/Users/Administrator/Downloads/webarcx_com.pem', 'utf8'),
      key: readFileSync('C:/Users/Administrator/Downloads/webarcx_com.key', 'utf8'),
    },
  },
  globalScript: 'src/utils/init.ts',
  plugins: [dotenvPlugin()],
  // 将环境变量传递给构建过程
  env: {
    API_DOMAIN: process.env.API_DOMAIN || 'https://api.pincaimao.com/agents/platform',
    PCM_DOMAIN: process.env.PCM_DOMAIN || 'http://www.pincaimao.com',
  },
};
