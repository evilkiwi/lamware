import type { Handler } from 'aws-lambda';
import type { Middleware } from '@/middleware';

export interface Options {

}

export interface Instance<H extends Handler> {
    use: (middleware: Middleware<H>) => Instance<H>;
    execute: (handler: H) => {
        clear: () => void;
        handler: Handler;
    };
}
