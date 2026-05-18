#!/usr/bin/env node
import 'dotenv/config';
import * as cdk from 'aws-cdk-lib/core';
import { AuthorizationServiceStack, ImportServiceStack, ProductServiceStack } from '../lib/stacks';
import { parseAuthorizationCredentials } from '../lib/utils/authorization-credentials';

const app = new cdk.App();
const authorizationCredentials = parseAuthorizationCredentials(process.env);

const productServiceStack = new ProductServiceStack(app, 'ProductServiceStack', {
  env: {
    account: process.env.CDK_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_REGION || process.env.CDK_DEFAULT_REGION,
  },
  allowedOrigin: process.env.ALLOWED_ORIGIN!,
  productsDatabaseName: process.env.PRODUCTS_TABLE_NAME!,
  stocksDatabaseName: process.env.STOCKS_TABLE_NAME!,
  notificationUserEmail: process.env.NOTIFICATION_USER_EMAIL!,
  notificationUserEmailPremium: process.env.NOTIFICATION_USER_EMAIL_PREMIUM!,
});

const authorizationServiceStack = new AuthorizationServiceStack(app, 'AuthorizationServiceStack', {
  env: {
    account: process.env.CDK_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_REGION || process.env.CDK_DEFAULT_REGION,
  },
  authorizationCredentials,
});

new ImportServiceStack(app, 'ImportServiceStack', {
  env: {
    account: process.env.CDK_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_REGION || process.env.CDK_DEFAULT_REGION,
  },
  allowedOrigin: process.env.ALLOWED_ORIGIN!,
  s3BucketName: process.env.S3_BUCKET_NAME!,
  s3BucketUploadedFolder: process.env.S3_BUCKET_UPLOADED_FOLDER!,
  catalogItemsQueue: productServiceStack.catalogItemsQueue,
  basicAuthorizerLambda: authorizationServiceStack.basicAuthorizerLambda,
});
