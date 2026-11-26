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
          if (/[\/](react|react-dom|scheduler)[\/]/.test(id)) return 'react'
          if (/[\/](react-router|@tanstack|zustand)[\/]/.test(id)) return 'vendor'
        },
      },
    },
  },
})
