import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: process.env.CDK_REGION });
const docClient = DynamoDBDocumentClient.from(client);
const snsClient = new SNSClient({ region: process.env.CDK_REGION });

export const catalogBatchProcess = async (event: SQSEvent) => {
  console.log('Incoming SQS event:', JSON.stringify(event));
  const processedProducts = [];

  for (const record of event.Records) {
    try {
      const productData = JSON.parse(record.body);
      const { title, description, price, count } = productData;

      console.log('Processing product:', title);

      const id = uuidv4();
      const newProduct = { id, title, description, price: Number(price), count: Number(count) };

      await docClient.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: process.env.PRODUCTS_TABLE_NAME,
                Item: { id, title, description, price: newProduct.price },
              },
            },
            {
              Put: {
                TableName: process.env.STOCKS_TABLE_NAME,
                Item: { product_id: id, count: newProduct.count },
              },
            },
          ],
        }),
      );

      console.log(`Product created successfully with id: ${id}`);
      processedProducts.push(newProduct);
    } catch (error) {
      console.error('Error processing record:', error);
    }
  }

  if (processedProducts.length > 0) {
    try {
      const maxPrice = Math.max(...processedProducts.map((p) => p.price));

      await snsClient.send(
        new PublishCommand({
          TopicArn: process.env.CREATE_PRODUCT_TOPIC_ARN,
          Subject: 'Products Import Finished',
          Message: `The following products were added to the database:\n\n${JSON.stringify(
            processedProducts,
            null,
            2,
          )}`,
          MessageAttributes: {
            price: {
              DataType: 'Number',
              StringValue: maxPrice.toString(),
            },
          },
        }),
      );
      console.log('SNS Notification sent');
    } catch (snsError) {
      console.error('Failed to send SNS notification:', snsError);
    }
  }
};
