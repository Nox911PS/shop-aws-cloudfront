import { S3Event } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { parse } from 'csv-parse';
import type { Readable } from 'node:stream';

export const parseProductFile = async (event: S3Event): Promise<void> => {
  console.log('Incoming S3 Event:', JSON.stringify(event));

  const client = new S3Client({ region: process.env.CDK_REGION });
  const sqsClient = new SQSClient({ region: process.env.CDK_REGION });

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    try {
      const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const s3Stream = response.Body as Readable;

      const parser = s3Stream.pipe(parse({ columns: true, skip_empty_lines: true, trim: true }));

      for await (const data of parser) {
        await sqsClient.send(
          new SendMessageCommand({
            QueueUrl: process.env.CATALOG_ITEMS_QUEUE_URL,
            MessageBody: JSON.stringify(data),
          }),
        );
      }

      console.log(`Finished parsing ${key}`);

      const newKey = key.replace(`${process.env.S3_BUCKET_UPLOADED_FOLDER}/`, 'parsed/');
      await client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${key}`,
          Key: newKey,
        }),
      );
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch (error) {
      console.error(`Error processing S3 object ${key}:`, error);
    }
  }
};
