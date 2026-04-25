import { S3Event } from 'aws-lambda';
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import csvParser = require('csv-parser');
import { Readable } from 'stream';
import { IImportProduct } from './import-product.model';

export const parseProductFile = async (event: S3Event): Promise<void> => {
  console.log('Incoming S3 Event:', JSON.stringify(event));

  const client = new S3Client({ region: process.env.CDK_REGION });

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    try {
      const response = await client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );

      const s3Stream = response.Body as Readable;

      await new Promise<void>((resolve, reject) => {
        s3Stream
          .pipe(csvParser())
          .on('data', (data: IImportProduct) => {
            console.log('Parsed record:', data);
          })
          .on('error', (error: unknown) => {
            console.error('CSV Parsing error:', error);
            reject(error);
          })
          .on('end', async () => {
            console.log(`Finished parsing ${key}`);

            const newKey = key.replace(`${process.env.S3_BUCKET_UPLOADED_FOLDER}/`, 'parsed/');

            console.log(`Moving object from ${key} to ${newKey}`);

            await client.send(
              new CopyObjectCommand({
                Bucket: bucket,
                CopySource: `${bucket}/${key}`,
                Key: newKey,
              }),
            );

            await client.send(
              new DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
              }),
            );

            console.log(`Successfully moved to ${newKey}`);
            resolve();
          });
      });
    } catch (error) {
      console.error(`Error processing S3 object ${key}:`, error);
    }
  }
};
