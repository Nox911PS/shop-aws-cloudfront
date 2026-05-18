import { SQSEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const mockUuid = jest.fn();

jest.mock('uuid', () => ({
  v4: mockUuid,
}));

import { catalogBatchProcess } from '../catalog-batch-process';

const dynamoDocMock = mockClient(DynamoDBDocumentClient);
const snsMock = mockClient(SNSClient);

describe('catalogBatchProcess', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    dynamoDocMock.reset();
    snsMock.reset();
    jest.clearAllMocks();

    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    process.env = {
      ...originalEnv,
      CDK_REGION: 'eu-west-1',
      PRODUCTS_TABLE_NAME: 'products-table',
      STOCKS_TABLE_NAME: 'stocks-table',
      CREATE_PRODUCT_TOPIC_ARN: 'arn:aws:sns:eu-west-1:111111111111:create-product-topic',
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should persist all products and publish one notification', async () => {
    mockUuid.mockReturnValueOnce('id-1').mockReturnValueOnce('id-2');
    dynamoDocMock.on(TransactWriteCommand).resolves({} as never);
    snsMock.on(PublishCommand).resolves({} as never);

    const event = {
      Records: [
        {
          body: JSON.stringify({
            title: 'Book',
            description: 'Good one',
            price: '10',
            count: '3',
          }),
        },
        {
          body: JSON.stringify({
            title: 'Phone',
            description: 'Smart phone',
            price: 999,
            count: 5,
          }),
        },
      ],
    } as unknown as SQSEvent;

    await expect(catalogBatchProcess(event)).resolves.toBeUndefined();

    expect(mockUuid).toHaveBeenCalledTimes(2);
    expect(dynamoDocMock.commandCalls(TransactWriteCommand)).toHaveLength(2);

    expect(dynamoDocMock.commandCalls(TransactWriteCommand)[0].args[0].input).toEqual({
      TransactItems: [
        {
          Put: {
            TableName: 'products-table',
            Item: {
              id: 'id-1',
              title: 'Book',
              description: 'Good one',
              price: 10,
            },
          },
        },
        {
          Put: {
            TableName: 'stocks-table',
            Item: {
              product_id: 'id-1',
              count: 3,
            },
          },
        },
      ],
    });

    expect(dynamoDocMock.commandCalls(TransactWriteCommand)[1].args[0].input).toEqual({
      TransactItems: [
        {
          Put: {
            TableName: 'products-table',
            Item: {
              id: 'id-2',
              title: 'Phone',
              description: 'Smart phone',
              price: 999,
            },
          },
        },
        {
          Put: {
            TableName: 'stocks-table',
            Item: {
              product_id: 'id-2',
              count: 5,
            },
          },
        },
      ],
    });

    expect(snsMock.commandCalls(PublishCommand)).toHaveLength(1);
    expect(snsMock.commandCalls(PublishCommand)[0].args[0].input).toEqual({
      TopicArn: 'arn:aws:sns:eu-west-1:111111111111:create-product-topic',
      Subject: 'Products Import Finished',
      Message: `The following products were added to the database:\n\n${JSON.stringify(
        [
          {
            id: 'id-1',
            title: 'Book',
            description: 'Good one',
            price: 10,
            count: 3,
          },
          {
            id: 'id-2',
            title: 'Phone',
            description: 'Smart phone',
            price: 999,
            count: 5,
          },
        ],
        null,
        2,
      )}`,
    });
  });

  it('should continue when one record fails and publish only successful products', async () => {
    mockUuid.mockReturnValueOnce('id-1').mockReturnValueOnce('id-2');
    dynamoDocMock.on(TransactWriteCommand).rejectsOnce(new Error('write failed')).resolvesOnce({} as never);
    snsMock.on(PublishCommand).resolves({} as never);

    const event = {
      Records: [
        {
          body: JSON.stringify({
            title: 'Broken',
            description: 'Will fail',
            price: 12,
            count: 1,
          }),
        },
        {
          body: JSON.stringify({
            title: 'Works',
            description: 'Will pass',
            price: 20,
            count: 2,
          }),
        },
      ],
    } as unknown as SQSEvent;

    await expect(catalogBatchProcess(event)).resolves.toBeUndefined();

    expect(dynamoDocMock.commandCalls(TransactWriteCommand)).toHaveLength(2);
    expect(snsMock.commandCalls(PublishCommand)).toHaveLength(1);
    expect(snsMock.commandCalls(PublishCommand)[0].args[0].input).toEqual({
      TopicArn: 'arn:aws:sns:eu-west-1:111111111111:create-product-topic',
      Subject: 'Products Import Finished',
      Message: `The following products were added to the database:\n\n${JSON.stringify(
        [
          {
            id: 'id-2',
            title: 'Works',
            description: 'Will pass',
            price: 20,
            count: 2,
          },
        ],
        null,
        2,
      )}`,
    });
  });

  it('should not throw if SNS publish fails', async () => {
    mockUuid.mockReturnValue('id-1');
    dynamoDocMock.on(TransactWriteCommand).resolves({} as never);
    snsMock.on(PublishCommand).rejects(new Error('sns down'));

    const event = {
      Records: [
        {
          body: JSON.stringify({
            title: 'Book',
            description: 'Good one',
            price: 10,
            count: 3,
          }),
        },
      ],
    } as unknown as SQSEvent;

    await expect(catalogBatchProcess(event)).resolves.toBeUndefined();

    expect(dynamoDocMock.commandCalls(TransactWriteCommand)).toHaveLength(1);
    expect(snsMock.commandCalls(PublishCommand)).toHaveLength(1);
    expect(console.error).toHaveBeenCalledWith('Failed to send SNS notification:', expect.any(Error));
  });
});

