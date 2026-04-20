export const mockSend = jest.fn();
export const mockUuid = jest.fn();

jest.mock('@aws-sdk/client-dynamodb', () => ({
  ...jest.requireActual('@aws-sdk/client-dynamodb'),
  DynamoDBClient: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
}));

jest.mock('uuid', () => ({
  v4: mockUuid,
}));
