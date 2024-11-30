import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Topic } from "aws-cdk-lib/aws-sns";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
}

const PRODUCTS_TABLE_NAME = "Products";

export const productsMock: readonly Product[] = [
  {
    id: "game1",
    title: "Bloodborne",
    description: "Bloodborne description",
    price: 499,
    count: 10,
  },
  {
    id: "game2",
    title: "God of War",
    description: "God of War description",
    price: 1199,
    count: 5,
  },
  {
    id: "game3",
    title: "God of War. Ragnarok",
    description: "God of War Ragnarok description",
    price: 1999,
    count: 8,
  },
  {
    id: "game4",
    title: "Prince of Persia. Lost Crown",
    description: "Prince of Persia. Lost Crown description",
    price: 999,
    count: 12,
  },
];

export class ProductStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const snsTopic = new Topic(this, "products-service-sns-topic", {
      displayName: "products-service-sns-topic",
    });

    const api = new apigateway.RestApi(this, "product-api", {
      restApiName: "Product Gateway API",
      description: "This API serves the Lambda functions.",
    });

    const productsTable = new dynamodb.Table(this, PRODUCTS_TABLE_NAME, {
      tableName: PRODUCTS_TABLE_NAME,
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
    });

    const catalogItemsSQSQueue = new Queue(this, "catalog-items-sqs-queue");

    const getAllProductsLambdaFunction = new NodejsFunction(
      this,
      "getAllProductsLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        environment: {
          TABLE_NAME: PRODUCTS_TABLE_NAME,
        },
        entry: path.join(__dirname, "./lambda/getProductList.ts"),
      }
    );

    const getProductByIdLambdaFunction = new NodejsFunction(
      this,
      "getProductByIdLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        environment: {
          TABLE_NAME: PRODUCTS_TABLE_NAME,
        },
        entry: path.join(__dirname, "./lambda/getProductById.ts"),
      }
    );

    const createProductLambdaFunction = new NodejsFunction(
      this,
      "createProductLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        environment: {
          TABLE_NAME: PRODUCTS_TABLE_NAME,
        },
        entry: path.join(__dirname, "./lambda/createProduct.ts"),
      }
    );

    const catalogBatchProcessLambdaFunction = new NodejsFunction(
      this,
      "catalogBatchProcessLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        environment: {
          TABLE_NAME: PRODUCTS_TABLE_NAME,
          SNS_TOPIC_ARN: snsTopic.topicArn,
        },
        entry: path.join(__dirname, "./catalogBatchProcess.ts"),
      }
    );

    const allProductsLambdaIntegration = new apigateway.LambdaIntegration(
      getAllProductsLambdaFunction,
      {
        integrationResponses: [{ statusCode: "200" }],
        proxy: true,
      }
    );

    const productByIdLambdaIntegration = new apigateway.LambdaIntegration(
      getProductByIdLambdaFunction,
      {
        integrationResponses: [{ statusCode: "200" }],
        proxy: true,
      }
    );

    const createProductLambdaIntegration = new apigateway.LambdaIntegration(
      createProductLambdaFunction,
      {
        integrationResponses: [{ statusCode: "200" }],
        proxy: true,
      }
    );

    const allProductsResource = api.root.addResource("products");
    const productByIdResource = allProductsResource.addResource("{productId}");

    allProductsResource.addMethod("GET", allProductsLambdaIntegration, {
      methodResponses: [{ statusCode: "200" }],
    });

    productByIdResource.addMethod("GET", productByIdLambdaIntegration, {
      methodResponses: [{ statusCode: "200" }],
    });

    allProductsResource.addMethod("POST", createProductLambdaIntegration, {
      methodResponses: [{ statusCode: "200" }],
    });

    allProductsResource.addCorsPreflight({
      allowOrigins: ["https://d2x8apydnwku5t.cloudfront.net/"],
      allowMethods: ["GET"],
    });

    productsTable.grantReadData(getAllProductsLambdaFunction);
    productsTable.grantReadData(getProductByIdLambdaFunction);
    productsTable.grantWriteData(createProductLambdaFunction);
    productsTable.grantWriteData(catalogBatchProcessLambdaFunction);

    catalogBatchProcessLambdaFunction.addEventSource(
      new SqsEventSource(catalogItemsSQSQueue, {
        batchSize: 5,
      })
    );

    snsTopic.addSubscription(new EmailSubscription(""));
    snsTopic.grantPublish(catalogBatchProcessLambdaFunction);
  }
}
