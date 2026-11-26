import { fileURLToPath, URL } from 'node:url'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // React Compiler: useMemo/useCallback 없이도 자동으로 메모이제이션해요.
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // 화면을 지연 로딩하면 개발 서버가 의존성을 나눠서 여러 번 묶다가 React가 두 벌 생길 수 있어요.
  // 처음부터 한 번에 묶도록 미리 알려 줘요.
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react/compiler-runtime',
      'react-router',
      '@tanstack/react-query',
      '@phosphor-icons/react',
      'zustand',
      'zustand/middleware',
      'zustand/react/shallow',
      'uqr',
    ],
  },
  server: {
    port: 5173,
    // 로컬 개발: /api 요청을 FastAPI(uvicorn)로 넘겨요. 운영에서는 Vercel이 같은 도메인으로 연결해요.
    proxy: { '/api': 'http://localhost:8000' },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // 자주 바뀌지 않는 라이브러리는 따로 묶어서 브라우저 캐시를 오래 쓰게 해요.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // Vite는 Windows에서도 모듈 경로를 / 로 맞춰 줘요
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
          if (/node_modules\/(react-router|@tanstack|zustand)\//.test(id)) return 'vendor'
        },
      },
    },
  },
})
