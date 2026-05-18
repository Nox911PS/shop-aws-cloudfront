import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import { BasicAuthorizerLambda } from '../authorization';

export interface AuthorizationConstructProps {
  readonly authorizationCredentials: { [key: string]: string };
}

export class AuthorizationConstruct extends Construct {
  public readonly basicAuthorizer: apigateway.IAuthorizer;

  constructor(scope: Construct, id: string, props: AuthorizationConstructProps) {
    super(scope, id);

    // Create the basic authorizer Lambda
    const authorizerLambda = new BasicAuthorizerLambda(this, 'BasicAuthorizerLambda', {
      authorizationCredentials: props.authorizationCredentials,
    });

    // Create the API Gateway Token Authorizer
    this.basicAuthorizer = new apigateway.TokenAuthorizer(this, 'BasicAuthorizer', {
      handler: authorizerLambda,
      identitySource: 'method.request.header.Authorization',
      authorizerName: 'BasicAuthorizer',
      resultsCacheTtl: cdk.Duration.minutes(0),
    });
  }
}

