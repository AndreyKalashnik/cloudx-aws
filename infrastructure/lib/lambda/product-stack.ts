import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";

export class ProductStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductListLambdaFunction = new lambda.Function(
      this,
      "getProductListLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: "getProductList.main",
        code: lambda.Code.fromAsset(path.join(__dirname, "./")),
      }
    );

    const getProductByIdLambdaFunction = new lambda.Function(
      this,
      "getProductByIdLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: "getProductById.main",
        code: lambda.Code.fromAsset(path.join(__dirname, "./")),
      }
    );

    const productListIntegration = new apigateway.LambdaIntegration(
      getProductListLambdaFunction,
      {
        integrationResponses: [
          {
            statusCode: "200",
          },
        ],
        proxy: false,
      }
    );

    const productByIdIntegration = new apigateway.LambdaIntegration(
      getProductByIdLambdaFunction,
      {
        integrationResponses: [
          {
            statusCode: "200",
          },
        ],
        requestTemplates: {
          "application/json": JSON.stringify({
            pathParameters: {
              productId: "$input.params('productId')",
            },
          }),
        },
        proxy: false,
      }
    );

    const api = new apigateway.RestApi(this, "product-api", {
      restApiName: "Product Gateway",
      description: "This API serves the Lambda functions.",
    });

    const productListResource = api.root.addResource("products");
    const productByIdResource = productListResource.addResource("{productId}");

    productListResource.addMethod("GET", productListIntegration, {
      methodResponses: [
        {
          statusCode: "200",
        },
      ],
    });

    productByIdResource.addMethod("GET", productByIdIntegration, {
      methodResponses: [
        {
          statusCode: "200",
        },
      ],
    });

    productListResource.addCorsPreflight({
      allowOrigins: ["https://d2x8apydnwku5t.cloudfront.net/"],
      allowMethods: ["GET"],
    });

    productByIdResource.addCorsPreflight({
      allowOrigins: ["https://d2x8apydnwku5t.cloudfront.net/"],
      allowMethods: ["GET"],
    });
  }
}
