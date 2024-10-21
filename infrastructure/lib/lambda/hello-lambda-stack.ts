import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";

export class HelloLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getGreetingsFunction = new lambda.Function(this, "getGreetings", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: "getGreetings.main",
      code: lambda.Code.fromAsset(path.join(__dirname, "./")),
    });
  }
}
