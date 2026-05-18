import * as cdk from 'aws-cdk-lib/core';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { BasicAuthorizerLambda } from '../constructs/authorization';

export interface AuthorizationServiceStackProps extends cdk.StackProps {
  readonly authorizationCredentials: { [key: string]: string };
}

export class AuthorizationServiceStack extends cdk.Stack {
  public readonly basicAuthorizerLambda: lambda.IFunction;

  constructor(scope: Construct, id: string, props: AuthorizationServiceStackProps) {
    super(scope, id, props);

    if (Object.keys(props.authorizationCredentials).length === 0) {
      throw new Error(
        'Authorization credentials are required. Provide at least one AUTHORIZATION_USERNAME_<github_login>=TEST_PASSWORD entry from app config.',
      );
    }

    this.basicAuthorizerLambda = new BasicAuthorizerLambda(this, 'BasicAuthorizerLambda', {
      authorizationCredentials: props.authorizationCredentials,
    });
  }
}
