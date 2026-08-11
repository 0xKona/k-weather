import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

export interface FrontendStackProps extends cdk.StackProps {
  /** Base URL of the HTTP API, set as NEXT_PUBLIC_API_URL on the Amplify branch. */
  apiUrl: string;
}

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    void props.apiUrl;
  }
}
