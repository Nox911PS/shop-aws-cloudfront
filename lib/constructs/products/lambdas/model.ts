export interface ProductsLambdaProps {
  readonly allowedOrigin: string;
  readonly productsDatabaseName: string;
  readonly stocksDatabaseName: string;
  readonly createProductTopicArn?: string;
}
