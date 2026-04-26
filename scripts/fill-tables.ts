import 'dotenv/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 } from 'uuid';
import { productsTableMockData } from '../mock/products-table-mock-data';

const region = process.env.CDK_REGION || process.env.CDK_DEFAULT_REGION;
const productsTableName = process.env.PRODUCTS_TABLE_NAME;
const stocksTableName = process.env.STOCKS_TABLE_NAME;
const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client);

const fillTablesWithTransaction = async (): Promise<void> => {
  try {
    for (const productTableItem of productsTableMockData) {
      const id: string = v4();

      const command = new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: productsTableName,
              Item: {
                id,
                title: productTableItem.title,
                description: productTableItem.description,
                price: productTableItem.price,
              },
            },
          },
          {
            Put: {
              TableName: stocksTableName,
              Item: {
                product_id: id,
                count: Math.floor(Math.random() * 15) + 1,
              },
            },
          },
        ],
      });

      await docClient.send(command);
      console.log(`✅ Transaction successful for: ${productTableItem.title} (ID: ${id})`);
    }
    console.log('🚀 All items added via transactions!');
  } catch (error) {
    console.error('❌ Transaction failed:', error);
    process.exit(1);
  }
};

fillTablesWithTransaction();
