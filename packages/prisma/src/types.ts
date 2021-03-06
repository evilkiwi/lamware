export type PrismaClientStub = new (...args: any) => any;

export type SetupFunction<C extends PrismaClientStub> = () => InstanceType<C>|Promise<InstanceType<C>>;
