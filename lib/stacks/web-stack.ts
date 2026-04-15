import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { DeploymentConstruct } from '../constructs/deployment.construct';
import { LambdaConstruct } from '../constructs/lambda.construct';

export class WebStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // new DeploymentConstruct(this, 'DeploymentConstruct');
    new LambdaConstruct(this, 'LambdaConstruct');
  }
}
