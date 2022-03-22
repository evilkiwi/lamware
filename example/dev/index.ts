import { execute } from 'lambda-local';
import express from 'express';
import { join } from 'path';
import cors from 'cors';
import apiGateway from '../../build/events/api-gateway';

const http = express();

http.use(express.urlencoded({ extended: true }));
http.use(express.json());
http.use(express.text());
http.use(cors());

http.all('/', async (req, res) => {
    const event = {...apiGateway};
    event.headers = req.headers;
    event.requestContext.httpMethod = req.method;
    event.httpMethod = req.method;
    event.queryStringParameters = req.query;
    event.body = JSON.stringify(req.body ?? {});

    const result: any = await execute({
        region: 'us-east-2',
        lambdaPath: join(__dirname, '..', 'build', 'index.js'),
        lambdaHandler: 'handler',
        timeoutMs: 30000,
        // verboseLevel: 0,
        environment: {
            STAGE: 'development',
        },
        event,
    });

    res.status(result.statusCode).set(result.headers).end(result.body);
});

express().use(http).listen(8080, '0.0.0.0', () => {
    console.log('[http] listening');
});
