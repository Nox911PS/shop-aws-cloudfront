#!/usr/bin/env node
import 'dotenv/config';
import * as cdk from 'aws-cdk-lib/core';
import { ImportServiceStack, ProductServiceStack } from '../lib/stacks';

const app = new cdk.App();
new ProductServiceStack(app, 'ProductServiceStack', {
  env: {
    account: process.env.CDK_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_REGION || process.env.CDK_DEFAULT_REGION,
  },
  allowedOrigin: process.env.ALLOWED_ORIGIN,
  productsDatabaseName: process.env.PRODUCTS_TABLE_NAME!,
  stocksDatabaseName: process.env.STOCKS_TABLE_NAME!,
});

new ImportServiceStack(app, 'ImportServiceStack', {
  env: {
    account: process.env.CDK_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_REGION || process.env.CDK_DEFAULT_REGION,
  },
  allowedOrigin: process.env.ALLOWED_ORIGIN,
  s3BucketName: process.env.S3_BUCKET_NAME,
});
