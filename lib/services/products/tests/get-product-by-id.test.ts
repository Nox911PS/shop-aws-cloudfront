import { APIGatewayProxyEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetCommand } from '@aws-sdk/lib-dynamodb';

import { getProductById } from '../get-product-by-id';

const dynamoMock = mockClient(DynamoDBClient);

describe('getProductById', () => {
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

  it('should getProductsById be defined', async () => {
    expect(getProductById).toBeDefined();
  });

  it('should return product', async () => {
    const product = {
      id: 'product-1',
      title: 'Product 1',
      description: 'Test product',
      price: 42,
    };
    const stock = {
      product_id: product.id,
      count: 7,
    };

    dynamoMock
      .on(GetCommand, {
        TableName: 'products-table',
        Key: { id: product.id },
      })
      .resolvesOnce({ Item: product } as never)
      .on(GetCommand, {
        TableName: 'stocks-table',
        Key: { product_id: product.id },
      })
      .resolvesOnce({ Item: stock } as never);

    const mockEvent = {
      pathParameters: { productId: product.id },
    } as unknown as APIGatewayProxyEvent;
    const response = await getProductById(mockEvent);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://example.com',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    });
    expect(JSON.parse(response.body)).toEqual({
      ...product,
      count: stock.count,
    });
    expect(dynamoMock.commandCalls(GetCommand)).toHaveLength(2);
    expect(dynamoMock.commandCalls(GetCommand)[0].args[0].input).toEqual({
      TableName: 'products-table',
      Key: { id: product.id },
    });
    expect(dynamoMock.commandCalls(GetCommand)[1].args[0].input).toEqual({
      TableName: 'stocks-table',
      Key: { product_id: product.id },
    });
  });

  it('should return product not found', async () => {
    const productId = 'some product id';

    dynamoMock
      .on(GetCommand, {
        TableName: 'products-table',
        Key: { id: productId },
      })
      .resolvesOnce({} as never)
      .on(GetCommand, {
        TableName: 'stocks-table',
        Key: { product_id: productId },
      })
      .resolvesOnce({ Item: { product_id: productId, count: 99 } } as never);

    const mockEvent = {
      pathParameters: { productId },
    } as unknown as APIGatewayProxyEvent;
    const response = await getProductById(mockEvent);

    expect(response.statusCode).toBe(404);
    expect(response.headers).toEqual({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://example.com',
    });
    expect(response.body).toBe(
      JSON.stringify({ message: `Product with ID ${productId} not found` }),
    );
  });

  it('should return bad request when product id is missing', async () => {
    const mockEvent = {
      pathParameters: {},
    } as unknown as APIGatewayProxyEvent;

    const response = await getProductById(mockEvent);

    expect(response.statusCode).toBe(400);
    expect(response.body).toBe(JSON.stringify({ message: 'Product ID is required' }));
    expect(dynamoMock.calls()).toHaveLength(0);
  });
});
