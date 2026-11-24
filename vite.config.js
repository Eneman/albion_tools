import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' makes all asset URLs relative, so the build works both on a
// GitHub Pages project site (https://<user>.github.io/<repo>/) and on a
// user/organization site served from the domain root.
export default defineConfig({
  base: './',
  plugins: [react()],
})
