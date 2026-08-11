import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

export class CoreStack extends cdk.Stack {
  /** Base URL of the HTTP API, populated in step 2 (api.ts construct). */
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.apiUrl = '';
  }
}
