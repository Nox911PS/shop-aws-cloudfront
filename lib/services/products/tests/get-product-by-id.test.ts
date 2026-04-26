import { APIGatewayProxyEvent } from 'aws-lambda';
import { mockSend } from '../../../../mock/jest.mock';

import { getProductById } from '../get-product-by-id';

describe('getProductById', () => {
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

    mockSend
      .mockResolvedValueOnce({ Item: product })
      .mockResolvedValueOnce({ Item: stock });

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
    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(mockSend.mock.calls[0][0].input).toEqual({
      TableName: 'products-table',
      Key: { id: product.id },
    });
    expect(mockSend.mock.calls[1][0].input).toEqual({
      TableName: 'stocks-table',
      Key: { product_id: product.id },
    });
  });

  it('should return product not found', async () => {
    const productId = 'some product id';

    mockSend
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ Item: { product_id: productId, count: 99 } });

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
    expect(mockSend).not.toHaveBeenCalled();
  });
});
