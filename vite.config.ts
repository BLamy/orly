import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from the domain root everywhere (Cloudflare Workers prod + PR previews,
// and locally), so all asset paths resolve relative to BASE_URL = '/'.
export default defineConfig({
  base: '/',
  plugins: [react()],
});
