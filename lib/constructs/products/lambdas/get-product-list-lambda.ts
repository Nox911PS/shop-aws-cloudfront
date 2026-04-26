import * as path from 'path';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';

export class GetProductListLambda extends lambda.Function {
  constructor(scope: Construct, id: string, allowedOrigin: string) {
    super(scope, id, {
      runtime: lambda.Runtime.NODEJS_24_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../../dist')),
      handler: 'get-product-list.getProductList',
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      environment: {
        ALLOWED_ORIGIN: allowedOrigin,
      },
    });
  }
}
