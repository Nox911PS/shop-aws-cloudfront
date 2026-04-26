import { getProductList } from '../get-product-list';
import { APIGatewayProxyEvent } from 'aws-lambda';

describe('getProductsList', () => {
  it('should getProductsList be defined', async () => {
    expect(getProductList).toBeDefined();
  });

  it('should return 200 and list of products', async () => {
    const mockEvent = {} as APIGatewayProxyEvent;
    const response = await getProductList(mockEvent);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).length).toBeGreaterThan(0);
  });
});
