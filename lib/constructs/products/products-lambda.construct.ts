import { Construct } from 'constructs';

import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { GetProductByIdLambda, GetProductListLambda } from './lambdas';
import { ProductByIdResource, ProductListResource } from './resources';

export class ProductsLambdaConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const api = new apigateway.RestApi(this, 'Product API Gateway', {
      restApiName: 'Product API Gateway',
      description: 'This Product API Gateway serves the Lambda functions.',
    });

    // Products :: Base Resource
    const productsBaseResource = api.root.addResource('products');

    // Products :: Lambdas
    const getProductListLambda = new GetProductListLambda(this, 'getProductsList');
    const getProductByIdLambda = new GetProductByIdLambda(this, 'getProductsById');

    // Products :: Resources
    new ProductListResource(this, 'ProductListResource', {
      resource: productsBaseResource,
      handler: getProductListLambda,
    });
    new ProductByIdResource(this, 'ProductByIdResource', {
      resource: productsBaseResource,
      handler: getProductByIdLambda,
    });
  }
}
