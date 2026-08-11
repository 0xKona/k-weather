import * as cdk from 'aws-cdk-lib/core';
import { resourceName } from './naming';

function makeStack(stage?: string): cdk.Stack {
  const app = new cdk.App(stage ? { context: { stage } } : undefined);
  return new cdk.Stack(app, 'TestStack', {
    env: { account: '123456789012', region: 'eu-west-2' },
  });
}

describe('resourceName', () => {
  it('returns <account>-kweather-<name>-<stage> for the test stage', () => {
    expect(resourceName(makeStack('test'), 'api')).toBe('123456789012-kweather-api-test');
  });

  it('defaults to the test stage when no context is provided', () => {
    expect(resourceName(makeStack(), 'api')).toBe('123456789012-kweather-api-test');
  });

  it('uses the prod stage when context specifies prod', () => {
    expect(resourceName(makeStack('prod'), 'api')).toBe('123456789012-kweather-api-prod');
  });

  it('preserves an arbitrary resource name', () => {
    expect(resourceName(makeStack('test'), 'import-sqlite')).toBe(
      '123456789012-kweather-import-sqlite-test'
    );
  });

  it('always matches the documented name format', () => {
    expect(resourceName(makeStack('prod'), 'api')).toMatch(
      /^\d{12}-kweather-[a-z0-9-]+-(test|prod)$/
    );
  });
});
