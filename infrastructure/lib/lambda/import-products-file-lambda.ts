import { APIGatewayProxyEvent } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// trigered by HTTP GET /import?fileName=import.csv
export async function handler(event: APIGatewayProxyEvent) {
  const bucketName = process.env.BUCKET_NAME as string;
  const s3 = new S3Client({ region: process.env.AWS_REGION });
  const queryParams = event.queryStringParameters;

  if (!queryParams || !queryParams.name) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Name query parameter is required" }),
    };
  }

  const ext = queryParams.ext ?? "csv";

  const key = `uploaded/${queryParams.fileName}.${ext}`;

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3, command);

  return {
    statusCode: 200,
    body: JSON.stringify({ signedUrl }),
  };
}
