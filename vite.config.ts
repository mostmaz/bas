import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['lucide-react', 'recharts'],
            utils: ['@google/generative-ai', '@supabase/supabase-js', 'xlsx']
          }
        }
      },
      chunkSizeWarningLimit: 1000,
    },
    define: {
      // This maps the process.env variables in your code to the actual values
      // injected by DigitalOcean at build time.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'process.env.SUPABASE_KEY': JSON.stringify(env.SUPABASE_KEY),
      // Fallback for any other process.env usage to avoid crashes
      'process.env': {}
    },
  };
});