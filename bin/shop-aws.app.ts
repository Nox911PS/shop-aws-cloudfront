#!/usr/bin/env node
import 'dotenv/config';
import * as cdk from 'aws-cdk-lib/core';
import { AwsStack } from '../lib/stacks/aws-stack';

const app = new cdk.App();
new AwsStack(app, 'AwsStack', {
  env: {
    account: process.env.CDK_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_REGION || process.env.CDK_DEFAULT_REGION,
  },
  allowedOrigin: process.env.ALLOWED_ORIGIN || '*',
  productsDatabaseName: process.env.PRODUCTS_TABLE_NAME,
  stocksDatabaseName: process.env.STOCKS_TABLE_NAME,
});
