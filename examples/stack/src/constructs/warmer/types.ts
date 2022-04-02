import type { LambdaFunction } from '../function';

export interface WarmerProps {
    concurrency: number;
    function: LambdaFunction;
}
