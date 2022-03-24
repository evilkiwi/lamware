#!/usr/bin/env node
import 'source-map-support/register';

import { App } from 'aws-cdk-lib';
import { resolve } from 'path';
import { LamwareStack } from './src/stacks';

const root = new App();

const props = {
    root: resolve(__dirname, '..'),
    stage: 'production',
    env: {
        account: '590074468791',
        region: 'us-east-2',
    },
};

const lamware = new LamwareStack(root, 'tnotifier-lamware-example', props);

root.synth();
