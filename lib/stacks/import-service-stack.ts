import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { ImportLambdaConstruct } from '../constructs/import/import-lambda.construct';

export interface ImportServiceStackProps extends cdk.StackProps {
  readonly allowedOrigin: string;
  readonly s3BucketName: string;
  readonly s3BucketUploadedFolder: string;
}

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ImportServiceStackProps) {
    super(scope, id, props);

    new ImportLambdaConstruct(this, 'ImportLambdaConstruct', props);
  }
}
