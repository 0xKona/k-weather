import * as cdk from "aws-cdk-lib";
import { APPLICATION_NAME } from "./constants";

/**
 * Generates a standardized resource name.
 *
 * Format: <account>-kweather-<resource-name>-<stage>
 *
 * Use for any resource property that accepts a human-readable name or
 * description: S3 `bucketName`, CloudFront `comment`, Lambda `description`,
 * DynamoDB `tableName` (where stable names are needed for IAM), SSM parameter
 * paths, etc.
 */
export function resourceName(stack: cdk.Stack, name: string): string {
  const account = stack.account;
  const stage = stack.node.tryGetContext("stage") ?? "test";
  return `${account}-${APPLICATION_NAME}-${name}-${stage}`;
}
