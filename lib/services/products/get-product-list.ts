import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { productsMockData } from './mock-data';

export async function getProductList(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('getProductList Incoming Request:', JSON.stringify({
    requestId: event.requestContext.requestId,
    method: event.httpMethod,
    path: event.path,
    origin: event.headers['Origin'] || event.headers['origin'],
    queryParams: event.queryStringParameters,
  }));

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
    body: JSON.stringify(productsMockData),
  };
}
