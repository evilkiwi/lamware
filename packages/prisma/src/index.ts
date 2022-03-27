import type { PrismaClientOptions } from 'prisma/prisma-client/runtime';
import type { Middleware } from '@lamware/core';
import type { Handler } from 'aws-lambda';

export const prisma = <C extends new (...args: any) => any>(client: C, options?: PrismaClientOptions): Middleware<Handler, { prisma: InstanceType<C> }> => ({
    id: 'prisma',
    pure: true,
    init: async () => ({
        prisma: new client(options),
    }),
});
