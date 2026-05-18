import * as path from 'path';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';

export interface BasicAuthorizerLambdaProps {
  readonly authorizationCredentials: { [key: string]: string };
}

export class BasicAuthorizerLambda extends lambda.Function {
  constructor(scope: Construct, id: string, props: BasicAuthorizerLambdaProps) {
    const environment: { [key: string]: string } = {};

    for (const [username, password] of Object.entries(props.authorizationCredentials)) {
      environment[username] = password;
    }

    super(scope, id, {
      runtime: lambda.Runtime.NODEJS_24_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../dist')),
      handler: 'basic-authorizer.basicAuthorizer',
      memorySize: 256,
      timeout: cdk.Duration.seconds(5),
      environment,
    });
  }
}
