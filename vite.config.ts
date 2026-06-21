import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// On GitHub Pages the site is served from /orly/; locally from /.
export default defineConfig({
  base: process.env.PAGES ? '/orly/' : '/',
  plugins: [react()],
});
