import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const catalogBatchProcess = async (event: SQSEvent) => {
  console.log('Incoming SQS event:', JSON.stringify(event));

  for (const record of event.Records) {
    try {
      const productData = JSON.parse(record.body);
      const { title, description, price, count } = productData;

      console.log('Processing product:', title);

      const id = uuidv4();

      await docClient.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: process.env.PRODUCTS_TABLE_NAME,
                Item: {
                  id,
                  title,
                  description,
                  price: Number(price),
                },
              },
            },
            {
              Put: {
                TableName: process.env.STOCKS_TABLE_NAME,
                Item: {
                  product_id: id,
                  count: Number(count),
                },
              },
            },
          ],
        }),
      );

      console.log(`Product created successfully with id: ${id}`);
    } catch (error) {
      console.error('Error processing record:', error);
    }
  }
};
