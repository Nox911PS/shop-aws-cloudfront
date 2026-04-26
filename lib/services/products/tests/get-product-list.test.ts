import { APIGatewayProxyEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

import { getProductList } from '../get-product-list';

const dynamoMock = mockClient(DynamoDBClient);

describe('getProductsList', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    dynamoMock.reset();
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      CDK_REGION: 'eu-west-1',
      PRODUCTS_TABLE_NAME: 'products-table',
      STOCKS_TABLE_NAME: 'stocks-table',
      ALLOWED_ORIGIN: 'https://example.com',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should getProductsList be defined', async () => {
    expect(getProductList).toBeDefined();
  });

  it('should return 200 and list of products', async () => {
    const products = [
      {
        id: 'product-1',
        title: 'Product 1',
        description: 'First product',
        price: 10,
      },
      {
        id: 'product-2',
        title: 'Product 2',
        description: 'Second product',
        price: 20,
      },
    ];
    const stocks = [
      { product_id: 'product-1', count: 3 },
      { product_id: 'product-2', count: 0 },
    ];

    dynamoMock
      .on(ScanCommand, { TableName: 'products-table' })
      .resolvesOnce({ Items: products } as never)
      .on(ScanCommand, { TableName: 'stocks-table' })
      .resolvesOnce({ Items: stocks } as never);

    const mockEvent = {} as APIGatewayProxyEvent;
    const response = await getProductList(mockEvent);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://example.com',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    expect(JSON.parse(response.body)).toEqual([
      { ...products[0], count: 3 },
      { ...products[1], count: 0 },
    ]);
    expect(dynamoMock.commandCalls(ScanCommand)).toHaveLength(2);
    expect(dynamoMock.commandCalls(ScanCommand)[0].args[0].input).toEqual({
      TableName: 'products-table',
    });
    expect(dynamoMock.commandCalls(ScanCommand)[1].args[0].input).toEqual({
      TableName: 'stocks-table',
    });
  });

  it('should return 500 when table names are missing', async () => {
    process.env = {
      ...process.env,
      PRODUCTS_TABLE_NAME: undefined,
    } as unknown as NodeJS.ProcessEnv;

    const response = await getProductList({} as APIGatewayProxyEvent);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBe(
      JSON.stringify({
        message: 'Internal Server Error',
        error: 'Table names are not defined in environment variables',
      }),
    );
    expect(dynamoMock.calls()).toHaveLength(0);
  });
});
