import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 } from 'uuid';

export async function createProduct(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Incoming request:', JSON.stringify(event));

  const dynamoDBClient = new DynamoDBClient({ region: process.env.CDK_REGION });
  const productsTableName = process.env.PRODUCTS_TABLE_NAME;
  const stocksTableName = process.env.STOCKS_TABLE_NAME;

  try {
    const body = event.body ? JSON.parse(event.body) : null;

    if (!body || !body.title || !body.price || typeof body.count !== 'number') {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid product data. Title, price and count are required.',
        }),
      };
    }

    const { title, description, price, count } = body;
    const id = v4();

    await dynamoDBClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: productsTableName,
              Item: { id, title, description, price },
            },
          },
          {
            Put: {
              TableName: stocksTableName,
              Item: { product_id: id, count },
            },
          },
        ],
      }),
    );

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: JSON.stringify({ id, title, description, price, count }),
    };
  } catch (error: any) {
    console.error('Error creating product:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
}
