import type { DefaultThemeOptions, ViteBundlerOptions } from 'vuepress-vite';
import { defineUserConfig } from 'vuepress-vite';

export default defineUserConfig<DefaultThemeOptions, ViteBundlerOptions>({
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
        home: '/',
        logo: 'https://vuejs.org/images/logo.png',
        repo: 'evilkiwi/lamware',
        docsDir: 'docs/content',
        docsBranch: 'master',
        locales: {
            '/': {
                selectLanguageName: 'English',
            },
        },
        sidebar: [{
            text: 'Introduction',
            children: [{
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
    },
});
