import * as path from 'path';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import { ProductsLambdaProps } from './model';

export class GetProductByIdLambda extends lambda.Function {
  constructor(scope: Construct, id: string, props: ProductsLambdaProps) {
    super(scope, id, {
      runtime: lambda.Runtime.NODEJS_24_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../../dist')),
      handler: 'get-product-by-id.getProductById',
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      environment: {
        ALLOWED_ORIGIN: props.allowedOrigin,
        PRODUCTS_TABLE_NAME: props.productsDatabaseName,
        STOCKS_TABLE_NAME: props.stocksDatabaseName,
      },
    });
  }
}
