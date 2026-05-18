import * as cdk from 'aws-cdk-lib/core';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { ImportLambdaConstruct } from '../constructs/import/import-lambda.construct';
import { IQueue } from 'aws-cdk-lib/aws-sqs';

export interface ImportServiceStackProps extends cdk.StackProps {
  readonly allowedOrigin: string;
  readonly s3BucketName: string;
  readonly s3BucketUploadedFolder: string;
  readonly catalogItemsQueue: IQueue;
  readonly basicAuthorizerLambda: lambda.IFunction;
}

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ImportServiceStackProps) {
    super(scope, id, props);

    const importApi = new apigateway.RestApi(this, 'Import API Gateway', {
      restApiName: 'Import API Gateway',
      description: 'This Import API Gateway serves the Lambda functions.',
      defaultCorsPreflightOptions: {
        allowOrigins: [props.allowedOrigin],
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    const apiGatewayAuthorizerInvokeRole = new iam.Role(this, 'ApiGatewayAuthorizerInvokeRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });
    props.basicAuthorizerLambda.grantInvoke(apiGatewayAuthorizerInvokeRole);

    const basicAuthorizer = new apigateway.TokenAuthorizer(this, 'BasicAuthorizer', {
      handler: props.basicAuthorizerLambda,
      assumeRole: apiGatewayAuthorizerInvokeRole,
      identitySource: 'method.request.header.Authorization',
      authorizerName: 'BasicAuthorizer',
      resultsCacheTtl: cdk.Duration.minutes(0),
    });

    new ImportLambdaConstruct(this, 'ImportLambdaConstruct', {
      allowedOrigin: props.allowedOrigin,
      s3BucketName: props.s3BucketName,
      s3BucketUploadedFolder: props.s3BucketUploadedFolder,
      catalogItemsQueue: props.catalogItemsQueue,
      importApi,
      basicAuthorizer,
    });
  }
}
