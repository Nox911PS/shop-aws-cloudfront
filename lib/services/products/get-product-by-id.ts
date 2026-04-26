import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetCommand } from '@aws-sdk/lib-dynamodb'; // Импорт вашего массива моков

export async function getProductById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Incoming request:', JSON.stringify(event));

  const dynamoDBClient = new DynamoDBClient({ region: process.env.CDK_REGION });
  const productsTableName = process.env.PRODUCTS_TABLE_NAME;
  const stocksTableName = process.env.STOCKS_TABLE_NAME;

  try {
    const productId = event.pathParameters?.productId;

    if (!productId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Product ID is required' }),
      };
    }

    const [productResponse, stockResponse] = await Promise.all([
      dynamoDBClient.send(
        new GetCommand({
          TableName: productsTableName,
          Key: { id: productId },
        }),
      ),
      dynamoDBClient.send(
        new GetCommand({
          TableName: stocksTableName,
          Key: { product_id: productId },
        }),
      ),
    ]);

    const productItem = productResponse.Item;
    const stockItem = stockResponse.Item;

    if (!productItem) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN,
        },
        body: JSON.stringify({ message: `Product with ID ${productId} not found` }),
      };
    }

    const product = {
      ...productItem,
      count: stockItem ? stockItem?.count : 0,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: JSON.stringify(product),
    };
  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
}
