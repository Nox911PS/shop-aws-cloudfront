import { S3Event } from 'aws-lambda';
import { Readable } from 'stream';
import { mockClient } from 'aws-sdk-client-mock';
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

import { parseProductFile } from '../parse-product-file';

const s3Mock = mockClient(S3Client);

describe('parseProductFile', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    s3Mock.reset();
    jest.clearAllMocks();
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

    s3Mock
      .on(GetObjectCommand, {
        Bucket: 'test-bucket',
        Key: 'uploaded/products file.csv',
      })
      .resolves({ Body: body } as never);
    s3Mock.on(CopyObjectCommand).resolves({} as never);
    s3Mock.on(DeleteObjectCommand).resolves({} as never);

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

    expect(s3Mock.commandCalls(GetObjectCommand)).toHaveLength(1);
    expect(s3Mock.commandCalls(GetObjectCommand)[0].args[0].input).toEqual({
      Bucket: 'test-bucket',
      Key: 'uploaded/products file.csv',
    });

    expect(s3Mock.commandCalls(CopyObjectCommand)).toHaveLength(1);
    expect(s3Mock.commandCalls(CopyObjectCommand)[0].args[0].input).toEqual({
      Bucket: 'test-bucket',
      CopySource: 'test-bucket/uploaded/products file.csv',
      Key: 'parsed/products file.csv',
    });

    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
    expect(s3Mock.commandCalls(DeleteObjectCommand)[0].args[0].input).toEqual({
      Bucket: 'test-bucket',
      Key: 'uploaded/products file.csv',
    });
  });

  it('should continue with next record when one record fails', async () => {
    const body = Readable.from([
      'title,description,price,count\n',
      'Phone,Smart phone,999,5\n',
    ]);

    s3Mock.on(GetObjectCommand).rejectsOnce(new Error('Cannot read object')).resolvesOnce({
      Body: body,
    } as never);
    s3Mock.on(CopyObjectCommand).resolves({} as never);
    s3Mock.on(DeleteObjectCommand).resolves({} as never);

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

    expect(s3Mock.commandCalls(GetObjectCommand)).toHaveLength(2);
    expect(s3Mock.commandCalls(CopyObjectCommand)).toHaveLength(1);
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
  });
});

