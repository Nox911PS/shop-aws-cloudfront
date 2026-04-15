import * as path from 'path';
import { Construct } from 'constructs';
import {aws_cloudfront, aws_cloudfront_origins, aws_s3, aws_s3_deployment, CfnOutput, RemovalPolicy} from "aws-cdk-lib";

const webAppPath = path.resolve(__dirname, '../../../front/dist/app/browser');

export class DeploymentConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const hostingBucket = new aws_s3.Bucket(this, 'FrontAppBucket', {
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      websiteIndexDocument: 'index.html'
    });

    const distribution = new aws_cloudfront.Distribution(
      this,
      'FrontAppCloudfrontDistribution',
      {
        defaultBehavior: {
          origin: aws_cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
            hostingBucket
          ),
          viewerProtocolPolicy: aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        defaultRootObject: 'index.html',
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
          },
        ],
      }
    );

    new aws_s3_deployment.BucketDeployment(this, 'FrontAppBucketDeployment', {
      sources: [aws_s3_deployment.Source.asset(webAppPath)],
      destinationBucket: hostingBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    new CfnOutput(this, 'CloudFrontURL', {
      value: distribution.domainName,
      description: 'The Front App distribution URL',
      exportName: 'FrontAppCloudfrontURL',
    });

    new CfnOutput(this, 'BucketName', {
      value: hostingBucket.bucketName,
      description: 'The name of the Front App S3 bucket',
      exportName: 'FrontAppBucketName',
    });
  }
}
