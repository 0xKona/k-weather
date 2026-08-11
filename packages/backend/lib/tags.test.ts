import * as cdk from 'aws-cdk-lib/core';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { applyTags } from './tags';

function makeTemplate(stage?: string) {
  const app = new cdk.App(stage ? { context: { stage } } : undefined);
  applyTags(app);
  const stack = new cdk.Stack(app, 'TestStack', {
    env: { account: '123456789012', region: 'eu-west-2' },
  });
  new s3.Bucket(stack, 'B');
  return Template.fromStack(stack);
}

function expectTags(stage: string) {
  const template = makeTemplate(stage);
  template.hasResourceProperties('AWS::S3::Bucket', {
    Tags: Match.arrayWith([
      Match.objectLike({ Key: 'Application', Value: 'kweather' }),
      Match.objectLike({ Key: 'ManagedBy', Value: 'CDK' }),
      Match.objectLike({ Key: 'Stage', Value: stage }),
    ]),
  });

  const resources = template.findResources('AWS::S3::Bucket');
  const tags = Object.values(resources)[0].Properties.Tags;
  expect(tags).toHaveLength(3);
}

describe('applyTags', () => {
  it('tags resources with Application, ManagedBy, and Stage for the test stage', () => {
    expectTags('test');
  });

  it('defaults to the test stage when no context is provided', () => {
    expectTags('test');
  });

  it('uses the prod stage when context specifies prod', () => {
    expectTags('prod');
  });
});
