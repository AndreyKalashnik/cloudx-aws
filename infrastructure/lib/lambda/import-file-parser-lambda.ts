import { S3Event } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { parse } from "csv-parse";

export async function handler(event: S3Event) {
  const bucketName = process.env.BUCKET_NAME as string;

  if (!bucketName) {
    console.error("BUCKET_NAME is not set");
  }

  const s3 = new S3Client({ region: process.env.AWS_REGION });

  const s3Event = event.Records[0].s3;
  const objectKey = s3Event.object.key;

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  const response = await s3.send(command);

  if (response.Body instanceof Readable) {
    const s3Stream = response.Body as Readable;

    await new Promise((resolve, reject) => {
      s3Stream
        .pipe(parse({ delimiter: "|" }))
        .on("data", (data: Record<string, string>) =>
          console.log("Record", data)
        )
        .on("end", resolve)
        .on("error", reject);
    });
  } else {
    console.error("Object is not readable");
  }
}
