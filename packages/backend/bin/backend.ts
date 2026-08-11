#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { CoreStack } from '../lib/stacks/core-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';
import { applyTags } from '../lib/tags';
import { APPLICATION_NAME } from '../lib/constants';

const app = new cdk.App();

applyTags(app);

const stage = app.node.tryGetContext('stage') ?? 'test';

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'eu-west-2',
};

const coreStack = new CoreStack(app, `${APPLICATION_NAME}-core-${stage}`, { env });

const frontendStack = new FrontendStack(app, `${APPLICATION_NAME}-frontend-${stage}`, {
  env,
  apiUrl: coreStack.apiUrl,
});

frontendStack.addStackDependency(coreStack);
