import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { SIGNED_URL_EXPIRATION_IN_MS } from './import-file.constants';

export async function importProductFile(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  console.log('Incoming request:', JSON.stringify(event));

  const fileName = event.queryStringParameters?.name;

  if (!fileName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'File name query param is required' }),
    };
  }

  const client = new S3Client({ region: process.env.CDK_REGION });
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${process.env.S3_BUCKET_UPLOADED_FOLDER}/${fileName}`,
  });

  try {
    const signedUrl = await getSignedUrl(client, command, {
      expiresIn: SIGNED_URL_EXPIRATION_IN_MS,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: JSON.stringify(signedUrl),
    };
  } catch (error: any) {
    console.error('Error generating import signed URL:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
}
