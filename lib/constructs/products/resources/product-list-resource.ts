import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface ProductsListResourceProps {
  resource: apigateway.IResource;
  handler: lambda.IFunction;
}

export class ProductListResource extends Construct {
  constructor(scope: Construct, id: string, props: ProductsListResourceProps) {
    super(scope, id);

    props.resource.addMethod('GET', new apigateway.LambdaIntegration(props.handler));
  }
}
