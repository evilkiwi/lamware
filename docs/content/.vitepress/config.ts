import { defineConfig } from 'vitepress';

export default defineConfig({
  base: '/lamware/',
  lang: 'en-US',
  title: 'Lamware',
  description: 'Middleware Design Pattern Framework for AWS Lambda',
  locales: {
    '/': {
      lang: 'en-US',
    },
  },
  themeConfig: {
    sidebar: [{
      text: 'Introduction',
      items: [{
        text: 'Getting Started',
        link: '/getting-started.html',
      }, {
        text: 'Usage',
        link: '/usage.html',
      }, {
        text: 'Middleware',
        link: '/middleware.html',
      }],
    }],
    footer: {
      message: 'GPL-3.0 Licensed',
      copyright: 'Copyright © 2022 Evil Kiwi Limited',
    },
  },
});
