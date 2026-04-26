declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly ALLOWED_ORIGIN: string;
      readonly CDK_ACCOUNT: string;
      readonly CDK_REGION: string;
      readonly CDK_DEFAULT_ACCOUNT: string;
      readonly CDK_DEFAULT_REGION: string;
    }
  }
}

export {};
