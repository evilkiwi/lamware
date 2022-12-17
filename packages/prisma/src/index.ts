import type { PrismaClientOptions } from 'prisma/prisma-client/runtime';
import type { Middleware } from '@lamware/core';
import type { Handler } from 'aws-lambda';
import type { PrismaClientStub, SetupFunction } from './types';

export const prisma = <C extends PrismaClientStub>(client: C|SetupFunction<C>, options?: PrismaClientOptions): Middleware<Handler, { prisma: InstanceType<C> }> => ({
  id: 'prisma',
  init: async () => {
    if (isClass(client)) {
      return { prisma: new (client as C)(options) };
    }

    const prisma = await (client as SetupFunction<C>)();

    return { prisma };
  },
});

const isClass = (value: unknown) => {
  return typeof value === 'function' && /^class\s/.test(Function.prototype.toString.call(value));
};
