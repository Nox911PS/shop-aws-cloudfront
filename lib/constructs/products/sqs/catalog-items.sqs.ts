import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export class CatalogItemsSqsConstruct extends Construct {
  public readonly queue: sqs.IQueue;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.queue = new sqs.Queue(this, 'CatalogItemsQueue', {
      queueName: 'catalog-items-queue',
      visibilityTimeout: cdk.Duration.seconds(30),
      retentionPeriod: cdk.Duration.days(4),
    });
  }
}
