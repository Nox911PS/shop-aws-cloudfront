export const mockSend = jest.fn();
export const mockUuid = jest.fn();
export const mockS3Client = jest.fn().mockImplementation((config) => ({ config }));
export const mockS3Send = jest.fn();
export const mockPutObjectCommand = jest.fn().mockImplementation((input) => ({ input }));
export const mockGetObjectCommand = jest.fn().mockImplementation((input) => ({
  type: 'GetObjectCommand',
  input,
}));
export const mockCopyObjectCommand = jest.fn().mockImplementation((input) => ({
  type: 'CopyObjectCommand',
  input,
}));
export const mockDeleteObjectCommand = jest.fn().mockImplementation((input) => ({
  type: 'DeleteObjectCommand',
  input,
}));
export const mockGetSignedUrl = jest.fn();

jest.mock('@aws-sdk/client-dynamodb', () => ({
  ...jest.requireActual('@aws-sdk/client-dynamodb'),
  DynamoDBClient: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
}));

jest.mock('uuid', () => ({
  v4: mockUuid,
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: mockS3Client,
  PutObjectCommand: mockPutObjectCommand,
  GetObjectCommand: mockGetObjectCommand,
  CopyObjectCommand: mockCopyObjectCommand,
  DeleteObjectCommand: mockDeleteObjectCommand,
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}));

