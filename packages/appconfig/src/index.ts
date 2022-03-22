import type { Middleware } from '@tnotifier/lamware';
import http from 'http';

export interface Options {
    url?: string;
    app: string;
    env: string;
    config: string;
}

declare module 'aws-lambda' {
    interface Context {
        config: any;
    }
}

export const appconfig = ({ url, app, env, config }: Options): Middleware => {
    let appconfigData: any = {};

    return {
        id: 'appconfig',
        pure: true,
        init: async () => {
            const res = await new Promise<http.IncomingMessage>(resolve => {
                http.get(`http://${url ?? 'localhost:2772'}/applications/${app}/environments/${env}/configurations/${config}`, message => resolve(message));
            });
            const data = await new Promise<string>((resolve, reject) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('error', err => reject(err));
                res.on('end', () => resolve(data));
            });
            appconfigData = JSON.parse(data);
        },
        before: async (payload) => {
            payload.context.config = appconfigData;

            return payload;
        },
    };
};
