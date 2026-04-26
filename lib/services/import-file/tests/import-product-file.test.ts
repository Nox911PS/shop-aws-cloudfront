import { APIGatewayProxyEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { SIGNED_URL_EXPIRATION_IN_MS } from '../import-file.constants';
import { importProductFile } from '../import-product-file';

const s3Mock = mockClient(S3Client);
const mockGetSignedUrl = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>;

describe('importProductFile', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    s3Mock.reset();
    jest.clearAllMocks();
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
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
    expect(s3Mock.calls()).toHaveLength(0);
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

    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
    const [clientArg, commandArg, optionsArg] = mockGetSignedUrl.mock.calls[0];

    expect(clientArg).toBeInstanceOf(S3Client);
    expect(commandArg).toBeInstanceOf(PutObjectCommand);
    expect((commandArg as PutObjectCommand).input).toEqual({
      Bucket: 'import-products-bucket',
      Key: 'uploaded/products.csv',
    });
    expect(optionsArg).toEqual({ expiresIn: SIGNED_URL_EXPIRATION_IN_MS });
    expect(s3Mock.calls()).toHaveLength(0);
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

