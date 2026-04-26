import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { ProductsLambdaConstruct } from '../constructs';

export interface AwsStackProps extends cdk.StackProps {
  readonly allowedOrigin: string;
}

export class AwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AwsStackProps) {
    super(scope, id, props);

    new ProductsLambdaConstruct(this, 'ProductsLambdaConstruct', props);
  }
}
