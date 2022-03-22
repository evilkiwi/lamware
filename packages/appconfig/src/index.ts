import type { Middleware } from '@tnotifier/lamware';
import type { Handler } from 'aws-lambda';
import http from 'http';

export interface Options {
    url?: string;
    app: string;
    env: string;
    config: string;
}

export const appconfig = <Config = any>({ url, app, env, config }: Options): Middleware<Handler, { config: Config }> => {
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
            payload.state.config = appconfigData;

            return payload;
        },
    };
};
