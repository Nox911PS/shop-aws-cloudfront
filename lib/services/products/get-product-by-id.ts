import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { productsMockData } from './mock-data'; // Импорт вашего массива моков

export async function getProductById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log(
    'Incoming Request:',
    JSON.stringify({
      requestId: event.requestContext.requestId,
      path: event.path,
      pathParameters: event.pathParameters,
    }),
  );

  const productId = event.pathParameters?.productId;
  const product = productsMockData.find((p) => p.id === productId);

  if (!product) {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '',
      },
      body: JSON.stringify({ message: `Product with ID ${productId} not found` }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
    body: JSON.stringify(product),
  };
}
