import { APIGatewayProxyEvent } from 'aws-lambda';
import { mockSend } from '../../../../mock/jest.mock';

import { getProductList } from '../get-product-list';

describe('getProductsList', () => {
  const originalEnv = process.env;

  beforeEach(() => {
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

    mockSend
      .mockResolvedValueOnce({ Items: products })
      .mockResolvedValueOnce({ Items: stocks });

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
    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(mockSend.mock.calls[0][0].input).toEqual({
      TableName: 'products-table',
    });
    expect(mockSend.mock.calls[1][0].input).toEqual({
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
    expect(mockSend).not.toHaveBeenCalled();
  });
});
