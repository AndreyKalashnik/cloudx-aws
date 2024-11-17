import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3Notifications from "aws-cdk-lib/aws-s3-notifications";
import * as path from "path";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsFileBucket = new s3.Bucket(this, "products-file-bucket", {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const api = new apigateway.RestApi(this, "files-api", {
      restApiName: "API Gateway for import service",
      description: "This API serves the import lambda functions.",
    });

    const importProductsFileLambdaFunction = new NodejsFunction(
      this,
      "import-products-file-lambda-function",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        entry: path.join(__dirname, "./lambda/import-products-file-lambda.ts"),
        environment: {
          TABLE_NAME: productsFileBucket.bucketName,
        },
      }
    );

    const importFileParserLambdaFunction = new NodejsFunction(
      this,
      "import-file-parser-lambda-function",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        entry: path.join(__dirname, "./lambda/import-file-parser-lambda.ts"),
        environment: {
          BUCKET_NAME: productsFileBucket.bucketName,
        },
      }
    );

    productsFileBucket.grantRead(importProductsFileLambdaFunction);
    productsFileBucket.grantRead(importFileParserLambdaFunction);

    const s3Policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:GetObject"],
      resources: [`${productsFileBucket.bucketArn}/uploaded/*`],
    });

    importProductsFileLambdaFunction.addToRolePolicy(s3Policy);

    productsFileBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3Notifications.LambdaDestination(importFileParserLambdaFunction),
      { prefix: "uploaded/" }
    );

    const importProductsFileIntegration = new apigateway.LambdaIntegration(
      importProductsFileLambdaFunction,
      {
        requestTemplates: {
          "application/json": `{ "fileName": "$input.params('fileName')", "ext": "$input.params('ext')" }`,
        },
        integrationResponses: [
          {
            statusCode: "200",
          },
        ],
        proxy: true,
      }
    );

    const importProductsFileResource = api.root.addResource("import");

    importProductsFileResource.addMethod("GET", importProductsFileIntegration, {
      methodResponses: [{ statusCode: "200" }],
    });

    importProductsFileResource.addCorsPreflight({
      allowOrigins: ["https://d2x8apydnwku5t.cloudfront.net/"],
      allowMethods: ["GET"],
    });
  }
}
