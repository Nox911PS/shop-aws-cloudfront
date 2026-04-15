import { Construct } from 'constructs';

import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { GetProductByIdLambda, GetProductListLambda } from './lambdas';
import { ProductByIdResource, ProductListResource } from './resources';

export class LambdaConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const api = new apigateway.RestApi(this, 'Product API Gateway', {
      restApiName: 'Product API Gateway',
      description: 'This Product API Gateway serves the Lambda functions.',
    });

    // Lambdas
    const getProductListLambda = new GetProductListLambda(scope, id);
    const getProductByIdLambda = new GetProductByIdLambda(scope, id);

    // Resources
    new ProductListResource(scope, id, { api, handler: getProductListLambda });
    new ProductByIdResource(scope, id, { api, handler: getProductByIdLambda });
  }
}
