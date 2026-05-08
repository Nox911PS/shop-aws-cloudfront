import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface NotificationConstructProps {
  readonly notificationUserEmail: string;
}

export class CreateProductTopicConstruct extends Construct {
  public readonly topic: sns.ITopic;

  constructor(scope: Construct, id: string, props: NotificationConstructProps) {
    super(scope, id);

    this.topic = new sns.Topic(this, 'CreateProductTopic', {
      topicName: 'create-product-topic',
    });

    this.topic.addSubscription(new subscriptions.EmailSubscription(props.notificationUserEmail));
  }
}
