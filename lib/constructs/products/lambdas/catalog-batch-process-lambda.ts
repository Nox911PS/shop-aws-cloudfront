import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { ProductsLambdaProps } from './model';

export class CatalogBatchProcessLambda extends nodejs.NodejsFunction {
  constructor(scope: Construct, id: string, props: ProductsLambdaProps) {
    super(scope, id, {
      runtime: lambda.Runtime.NODEJS_24_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../../dist')),
      handler: 'catalog-batch-process.catalogBatchProcess',
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      environment: {
        ALLOWED_ORIGIN: props.allowedOrigin,
        PRODUCTS_TABLE_NAME: props.productsDatabaseName,
        STOCKS_TABLE_NAME: props.stocksDatabaseName,
        CREATE_PRODUCT_TOPIC_ARN: props.createProductTopicArn!,
      },
    });
  }
}
