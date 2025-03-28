import { Config } from '@stencil/core';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';
import { readFileSync } from 'fs';
export const config: Config = {
  namespace: 'pcm-agents',
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
    browserHeadless: "shell",
  },
  devServer: {
    reloadStrategy: 'pageReload',
    port: 4444,
    https: {
      cert: readFileSync('C:/Users/Administrator/Downloads/webarcx_com.pem', 'utf8'),
      key: readFileSync('C:/Users/Administrator/Downloads/webarcx_com.key', 'utf8'),
    },
  },
};
