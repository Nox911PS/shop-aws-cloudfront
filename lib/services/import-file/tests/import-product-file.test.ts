import { APIGatewayProxyEvent } from 'aws-lambda';
import {
  mockGetSignedUrl,
  mockPutObjectCommand,
  mockS3Client,
} from '../../../../mock/jest.mock';

import { SIGNED_URL_EXPIRATION_IN_MS } from '../import-file.constants';
import { importProductFile } from '../import-product-file';

describe('importProductFile', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Client.mockImplementation((config) => ({ config }));
    process.env = {
      ...originalEnv,
      CDK_REGION: 'eu-north-1',
      ALLOWED_ORIGIN: 'https://example.com',
      S3_BUCKET_NAME: 'import-products-bucket',
      S3_BUCKET_UPLOADED_FOLDER: 'uploaded',
    } as NodeJS.ProcessEnv;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return 400 when file name query param is missing', async () => {
    const event = {
      queryStringParameters: {},
    } as unknown as APIGatewayProxyEvent;

    const response = await importProductFile(event);

    expect(response.statusCode).toBe(400);
    expect(response.body).toBe(JSON.stringify({ message: 'File name query param is required' }));
    expect(mockS3Client).not.toHaveBeenCalled();
    expect(mockPutObjectCommand).not.toHaveBeenCalled();
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it('should return signed url for valid file name', async () => {
    const signedUrl = 'https://s3-url.example/upload';
    mockGetSignedUrl.mockResolvedValueOnce(signedUrl);

    const event = {
      queryStringParameters: { name: 'products.csv' },
    } as unknown as APIGatewayProxyEvent;

    const response = await importProductFile(event);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://example.com',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    });
    expect(response.body).toBe(JSON.stringify(signedUrl));

    expect(mockS3Client).toHaveBeenCalledWith({ region: 'eu-north-1' });
    expect(mockPutObjectCommand).toHaveBeenCalledWith({
      Bucket: 'import-products-bucket',
      Key: 'uploaded/products.csv',
    });
    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
    expect(mockGetSignedUrl).toHaveBeenCalledWith(
      { config: { region: 'eu-north-1' } },
      {
        input: {
          Bucket: 'import-products-bucket',
          Key: 'uploaded/products.csv',
        },
      },
      { expiresIn: SIGNED_URL_EXPIRATION_IN_MS },
    );
  });

  it('should return 500 when signed url generation fails', async () => {
    mockGetSignedUrl.mockRejectedValueOnce(new Error('S3 error'));

    const event = {
      queryStringParameters: { name: 'products.csv' },
    } as unknown as APIGatewayProxyEvent;

    const response = await importProductFile(event);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBe(
      JSON.stringify({
        message: 'Internal Server Error',
        error: 'S3 error',
      }),
    );
  });
});

