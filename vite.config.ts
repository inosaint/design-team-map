import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Vite's dev server (unlike a real static host, or `vite preview`) doesn't resolve
// `/foo` or `/foo/` to `public/foo/index.html` - it only serves an exact file path.
// This rewrites requests for our static SEO landing pages so dev behavior matches prod.
function seoLandingPagesDevMiddleware(): Plugin {
  return {
    name: 'seo-landing-pages-dev-middleware',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url?.split('?')[0]
        const match = url && /^\/([a-z]+-org-chart)\/?$/.exec(url)
        if (match) {
          req.url = `/${match[1]}/index.html`
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  appType: 'mpa',
  plugins: [react(), seoLandingPagesDevMiddleware()],
  optimizeDeps: {
    include: ['posthog-js'],
  },
})
