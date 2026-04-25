import { S3Event } from 'aws-lambda';
import { Readable } from 'stream';
import {
  mockS3Client,
  mockS3Send,
  mockGetObjectCommand,
  mockCopyObjectCommand,
  mockDeleteObjectCommand,
} from '../../../../mock/jest.mock';

import { parseProductFile } from '../parse-product-file';

describe('parseProductFile', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Client.mockImplementation(() => ({ send: mockS3Send }));
    process.env = {
      ...originalEnv,
      CDK_REGION: 'eu-north-1',
      S3_BUCKET_UPLOADED_FOLDER: 'uploaded',
    } as NodeJS.ProcessEnv;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should parse csv and move file from uploaded/ to parsed/', async () => {
    const body = Readable.from([
      'title,description,price,count\n',
      'Book,Great book,10,3\n',
    ]);

    mockS3Send
      .mockResolvedValueOnce({ Body: body })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const event = {
      Records: [
        {
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'uploaded%2Fproducts+file.csv' },
          },
        },
      ],
    } as unknown as S3Event;

    await parseProductFile(event);

    expect(mockS3Client).toHaveBeenCalledWith({ region: 'eu-north-1' });

    expect(mockGetObjectCommand).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      Key: 'uploaded/products file.csv',
    });

    expect(mockCopyObjectCommand).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      CopySource: 'test-bucket/uploaded/products file.csv',
      Key: 'parsed/products file.csv',
    });

    expect(mockDeleteObjectCommand).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      Key: 'uploaded/products file.csv',
    });

    expect(mockS3Send).toHaveBeenCalledTimes(3);
    expect(mockS3Send).toHaveBeenNthCalledWith(1, {
      type: 'GetObjectCommand',
      input: {
        Bucket: 'test-bucket',
        Key: 'uploaded/products file.csv',
      },
    });
    expect(mockS3Send).toHaveBeenNthCalledWith(2, {
      type: 'CopyObjectCommand',
      input: {
        Bucket: 'test-bucket',
        CopySource: 'test-bucket/uploaded/products file.csv',
        Key: 'parsed/products file.csv',
      },
    });
    expect(mockS3Send).toHaveBeenNthCalledWith(3, {
      type: 'DeleteObjectCommand',
      input: {
        Bucket: 'test-bucket',
        Key: 'uploaded/products file.csv',
      },
    });
  });

  it('should continue with next record when one record fails', async () => {
    const body = Readable.from([
      'title,description,price,count\n',
      'Phone,Smart phone,999,5\n',
    ]);

    mockS3Send
      .mockRejectedValueOnce(new Error('Cannot read object'))
      .mockResolvedValueOnce({ Body: body })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const event = {
      Records: [
        {
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'uploaded%2Fbroken.csv' },
          },
        },
        {
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'uploaded%2Fgood.csv' },
          },
        },
      ],
    } as unknown as S3Event;

    await expect(parseProductFile(event)).resolves.toBeUndefined();

    expect(mockGetObjectCommand).toHaveBeenCalledTimes(2);
    expect(mockCopyObjectCommand).toHaveBeenCalledTimes(1);
    expect(mockDeleteObjectCommand).toHaveBeenCalledTimes(1);
  });
});

