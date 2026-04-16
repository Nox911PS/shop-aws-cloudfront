import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { ProductsLambdaConstruct } from '../constructs';

export class AwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new ProductsLambdaConstruct(this, 'ProductsLambdaConstruct');
  }
}
