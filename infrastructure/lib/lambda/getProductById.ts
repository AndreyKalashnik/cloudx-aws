import { APIGatewayProxyEvent, Handler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDB);
const tableName = process.env.TABLE_NAME as string;

export const handler: Handler = async (event: APIGatewayProxyEvent) => {
  try {
    const productId = event.pathParameters?.id;

    if (!productId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Product ID is required" }),
      };
    }

    const command = new GetCommand({
      TableName: tableName,
      Key: { id: { S: productId } },
    });

    const result = await ddbDocClient.send(command);

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: `Product with id ${productId} not found`,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };

    // const product = mockProducts.find((p) => p.id === productId);
    // if (!product) {
    //   return {
    //     statusCode: 404,
    //     body: "Product not found",
    //   };
    // }

    // return {
    //   statusCode: 200,
    //   body: JSON.stringify(product),
    // };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }

  // const product = mockProducts.find((p) => p.id === productId);
};
