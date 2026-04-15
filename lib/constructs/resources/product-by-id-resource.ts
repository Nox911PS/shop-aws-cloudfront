import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface ProductsByIdResourceProps {
  api: apigateway.RestApi;
  handler: lambda.IFunction;
}

export class ProductByIdResource extends Construct {
  constructor(scope: Construct, id: string, props: ProductsByIdResourceProps) {
    super(scope, id);

    const products = props.api.root.addResource('products/{productId}');

    products.addMethod('GET', new apigateway.LambdaIntegration(props.handler));
  }
}
