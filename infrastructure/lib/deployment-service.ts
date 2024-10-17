import {
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_s3,
  aws_s3_deployment,
  CfnOutput,
} from "aws-cdk-lib";
import { Construct } from "constructs";

const PATH = "../app/dist";

export class DeploymentService extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    const hostingBucket = new aws_s3.Bucket(this, "cloudx-aws-bucket", {
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
    });

    const distribution = new aws_cloudfront.Distribution(
      this,
      "cloudx-aws-distribution",
      {
        defaultBehavior: {
          origin: new aws_cloudfront_origins.S3Origin(hostingBucket),
          viewerProtocolPolicy:
            aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        defaultRootObject: "index.html",
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          },
        ],
      }
    );

    new aws_s3_deployment.BucketDeployment(this, "BucketDeployment", {
      sources: [aws_s3_deployment.Source.asset(PATH)],
      destinationBucket: hostingBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    new CfnOutput(this, "CloudFrontURL", {
      value: distribution.domainName,
      description: "The distribution URL",
      exportName: "CloudfrontURL",
    });

    new CfnOutput(this, "BucketName", {
      value: hostingBucket.bucketName,
      description: "The name of the S3 bucket",
      exportName: "BucketName",
    });
  }
}
