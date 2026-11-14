import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// host: true  -> bisa dibuka dari HP lewat Wi-Fi yang sama (http://IP-LAPTOP:5173)
// proxy /api  -> diteruskan ke backend Python di port 8000
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: { '/api': 'http://localhost:8000' },
  },
});
