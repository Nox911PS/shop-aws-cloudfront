import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { ProductsLambdaConstruct } from '../constructs';

export interface ProductServiceStackProps extends cdk.StackProps {
  readonly allowedOrigin: string;
  readonly productsDatabaseName: string;
  readonly stocksDatabaseName: string;
}

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ProductServiceStackProps) {
    super(scope, id, props);

    new ProductsLambdaConstruct(this, 'ProductLambdaConstruct', props);
  }
}
