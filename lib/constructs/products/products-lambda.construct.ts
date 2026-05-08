import { Construct } from 'constructs';

import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import {
  CatalogBatchProcessLambda,
  CreateProductLambda,
  GetProductByIdLambda,
  GetProductListLambda,
} from './lambdas';
import { ProductByIdResource, ProductListResource, CreateProductResource } from './resources';
import { ProductServiceStackProps } from '../../stacks/product-service-stack';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { CatalogItemsSqsConstruct } from './sqs';
import { CreateProductTopicConstruct } from './sns';

export class ProductsLambdaConstruct extends Construct {
  public readonly catalogItemsQueue: sqs.IQueue;

  constructor(scope: Construct, id: string, props: ProductServiceStackProps) {
    super(scope, id);

    // SQS
    const catalogItemsQueueConstruct = new CatalogItemsSqsConstruct(
      this,
      'CatalogItemsQueueConstruct',
    );
    this.catalogItemsQueue = catalogItemsQueueConstruct.queue;

    // SNS
    const notificationService = new CreateProductTopicConstruct(
      this,
      'CreateProductTopicConstruct',
      {
        notificationUserEmail: props.notificationUserEmail,
      },
    );

    // API Gateway
    const api = new apigateway.RestApi(this, 'Product API Gateway', {
      restApiName: 'Product API Gateway',
      description: 'This Product API Gateway serves the Lambda functions.',
      defaultCorsPreflightOptions: {
        allowOrigins: [props.allowedOrigin],
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Products :: Database tables

    const productsTable = dynamodb.Table.fromTableName(
      scope,
      'ProductsTable',
      props.productsDatabaseName,
    );
    const stocksTable = dynamodb.Table.fromTableName(
      scope,
      'StocksTable',
      props.stocksDatabaseName,
    );

    // Products :: Lambdas
    const getProductListLambda = new GetProductListLambda(this, 'getProductsList', {
      allowedOrigin: props.allowedOrigin,
      productsDatabaseName: productsTable.tableName,
      stocksDatabaseName: stocksTable.tableName,
    });
    productsTable.grantReadData(getProductListLambda);
    stocksTable.grantReadData(getProductListLambda);

    const getProductByIdLambda = new GetProductByIdLambda(this, 'getProductsById', {
      allowedOrigin: props.allowedOrigin,
      productsDatabaseName: productsTable.tableName,
      stocksDatabaseName: stocksTable.tableName,
    });
    productsTable.grantReadData(getProductByIdLambda);
    stocksTable.grantReadData(getProductByIdLambda);

    const createProductLambda = new CreateProductLambda(this, 'createProductLambda', {
      allowedOrigin: props.allowedOrigin,
      productsDatabaseName: productsTable.tableName,
      stocksDatabaseName: stocksTable.tableName,
    });
    productsTable.grantWriteData(createProductLambda);
    stocksTable.grantWriteData(createProductLambda);

    const catalogBatchProcess = new CatalogBatchProcessLambda(this, 'CatalogBatchProcess', {
      allowedOrigin: props.allowedOrigin,
      productsDatabaseName: productsTable.tableName,
      stocksDatabaseName: stocksTable.tableName,
      createProductTopicArn: notificationService.topic.topicArn,
    });
    productsTable.grantWriteData(catalogBatchProcess);
    stocksTable.grantWriteData(catalogBatchProcess);
    catalogBatchProcess.addEventSource(
      new lambdaEventSources.SqsEventSource(this.catalogItemsQueue, {
        batchSize: 5,
      }),
    );
    notificationService.topic.grantPublish(catalogBatchProcess);

    // Products :: Base Resource
    const productsBaseResource = api.root.addResource('products');

    // Products :: Resources
    new ProductListResource(this, 'ProductListResource', {
      resource: productsBaseResource,
      handler: getProductListLambda,
    });
    new ProductByIdResource(this, 'ProductByIdResource', {
      resource: productsBaseResource,
      handler: getProductByIdLambda,
    });
    new CreateProductResource(this, 'CreateProductResource', {
      resource: productsBaseResource,
      handler: createProductLambda,
    });
  }
}
