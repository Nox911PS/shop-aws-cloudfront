import * as path from 'path';
import * as lambda_nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';

export class GetProductListLambda extends lambda_nodejs.NodejsFunction {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../services/products/get-product-list.ts'),
      handler: 'getProductList',
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });
  }
}
