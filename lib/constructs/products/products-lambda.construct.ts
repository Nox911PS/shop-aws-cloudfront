import { Construct } from 'constructs';

import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { CreateProductLambda, GetProductByIdLambda, GetProductListLambda } from './lambdas';
import { ProductByIdResource, ProductListResource, CreateProductResource } from './resources';
import { ProductServiceStackProps } from '../../stacks/product-service-stack';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class ProductsLambdaConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ProductServiceStackProps) {
    super(scope, id);

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
