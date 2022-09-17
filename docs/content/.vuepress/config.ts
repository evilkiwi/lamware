import { defaultTheme, defineUserConfig } from 'vuepress';

export default defineUserConfig({
    base: '/lamware/',
    lang: 'en-US',
    title: 'Lamware',
    description: 'Middleware Design Pattern Framework for AWS Lambda',
    locales: {
        '/': {
            lang: 'en-US',
        },
    },
    theme: defaultTheme({
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
    }),
});
