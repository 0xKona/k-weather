import * as cdk from "aws-cdk-lib";
import { APPLICATION_NAME } from "./constants";

export function applyTags(scope: cdk.App): void {
  const stage = scope.node.tryGetContext("stage") ?? "test";
  cdk.Tags.of(scope).add("Application", APPLICATION_NAME);
  cdk.Tags.of(scope).add("ManagedBy", "CDK");
  cdk.Tags.of(scope).add("Stage", stage);
}
