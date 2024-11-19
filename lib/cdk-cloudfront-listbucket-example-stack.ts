import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class CdkCloudfrontListbucketExampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const bucket = new s3.Bucket(this, 'Bucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(this, 'NoRobots', {
          customHeadersBehavior: {
            customHeaders: [
              { header: 'X-Robots-Tag', value: 'noindex', override: true },
            ],
          },
        }),
      },
    });

    bucket.addToResourcePolicy(new iam.PolicyStatement({
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      actions: ['s3:ListBucket'],
      resources: [bucket.bucketArn],
      conditions: {
        StringEquals: {
          'AWS:SourceArn': this.formatArn({
            service: 'cloudfront',
            region: '',
            resource: 'distribution',
            resourceName: distribution.distributionId,
          }),
        },
      },
    }));

    new cdk.CfnOutput(this, 'DistributionUrl', { value: `https://${distribution.distributionDomainName}` });
  }
}
