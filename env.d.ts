declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly ALLOWED_ORIGIN: string;
      readonly CDK_ACCOUNT: string;
      readonly CDK_REGION: string;
      readonly CDK_DEFAULT_ACCOUNT: string;
      readonly CDK_DEFAULT_REGION: string;
      readonly PRODUCTS_TABLE_NAME: string;
      readonly STOCKS_TABLE_NAME: string;
      readonly S3_BUCKET_NAME: string;
    }
  }
}

export {};
