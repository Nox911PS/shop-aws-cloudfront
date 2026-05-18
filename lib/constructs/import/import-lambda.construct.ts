import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';

import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { ImportProductFileLambda } from './lambdas';

import { ImportProductFileResource } from './resources';
import { ParseProductFileLambda } from './lambdas/parse-product-file-lambda';
import { IQueue } from 'aws-cdk-lib/aws-sqs';

export interface ImportLambdaConstructProps {
  readonly allowedOrigin: string;
  readonly s3BucketName: string;
  readonly s3BucketUploadedFolder: string;
  readonly catalogItemsQueue: IQueue;
  readonly importApi: apigateway.IRestApi;
  readonly basicAuthorizer: apigateway.IAuthorizer;
}

export class ImportLambdaConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ImportLambdaConstructProps) {
    super(scope, id);

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
      s3BucketName: importBucket.bucketName,
      s3BucketUploadedFolder: props.s3BucketUploadedFolder,
    });
    importBucket.grantReadWrite(importProductFileLambda);

    const parseProductFileLambda = new ParseProductFileLambda(this, 'ParseProductFileLambda', {
      allowedOrigin: props.allowedOrigin,
      s3BucketName: importBucket.bucketName,
      s3BucketUploadedFolder: props.s3BucketUploadedFolder,
      catalog_items_queue_url: props.catalogItemsQueue.queueUrl,
    });
    props.catalogItemsQueue.grantSendMessages(parseProductFileLambda);
    importBucket.grantReadWrite(parseProductFileLambda);
    importBucket.grantDelete(parseProductFileLambda);
    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(parseProductFileLambda),
      { prefix: props.s3BucketUploadedFolder },
    );

    // Import :: Base Resource
    const importBaseResource = props.importApi.root.addResource('import');

    // Import :: Resources
    new ImportProductFileResource(this, 'ImportProductFileResource', {
      resource: importBaseResource,
      handler: importProductFileLambda,
      authorizer: props.basicAuthorizer,
    });
  }
}
