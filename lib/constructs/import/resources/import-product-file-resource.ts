import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { ImportProductFileResourceProps } from './model';

export class ImportProductFileResource extends Construct {
  constructor(scope: Construct, id: string, props: ImportProductFileResourceProps) {
    super(scope, id);

    props.resource.addMethod('GET', new apigateway.LambdaIntegration(props.handler));
  }
}
