import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import stylelintPlugin from 'vite-plugin-stylelint';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: ['gsat.by1994.top', 'by1994.top', 'localhost', '127.0.0.1'],
        fs: {
          // 允许开发服务器访问项目根目录下的data文件夹
          allow: ['.', '../']
        }
      },
      plugins: [
        react(),
        stylelintPlugin({
          // 配置Stylelint插件
          include: ['**/*.{css,scss,sass,less,styl}'],
          exclude: ['node_modules/', 'dist/', 'build/', '**/*.html'],
          // 在开发模式下启用
          lintOnStart: true,
          // 保存时自动修复
          fix: true
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // 配置publicDir，确保静态资源能被正确处理
      publicDir: 'public',
      // 配置构建选项
      build: {
        outDir: 'dist',
        // 确保路径使用相对路径，避免绝对路径问题
        assetsDir: 'assets',
        // 启用代码分割
        sourcemap: false,
        // 优化构建速度
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          }
        },
        rollupOptions: {
          output: {
            // 确保静态资源正确引用
            assetFileNames: 'assets/[name]-[hash][extname]',
            // 代码分割配置
            manualChunks: {
              // 将第三方库拆分成单独的chunk
              'react-vendor': ['react', 'react-dom'],
              'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
              'satellite': ['satellite.js'],
              'ui-utils': ['clsx', 'tailwind-merge', 'lucide-react']
            }
          }
        },
        // 增加chunk大小警告限制
        chunkSizeWarningLimit: 1000
      }
    };
});
