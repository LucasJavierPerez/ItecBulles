import tailwindcss from '@tailwindcss/vite';

// SPA mode: the experience is a client-only WebGL canvas, so server rendering adds
// nothing. `nuxt generate` still emits a static site (index.html + 200.html fallback).
export default defineNuxtConfig({
  compatibilityDate: '2026-10-16',
  ssr: false,
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'iTec Río Cuarto · Ingreso 2027',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Conocé las propuestas educativas del Instituto Tecnológico Río Cuarto.',
        },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,700&display=swap',
        },
      ],
    },
  },
});
