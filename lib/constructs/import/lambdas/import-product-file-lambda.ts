import * as path from 'path';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import { ImportProductFileLambdaProps } from './model';

export class ImportProductFileLambda extends lambda.Function {
  constructor(scope: Construct, id: string, props: ImportProductFileLambdaProps) {
    super(scope, id, {
      runtime: lambda.Runtime.NODEJS_24_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../../dist')),
      handler: 'import-product-file.importProductFile',
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      environment: {
        ALLOWED_ORIGIN: props.allowedOrigin,
        S3_BUCKET_NAME: props.s3BucketName,
      },
    });
  }
}
