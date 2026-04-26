import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { IProduct, IProductsTableItem, IStocksTableItem } from './product.model';

export async function getProductList(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Incoming request:', JSON.stringify(event));

  const dynamoDBClient = new DynamoDBClient({ region: process.env.CDK_REGION });
  const productsTableName = process.env.PRODUCTS_TABLE_NAME;
  const stocksTableName = process.env.STOCKS_TABLE_NAME;

  try {
    if (!productsTableName || !stocksTableName) {
      throw new Error('Table names are not defined in environment variables');
    }

    const [productsResponse, stocksResponse] = await Promise.all([
      dynamoDBClient.send(new ScanCommand({ TableName: productsTableName })),
      dynamoDBClient.send(new ScanCommand({ TableName: stocksTableName })),
    ]);

    const products = (productsResponse.Items as IProductsTableItem[]) || [];
    const stocks = (stocksResponse.Items as IStocksTableItem[]) || [];

    const joinedProducts: IProduct[] = products.map((product) => {
      const stock = stocks.find((s) => s.product_id === product.id);
      return {
        ...product,
        count: stock ? stock.count : 0,
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(joinedProducts),
    };
  } catch (error: any) {
    console.error('Error in getProductsList:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
}
