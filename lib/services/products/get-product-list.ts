import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { productsMockData } from './mock-data';

export async function getProductList(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(productsMockData),
  };
}
