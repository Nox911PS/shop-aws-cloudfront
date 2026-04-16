import { getProductById } from '../get-product-by-id';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { productsMockData } from '../mock-data';

describe('getProductById', () => {
  it('should getProductsById be defined', async () => {
    expect(getProductById).toBeDefined();
  });

  it('should return product', async () => {
    const product = productsMockData[0];
    const mockEvent = {
      pathParameters: { productId: product.id },
    } as unknown as APIGatewayProxyEvent;
    const response = await getProductById(mockEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(JSON.stringify(product));
  });

  it('should return product not found', async () => {
    const productId = 'some product id';
    const mockEvent = {
      pathParameters: { productId },
    } as unknown as APIGatewayProxyEvent;
    const response = await getProductById(mockEvent);

    expect(response.statusCode).toBe(400);
    expect(response.body).toBe(
      JSON.stringify({ message: `Product with ID ${productId} not found` }),
    );
  });
});
