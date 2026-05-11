import { APIGatewayProxyEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';

const mockUuid = jest.fn();

jest.mock('uuid', () => ({
  v4: mockUuid,
}));

import { createProduct } from '../create-product';

const dynamoMock = mockClient(DynamoDBClient);

describe('createProduct', () => {
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

  it('should createProduct be defined', async () => {
    expect(createProduct).toBeDefined();
  });

  it('should create product and stock records', async () => {
    const id = 'generated-product-id';
    const product = {
      title: 'Product 1',
      description: 'Test product',
      price: 42,
      count: 7,
    };

    mockUuid.mockReturnValue(id);
    dynamoMock.on(TransactWriteCommand).resolves({} as never);

    const mockEvent = {
      body: JSON.stringify(product),
    } as APIGatewayProxyEvent;

    const response = await createProduct(mockEvent);

    expect(response.statusCode).toBe(201);
    expect(response.headers).toEqual({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://example.com',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    });
    expect(JSON.parse(response.body)).toEqual({
      id,
      ...product,
    });
    expect(mockUuid).toHaveBeenCalledTimes(1);
    expect(dynamoMock.commandCalls(TransactWriteCommand)).toHaveLength(1);
    expect(dynamoMock.commandCalls(TransactWriteCommand)[0].args[0].input).toEqual({
      TransactItems: [
        {
          Put: {
            TableName: 'products-table',
            Item: {
              id,
              title: product.title,
              description: product.description,
              price: product.price,
            },
          },
        },
        {
          Put: {
            TableName: 'stocks-table',
            Item: {
              product_id: id,
              count: product.count,
            },
          },
        },
      ],
    });
  });

  it('should return bad request for invalid product data', async () => {
    const mockEvent = {
      body: JSON.stringify({
        title: 'Product 1',
        description: 'Test product',
        count: 7,
      }),
    } as APIGatewayProxyEvent;

    const response = await createProduct(mockEvent);

    expect(response.statusCode).toBe(400);
    expect(response.body).toBe(
      JSON.stringify({
        message: 'Invalid product data. Title, price and count are required.',
      }),
    );
    expect(mockUuid).not.toHaveBeenCalled();
    expect(dynamoMock.calls()).toHaveLength(0);
  });

  it('should return internal server error when database write fails', async () => {
    const id = 'generated-product-id';
    const product = {
      title: 'Product 1',
      description: 'Test product',
      price: 42,
      count: 7,
    };

    mockUuid.mockReturnValue(id);
    dynamoMock.on(TransactWriteCommand).rejects(new Error('Transaction failed'));

    const mockEvent = {
      body: JSON.stringify(product),
    } as APIGatewayProxyEvent;

    const response = await createProduct(mockEvent);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBe(
      JSON.stringify({
        message: 'Internal Server Error',
        error: 'Transaction failed',
      }),
    );
    expect(mockUuid).toHaveBeenCalledTimes(1);
    expect(dynamoMock.commandCalls(TransactWriteCommand)).toHaveLength(1);
  });
});

