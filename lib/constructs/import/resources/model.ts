import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export interface ImportProductFileResourceProps {
  resource: apigateway.IResource;
  handler: lambda.IFunction;
}
