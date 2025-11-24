// vite.config.js (Place this in your project's root folder)

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // ➡️ This line tells Vite to treat .PNG files as assets 
  // instead of trying to parse them as JavaScript source code.
  assetsInclude: ['**/*.PNG', '**/*.png'], 
});