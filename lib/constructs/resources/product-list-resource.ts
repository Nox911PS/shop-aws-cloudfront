import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface ProductsListResourceProps {
  api: apigateway.RestApi;
  handler: lambda.IFunction;
}

export class ProductListResource extends Construct {
  constructor(scope: Construct, id: string, props: ProductsListResourceProps) {
    super(scope, id);

    const products = props.api.root.addResource('products');

    products.addMethod('GET', new apigateway.LambdaIntegration(props.handler));
  }
}
