export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  devtools: { enabled: true },

  future: { compatibilityVersion: 4 },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-01-15',

  runtimeConfig: {
    claudeDir: process.env.CLAUDE_DIR || '',
    claudeCliPath: process.env.CLAUDE_CLI_PATH || '',
  },

  nitro: {
    experimental: {
      websocket: true,
    },
  },

  app: {
    head: {
      title: 'Claude Code Agent Manager',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'description', content: 'Visual manager for Claude Code agents, commands, skills, and plugins. Configure AI assistants without touching the terminal.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#1e1e1e' },
        { property: 'og:title', content: 'Agent Manager — Claude Code' },
        { property: 'og:description', content: 'Visual manager for Claude Code agents, commands, skills, and plugins. Configure AI assistants without touching the terminal.' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800;0,14..32,900;1,14..32,400&family=Fira+Code:wght@300;400;500;600&display=swap' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  components: [
    { path: '~/components/chat', pathPrefix: false },
    { path: '~/components/studio', pathPrefix: false },
    { path: '~/components/cli', pathPrefix: false },
    { path: '~/components' },
  ],

  colorMode: {
    preference: 'dark',
  },

  routeRules: {
    '/templates': { redirect: '/explore' },
  },
})
