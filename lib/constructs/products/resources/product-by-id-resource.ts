import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface ProductsByIdResourceProps {
  resource: apigateway.IResource;
  handler: lambda.IFunction;
}

export class ProductByIdResource extends Construct {
  constructor(scope: Construct, id: string, props: ProductsByIdResourceProps) {
    super(scope, id);

    const singleProductResource = props.resource.addResource('{productId}');

    singleProductResource.addMethod('GET', new apigateway.LambdaIntegration(props.handler));
  }
}
