import type { FunctionProps as Base } from 'aws-cdk-lib/aws-lambda';

export interface FunctionProps extends Omit<Base, 'code'> {
    root: string;
    projectRoot: string;
    external?: string[];
    nodeVersion?: number;
    hash: string;
}
