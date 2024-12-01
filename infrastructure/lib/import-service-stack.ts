import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3Notifications from "aws-cdk-lib/aws-s3-notifications";
import { Queue } from "aws-cdk-lib/aws-sqs";
import * as path from "path";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const githubLogin = process.env.GITHUB_LOGIN;
    const testPass = process.env.TEST_PASS;
    const credentials = `${githubLogin}=${testPass}`;

    const productsFileBucket = new s3.Bucket(this, "products-file-bucket", {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const catalogItemsSQSQueue = new Queue(this, "catalog-items-sqs-queue");

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
          SQS_QUEUE_URL: catalogItemsSQSQueue.queueUrl,
        },
      }
    );

    const basicAuthorizerLambdaFunction = new NodejsFunction(
      this,
      "basic-authorizer-lambda-function",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        environment: {
          CREDENTIALS: credentials,
        },
        entry: path.join(__dirname, "../lambda/basic-authorizer-lambda.ts"),
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

    const lambdaAuthorizer = new apigateway.TokenAuthorizer(
      this,
      "LambdaAuthorizer",
      {
        handler: basicAuthorizerLambdaFunction,
        identitySource: "method.request.header.Authorization",
      }
    );

    const importProductsFileResource = api.root.addResource("import");

    importProductsFileResource.addMethod("GET", importProductsFileIntegration, {
      methodResponses: [{ statusCode: "200" }],
      authorizer: lambdaAuthorizer,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    });

    importProductsFileResource.addCorsPreflight({
      allowOrigins: ["https://d2x8apydnwku5t.cloudfront.net/"],
      allowMethods: ["GET"],
    });

    catalogItemsSQSQueue.grantSendMessages(importFileParserLambdaFunction);
  }
}
