import * as cdk from 'aws-cdk-lib/core';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { ProductsLambdaConstruct } from '../constructs';

export interface ProductServiceStackProps extends cdk.StackProps {
  readonly allowedOrigin: string;
  readonly productsDatabaseName: string;
  readonly stocksDatabaseName: string;
  readonly notificationUserEmail: string;
}

export class ProductServiceStack extends cdk.Stack {
  public readonly catalogItemsQueue: sqs.IQueue;

  constructor(scope: Construct, id: string, props: ProductServiceStackProps) {
    super(scope, id, props);

    const productLambdas = new ProductsLambdaConstruct(this, 'ProductLambdaConstruct', props);

    this.catalogItemsQueue = productLambdas.catalogItemsQueue;
  }
}
