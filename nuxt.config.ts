// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [],
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },
  nitro: {
    preset: 'cloudflare-pages'
  },
  runtimeConfig: {
    apiSecret: process.env.API_SECRET || 'default-secret-change-me',
    public: {
      appName: 'Laravel Schedule Monitor'
    }
  },
  app: {
    head: {
      title: 'Laravel Schedule Monitor',
      meta: [
        { name: 'description', content: 'Monitor your Laravel scheduled jobs' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  }
})