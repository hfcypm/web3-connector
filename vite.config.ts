import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'unplugin-dts/vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib';
  const plugins: PluginOption[] = [react(), tailwindcss()];

  if (isLib) {
    plugins.push(dts({
      entryRoot: 'src/wallet-sdk',
      include: ['src/wallet-sdk'],
      outDirs: ['dist'],
      tsconfigPath: resolve(__dirname, 'tsconfig.app.json'),
    }));
  }

  return {
    plugins,
    server: {
      allowedHosts: ['.monkeycode-ai.online'],
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },

    // 根据模式决定是否使用库模式
    build: isLib ? {
      // 库模式配置
      lib: {
        // 入口文件
        entry: resolve(__dirname, 'src/wallet-sdk/index.ts'),
        // 库名称
        name: 'JacobscodWb3WalletSDK',
        // 输出文件名
        fileName: (format: string) =>
          format === 'cjs'
            ? 'jacobscodwb3-wallet-sdk.cjs'
            : `jacobscodwb3-wallet-sdk.${format}.js`,
        // 输出格式
        formats: ['es', 'umd', 'cjs']
      },
      rollupOptions: {
        // 外部依赖 - 不打包进 SDK
        external: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          'ethers'
        ],
        output: {
          // UMD 模式下的全局变量映射
          globals: {
            'react': 'React',
            'react-dom': 'ReactDOM',
            'react/jsx-runtime': 'React',
            'ethers': 'ethers'
          },
          // 输出目录
          dir: 'dist',
          // 保留模块结构
          preserveModules: false,
          // 代码分割
          manualChunks: undefined
        }
      },
      // 输出目录
      outDir: 'dist',
      // 清空输出目录
      emptyOutDir: true,
      // 生成类型声明文件
      // Note: 需要安装 @types/node 和配置 TypeScript
      target: 'es2015',
      minify: 'terser',
      sourcemap: true
    } : {
      // 静态网页构建配置
      outDir: 'docs',
      emptyOutDir: true,
      target: 'es2015',
      minify: 'terser',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom'],
            'highlight': ['highlight.js']
          }
        }
      }
    },
  };
});
