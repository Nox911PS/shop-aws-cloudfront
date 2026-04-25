import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';

import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { ImportProductFileLambda } from './lambdas';

import { ImportServiceStackProps } from '../../stacks/import-service-stack';
import { ImportProductFileResource } from './resources';
import { ParseProductFileLambda } from './lambdas/parse-product-file-lambda';

export class ImportLambdaConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ImportServiceStackProps) {
    super(scope, id);

    const api = new apigateway.RestApi(this, 'Import API Gateway', {
      restApiName: 'Import API Gateway',
      description: 'This Import API Gateway serves the Lambda functions.',
      defaultCorsPreflightOptions: {
        allowOrigins: [props.allowedOrigin],
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Import :: Bucket
    const importBucket = new s3.Bucket(this, props.s3BucketName, {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          allowedOrigins: [props.allowedOrigin],
          allowedHeaders: ['Content-Type', 'Authorization'],
        },
      ],
    });

    // Import :: Lambdas
    const importProductFileLambda = new ImportProductFileLambda(this, 'ImportProductFileLambda', {
      allowedOrigin: props.allowedOrigin,
      s3BucketName: props.s3BucketName,
    });
    importBucket.grantRead(importProductFileLambda);

    const parseProductFileLambda = new ParseProductFileLambda(this, 'ParseProductFileLambda', {
      allowedOrigin: props.allowedOrigin,
      s3BucketName: props.s3BucketName,
      s3BucketUploadedFolder: props.s3BucketUploadedFolder,
    });
    importBucket.grantReadWrite(parseProductFileLambda);
    importBucket.grantDelete(parseProductFileLambda);
    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(parseProductFileLambda),
      { prefix: props.s3BucketUploadedFolder },
    );

    // Import :: Base Resource
    const importBaseResource = api.root.addResource('import');

    // Import :: Resources
    new ImportProductFileResource(this, 'ImportProductFileResource', {
      resource: importBaseResource,
      handler: importProductFileLambda,
    });
  }
}
