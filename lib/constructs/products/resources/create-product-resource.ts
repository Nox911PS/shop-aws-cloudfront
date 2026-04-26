import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { ProductsResourceProps } from './model';

export class CreateProductResource extends Construct {
  constructor(scope: Construct, id: string, props: ProductsResourceProps) {
    super(scope, id);

    props.resource.addMethod('POST', new apigateway.LambdaIntegration(props.handler));
  }
}
