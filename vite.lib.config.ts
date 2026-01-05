import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MiniOSMD',
      fileName: 'mini-osmd'
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vexflow', 'jszip'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vexflow: 'Vex',
          jszip: 'JSZip'
        }
      }
    },
    outDir: 'dist-lib'
  },
  plugins: [dts({ include: ['src'] })]
});
