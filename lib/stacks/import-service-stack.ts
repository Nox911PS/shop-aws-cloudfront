import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

export interface ImportServiceStackProps extends cdk.StackProps {
  readonly allowedOrigin: string;
  readonly s3BucketName: string;
}

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ImportServiceStackProps) {
    super(scope, id, props);

    new ImportServiceStack(this, 'ImportServiceStack', props);
  }
}
